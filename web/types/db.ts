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
  payment_method: 'razorpay' | 'cod'
  payment_status: string
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

export interface CounterDoc {
  _id: string
  seq: number
}
