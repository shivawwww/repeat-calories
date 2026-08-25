export interface Address {
  address_id: string
  label: 'Home' | 'Work' | 'Other'
  full_address: string
  area: string
  city: string
  pincode: string
  landmark?: string
  is_default: boolean
  lat?: number
  lng?: number
}

export interface User {
  id: string
  name: string
  email: string
  mobile: string
  is_admin: boolean
  is_active: boolean
  auth_provider: 'credentials' | 'google'
  addresses: Address[]
  fcmTokens?: string[]
  created_at: string
  updated_at: string
}

export interface Nutrition {
  protein_g: number
  carbs_g: number
  fibre_g: number
  calories: number
}

export type MenuCategory = 'Lunch' | 'Dinner' | 'Breakfast' | 'Snacks' | 'Beverages'

export interface MenuItem {
  id: string
  name: string
  description: string
  category: MenuCategory | string
  price: number
  image_url: string
  nutrition: Nutrition
  is_available: boolean
  is_featured: boolean
  sort_order?: number
}

export interface CartItem {
  menu_item_id: string
  name: string
  price: number
  quantity: number
  image_url: string
}

export interface Cart {
  id: string
  user_id: string
  items: CartItem[]
  total_amount: number
  updated_at: string
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'payment_failed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface OrderItem {
  menu_item_id: string
  name: string
  price: number
  quantity: number
  subtotal: number
}

export interface Order {
  id: string
  order_number: string
  user_id: string
  user_snapshot: { name: string; mobile: string; email: string }
  delivery_address: Address
  items: OrderItem[]
  subtotal: number
  delivery_charge: number
  total_amount: number
  status: OrderStatus
  payment_method: 'razorpay' | 'cod'
  payment_status: PaymentStatus
  razorpay?: {
    razorpay_order_id: string
    razorpay_payment_id?: string
    razorpay_signature?: string
    payment_captured_at?: string
  }
  notes?: string
  created_at: string
  updated_at: string
}

export interface ApiResponse<T> {
  ErrorCode: '9999' | '9990'
  status: string
  message: string
  obj: T
  count?: number
}
