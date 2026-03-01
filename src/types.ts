export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  imageUrl?: string;
  barcode?: string;
  variations?: Variation[];
  status: 'Ativo' | 'Inativo';
  createdAt: any;
}

export interface Variation {
  id: string;
  name: string;
  value: string;
  stock: number;
}

export interface Sale {
  id: string;
  date: any;
  items: SaleItem[];
  total: number;
  subtotal: number;
  discount: number;
  paymentMethod: 'cash' | 'pix' | 'card' | 'credit';
  customerId?: string;
  customerName?: string;
  sellerId: string;
  sellerName: string;
  status: 'completed' | 'pending' | 'cancelled';
}

export interface SaleItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: number;
  debt: number;
  observations?: string;
  createdAt: any;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: any;
  description: string;
  relatedId?: string; // Sale ID or Purchase ID
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  type: 'entry' | 'exit' | 'adjustment';
  reason: string;
  date: any;
  userId: string;
  userName: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  total: number;
  status: 'received' | 'preparing' | 'shipped' | 'delivered';
  type: 'delivery' | 'pickup';
  address?: string;
  deliveryPersonId?: string;
  date: any;
}

export type UserRole = 'admin' | 'manager' | 'seller';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  tipo: 'admin' | 'vendedor' | 'gerente'; // Matching the security rules
  photoURL?: string;
}
