import { Channel } from 'amqplib';

/**
 * Interface para manipulação de retentativas de mensagens
 * Define o contrato para tratamento de falhas e retentativas
 */
export interface IRetryHandler {
  /**
   * Configura o handler com o canal de comunicação
   * @param channel Canal AMQP
   * @throws {Error} Se a configuração falhar
   */
  setup(channel: Channel): Promise<void>;

  /**
   * Manipula a lógica de retentativa para uma mensagem com falha
   * @param channel Canal AMQP
   * @param msg Mensagem a ser processada
   * @param handler Função que processa a mensagem
   * @param queueName Nome da fila original
   * @throws {Error} Se o tratamento de retentativa falhar
   */
  handleRetry(
    channel: Channel,
    msg: unknown,
    handler: () => Promise<void>,
    queueName: string,
  ): Promise<void>;
}
