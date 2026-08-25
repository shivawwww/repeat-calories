import { CartItem } from '@/types/models'

export function computeTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}
