export interface MockOrder {
  id: string;
  customer: string;
  amount: number;
  status: 'Delivered' | 'Processing' | 'Shipped';
  date: string;
}

export const mockOrders: MockOrder[] = [
  { id: 'SH-1048', customer: 'Ananya Mehta', amount: 4299, status: 'Processing', date: '18 Nov 2026' },
  { id: 'SH-1047', customer: 'Riya Kapoor', amount: 2899, status: 'Shipped', date: '17 Nov 2026' },
  { id: 'SH-1046', customer: 'Meera Iyer', amount: 5199, status: 'Delivered', date: '16 Nov 2026' },
  { id: 'SH-1045', customer: 'Ishita Rao', amount: 1799, status: 'Delivered', date: '15 Nov 2026' },
];

export const mockBestSellers = [
  { name: 'Royal Silver Necklace', category: 'Necklaces', sold: 38 },
  { name: 'Traditional Silver Jhumkas', category: 'Earrings', sold: 31 },
  { name: 'Elegant Silver Ring', category: 'Rings', sold: 24 },
];
