/**
 * Interface para produtores de mensagens
 * Define o contrato para publicação de mensagens em sistemas de mensageria
 */
export interface IMessageProducer {
  /**
   * Conecta ao broker de mensagens
   * @throws {Error} Se a conexão falhar
   */
  connect(): Promise<void>;

  /**
   * Publica uma mensagem em uma fila/exchange específica
   * @param routingKey Rota/chave de roteamento para a mensagem
   * @param message Conteúdo da mensagem a ser publicado
   * @throws {Error} Se a publicação falhar após todas as tentativas
   */
  publish(routingKey: string, message: unknown): Promise<void>;

  /**
   * Fecha a conexão com o broker de mensagens
   * @throws {Error} Se o fechamento falhar
   */
  close(): Promise<void>;
}
