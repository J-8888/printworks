export type OrderStatus = 'Pending' | 'Printing' | 'Payment Required' | 'Collected';

export interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  item: string;
  totalGbp: number;
  status: OrderStatus;
  notes: string;
  phone: string;
  createdAt: Date;
}
