export interface User { id: string; name: string; email: string }
export interface AuthResponse { token: string; user: User }
export interface Book { id: string; title: string; author: string; category: string; price: number; cover: string; description: string }
export interface Review { id: string; bookId: string; user: User; rating: number; content: string; createdAt: string }
export interface CartItem { book: Book; quantity: number }
