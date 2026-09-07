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
  is_walkin?: boolean
  walkin_notes?: string
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
  meal_times: (MenuCategory | string)[]
  price: number
  images: string[]
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

export type MealType = 'lunch' | 'dinner'
export type MealVariant = 'normal' | 'salad' | 'wrap' | 'custom'
export type OrderSource = 'online' | 'manual'
export type OrderKind = 'one_time' | 'subscription'

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
  payment_method: 'razorpay' | 'cod' | 'manual'
  payment_status: PaymentStatus
  paid_at?: string
  source?: OrderSource
  order_kind?: OrderKind
  subscription_id?: string
  meal_type?: MealType
  meal_variant?: MealVariant
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

export interface Subscription {
  id: string
  user_id: string
  user_snapshot: { name: string; mobile: string }
  plan: SubscriptionPlan
  start_date: string
  end_date: string
  delivery_days: number[]
  lunch_price?: number
  dinner_price?: number
  price_type: 'normal' | 'custom'
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
  | 'gas'
  | 'packaging'
  | 'delivery'
  | 'staff'
  | 'rent'
  | 'other'

export interface Expense {
  id: string
  date: string
  category: ExpenseCategory
  description: string
  amount: number
  notes?: string
  created_by: string
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
