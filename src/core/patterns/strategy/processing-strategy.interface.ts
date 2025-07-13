import { Order } from '@core/entities/order.entity';

/**
 * Interface para estratégias de processamento
 */
export interface IProcessingStrategy {
  /**
   * Processa um pedido de acordo com a estratégia implementada
   * @param order Pedido a ser processado
   */
  process(order: Order): Promise<void>;

  /**
   * Processa um lote de pedidos (opcional)
   * @param orders Array de pedidos
   */
  processBatch?(orders: Order[]): Promise<void>;
}
