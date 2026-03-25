export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  image_url: string;
  category: string;
  seller: string;
  is_available: boolean;
  total_sales: string;
  rating_sum?: string;
  rating_count?: string;
  quantity?: number;
  available_quantity?: number;
  resellable?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductFormData {
  title: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
  quantity: string;
  resellable: boolean;
}

export interface CartItem {
  id: string;
  title: string;
  price: string;
  imageUrl: string;
  category: string;
  seller: string;
}