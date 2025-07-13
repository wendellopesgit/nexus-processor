export type CreateOrderDto = {
  id?: string;
  customer: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
};

export type CreateOrderParams = {
  id: string;
  customer: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
};
