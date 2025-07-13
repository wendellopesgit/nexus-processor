import { Channel } from 'amqplib';

/**
 * Interface para consumidores de mensagens
 * Define o contrato para consumo de mensagens de sistemas de mensageria
 */
export interface IMessageConsumer {
  /**
   * Conecta ao broker de mensagens
   * @throws {Error} Se a conexão falhar
   */
  connect(): Promise<void>;

  /**
   * Obtém o canal de comunicação atual
   * @returns {Channel} Canal AMQP ou null se não estiver conectado
   */
  getChannel(): Channel;

  /**
   * Obtém o nome da fila que está sendo consumida
   * @returns {string} Nome da fila
   */
  getQueueName(): string;

  /**
   * Inicia o consumo de mensagens da fila
   * @param handler Função que processará cada mensagem recebida
   * @throws {Error} Se o consumo não puder ser iniciado
   */
  consume(handler: (msg: unknown) => Promise<void>): Promise<void>;

  /**
   * Fecha a conexão com o broker de mensagens
   * @throws {Error} Se o fechamento falhar
   */
  close(): Promise<void>;
}
