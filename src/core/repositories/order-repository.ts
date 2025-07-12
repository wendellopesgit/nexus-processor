/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IOrderRepository {
  save(order: any): Promise<void>;
  findById(id: string): Promise<any>;
  updateOrderStatus(id: string, status: string): Promise<void>;
}
