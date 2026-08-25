import { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { getRazorpayClient } from '@/lib/razorpay'
import { generateOrderNumber } from '@/lib/orderNumber'
import { isCategoryOrderable, cutoffMessage } from '@/lib/orderCutoff'
import { nowIST } from '@/lib/datetime'
import { notifyAdminOfNewOrder } from '@/lib/notify'
import { CartItem, OrderItem } from '@/types/models'
import { UserDoc, CartDoc, MenuItemDoc, OrderDoc } from '@/types/db'

const MIN_ORDER_AMOUNT = Number(process.env.MIN_ORDER_AMOUNT ?? 199)
const DELIVERY_CHARGE = Number(process.env.DELIVERY_CHARGE ?? 40)
const FREE_DELIVERY_ABOVE = Number(process.env.FREE_DELIVERY_ABOVE ?? 499)

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return fail('Unauthorized', 401)

  const body = await req.json().catch(() => null)
  const address_id = body?.address_id
  const notes = body?.notes ?? ''
  const payment_method: 'razorpay' | 'cod' = body?.payment_method === 'cod' ? 'cod' : 'razorpay'

  const db = await getDb()
  const user = await db.collection<UserDoc>('users').findOne({ _id: currentUser.userId })
  if (!user) return fail('User not found', 404)

  const addresses = user.addresses ?? []
  const address = address_id
    ? addresses.find((a) => a.address_id === address_id)
    : addresses.find((a) => a.is_default) ?? addresses[0]

  if (!address) return fail('Please add a delivery address before checkout', 400)

  const cart = await db.collection<CartDoc>('carts').findOne({ user_id: currentUser.userId })
  const cartItems: CartItem[] = cart?.items ?? []
  if (cartItems.length === 0) return fail('Your cart is empty', 400)

  const menuItems = await db
    .collection<MenuItemDoc>('menu_items')
    .find({ _id: { $in: cartItems.map((i) => i.menu_item_id) } })
    .toArray()

  const orderItems: OrderItem[] = []
  for (const cartItem of cartItems) {
    const menuItem = menuItems.find((m) => m._id === cartItem.menu_item_id)
    if (!menuItem || !menuItem.is_available) {
      return fail(`"${cartItem.name}" is no longer available. Please remove it from your cart.`, 400)
    }
    if (!isCategoryOrderable(menuItem.category)) {
      return fail(cutoffMessage(menuItem.category) ?? `${menuItem.category} is not orderable right now`, 400)
    }
    orderItems.push({
      menu_item_id: menuItem._id,
      name: menuItem.name,
      price: menuItem.price, // re-priced from the current menu, not the possibly-stale cart value
      quantity: cartItem.quantity,
      subtotal: menuItem.price * cartItem.quantity,
    })
  }

  const subtotal = orderItems.reduce((sum, i) => sum + i.subtotal, 0)
  if (subtotal < MIN_ORDER_AMOUNT) {
    return fail(`Minimum order amount is ₹${MIN_ORDER_AMOUNT}`, 400)
  }
  const delivery_charge = subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_CHARGE
  const total_amount = subtotal + delivery_charge

  const order_number = await generateOrderNumber(db)
  const now = nowIST()

  const deliveryAddress = {
    address_id: address.address_id,
    label: address.label,
    full_address: address.full_address,
    area: address.area,
    city: address.city,
    pincode: address.pincode,
    landmark: address.landmark,
    lat: address.lat,
    lng: address.lng,
  }

  const orderDoc: Record<string, unknown> = {
    _id: uuidv4(),
    order_number,
    user_id: currentUser.userId,
    user_snapshot: { name: user.name, mobile: user.mobile, email: user.email },
    delivery_address: deliveryAddress,
    items: orderItems,
    subtotal,
    delivery_charge,
    total_amount,
    payment_method,
    notes,
    created_at: now,
    updated_at: now,
  }

  if (payment_method === 'cod') {
    orderDoc.status = 'confirmed'
    orderDoc.payment_status = 'pending'
    await db.collection<OrderDoc>('orders').insertOne(orderDoc as unknown as OrderDoc)
    await db.collection<CartDoc>('carts').updateOne(
      { user_id: currentUser.userId },
      { $set: { items: [], total_amount: 0, updated_at: now } }
    )
    await notifyAdminOfNewOrder(db, order_number, total_amount)

    return success('Order placed (Cash on Delivery)', { order_number, total_amount, payment_method })
  }

  const razorpay = getRazorpayClient()
  const rzpOrder = await razorpay.orders.create({
    amount: Math.round(total_amount * 100),
    currency: 'INR',
    receipt: order_number,
  })

  orderDoc.status = 'pending'
  orderDoc.payment_status = 'pending'
  orderDoc.razorpay = { razorpay_order_id: rzpOrder.id }

  await db.collection<OrderDoc>('orders').insertOne(orderDoc as unknown as OrderDoc)

  return success('Razorpay order created', {
    razorpay_order_id: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    key_id: process.env.RAZORPAY_KEY_ID,
    order_number,
  })
}
