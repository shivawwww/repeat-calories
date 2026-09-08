// MongoDB document shapes — every collection uses a uuid string _id (not ObjectId),
// so these are declared explicitly and passed as generics to db.collection<T>(name).

export interface AddressDoc {
  address_id: string
  label: string
  full_address: string
  area: string
  city: string
  pincode: string
  landmark?: string
  is_default: boolean
  lat?: number
  lng?: number
}

export interface UserDoc {
  _id: string
  name: string
  email: string
  mobile: string
  password_hash: string | null
  auth_provider: 'credentials' | 'google'
  is_active: boolean
  is_admin: boolean
  activation_token: string | null
  activation_token_expires: string | null
  reset_token: string | null
  reset_token_expires: string | null
  fcmTokens: string[]
  addresses: AddressDoc[]
  // Admin-created "walk-in" customer (orders taken over WhatsApp/phone). Cannot log in:
  // password_hash is null, is_active is false, email is a synthetic placeholder.
  is_walkin?: boolean
  walkin_notes?: string
  created_at: string
  updated_at: string
}

export interface NutritionDoc {
  protein_g: number
  carbs_g: number
  fibre_g: number
  calories: number
}

export interface MenuItemDoc {
  _id: string
  name: string
  description: string
  meal_times: string[]
  price: number
  images: string[]
  nutrition: NutritionDoc
  is_available: boolean
  is_featured: boolean
  sort_order?: number
  created_at: string
}

// Compressed image bytes stored directly in Mongo — served back out via
// GET /api/menu/image/[id]. Kept in its own collection (not embedded in
// MenuItemDoc) so listing menu items never has to ship image bytes as JSON.
export interface MenuItemImageDoc {
  _id: string
  mime_type: string
  data: Buffer
  size: number
  created_at: string
}

export interface CartItemDoc {
  menu_item_id: string
  name: string
  price: number
  quantity: number
  image_url: string
}

export interface CartDoc {
  _id: string
  user_id: string
  items: CartItemDoc[]
  total_amount: number
  updated_at: string
}

export interface OrderItemDoc {
  menu_item_id: string
  name: string
  price: number
  quantity: number
  subtotal: number
}

export type MealType = 'lunch' | 'dinner'
export type MealVariant = 'normal' | 'salad' | 'wrap' | 'custom'
export type OrderSource = 'online' | 'manual'
export type OrderKind = 'one_time' | 'subscription'
// Did this meal actually go out? Admin marks it each day. 'skipped' meals don't
// count as delivered and can be made up by extending the subscription.
export type DeliveryState = 'pending' | 'delivered' | 'skipped'

export interface OrderDoc {
  _id: string
  order_number: string
  user_id: string
  user_snapshot: { name: string; mobile: string; email: string }
  delivery_address: Omit<AddressDoc, 'is_default'>
  items: OrderItemDoc[]
  subtotal: number
  delivery_charge: number
  total_amount: number
  status: string
  payment_method: 'razorpay' | 'cod' | 'manual'
  payment_status: string
  // Set the moment money actually lands — Razorpay capture, or an admin marking a
  // manual order paid. Drives the dashboard "Today Received" figure.
  paid_at?: string
  // 'online' = placed by a customer through the website; 'manual' = logged by the
  // admin (walk-in order or auto-generated from a subscription).
  source?: OrderSource
  order_kind?: OrderKind
  subscription_id?: string
  meal_type?: MealType
  meal_variant?: MealVariant
  delivery_state?: DeliveryState
  delivery_marked_at?: string
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

export type SubscriptionPlan = 'lunch' | 'dinner' | 'lunch_dinner'
export type SubscriptionStatus = 'active' | 'paused' | 'ended'

export interface SubscriptionDoc {
  _id: string
  user_id: string
  user_snapshot: { name: string; mobile: string }
  plan: SubscriptionPlan
  start_date: string // 'YYYY-MM-DD' IST
  end_date: string // 'YYYY-MM-DD' IST
  delivery_days: number[] // weekday numbers, 0=Sun .. 6=Sat
  lunch_price?: number
  dinner_price?: number
  price_type: 'normal' | 'custom'
  // Alternating salad / wrap on one meal slot — only meaningful for 'lunch_dinner'.
  rotation_enabled: boolean
  rotation_applies_to: MealType
  rotation_start_with: 'salad' | 'wrap'
  status: SubscriptionStatus
  notes?: string
  generated_count: number
  total_amount: number
  created_at: string
  updated_at: string
}

export type ExpenseCategory =
  | 'groceries'
  | 'chicken'
  | 'gas'
  | 'packaging'
  | 'delivery'
  | 'staff'
  | 'rent'
  | 'other'

export interface ExpenseDoc {
  _id: string
  date: string // 'YYYY-MM-DD' IST
  category: ExpenseCategory
  description: string
  amount: number
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface CounterDoc {
  _id: string
  seq: number
}
