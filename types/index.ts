export interface Student {
  id: string;
  matricNumber: string;
  email: string;
  imageUrl: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: ProductCategory;
  condition: ProductCondition;
  monetaryWorth: number;
  images: string[];
  forSale: boolean;
  salePrice: number | null;
  status: ProductStatus;
  studentId: string;
  student?: Student;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductCategory = 
  | 'Electronics'
  | 'Books'
  | 'Furniture'
  | 'Clothing'
  | 'Sports Equipment'
  | 'Musical Instruments'
  | 'Stationery'
  | 'Kitchen Items'
  | 'Decorations'
  | 'Other';

export type ProductCondition = 
  | 'Brand New'
  | 'Like New'
  | 'Good'
  | 'Fair'
  | 'Poor';

export type ProductStatus = 
  | 'available'
  | 'exchanged'
  | 'sold'
  | 'deleted';

export type ExchangeStatus = 
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export type NotificationType = 
  | 'exchange_request'
  | 'exchange_accepted'
  | 'exchange_rejected'
  | 'message'
  | 'product_deleted';

export interface CreateProductInput {
  title: string;
  description: string;
  category: ProductCategory;
  condition: ProductCondition;
  monetaryWorth: number;
  images: string[];
  forSale: boolean;
  salePrice?: number;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
}

export interface ExchangeRequest {
  id: string;
  requesterId: string;
  requester: Student;
  receiverId: string;
  receiver: Student;
  requestedProductId: string;
  requestedProduct: Product;
  offeredProductId: string;
  offeredProduct: Product;
  status: ExchangeStatus;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  exchangeRequestId: string;
  senderId: string;
  sender: Student;
  recipientId: string;
  recipient: Student;
  content: string;
  read: boolean;
  createdAt: Date;
}

export interface Notification {
  id: string;
  studentId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data: any;
  createdAt: Date;
}

export interface StudentRegistrationInput {
  matricNumber: string;
  email: string;
  name: string;
  image: File;
}

export interface CSVStudentRow {
  matricNumber: string;
  email: string;
  name: string;
  imageUrl?: string;
}