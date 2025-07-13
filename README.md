# Nexus Processor Architecture

Solução técnica para o desafio: Node.JS - Processamento de Eventos em Tempo Real

## Contexto Funcional

Este sistema simula um processador de pedidos de e-commerce que:

1. Recebe pedidos individuais via API ou em lote
2. Processa os pedidos de forma assíncrona via RabbitMQ
3. Atualiza estoque e notifica clientes (observers)
4. Implementa resiliência com retry e DLQ

## Arquitetura

### Clean Architecture Layers

1. **Core**: Contém as regras de negócio, entidades e casos de uso
2. **Infrastructure**: Implementações concretas de bancos de dados, mensageria, etc.
3. **Interfaces**: Controladores, workers e pontos de entrada da aplicação

### Design Patterns Implementados

1. **Observer**: Para notificação de eventos no sistema (EventBus)
2. **Dependency Injection**: Para inversão de dependência (ContainerApplication)
3. **Factory**: Para criação de instâncias de objetos complexos

## Fluxo de Processamento

1. Mensagem é recebida do RabbitMQ
2. OrderProcessor inicia o processamento
3. RetryHandler gerencia tentativas em caso de falha
4. ProcessOrderUseCase executa a lógica de negócio
5. Eventos são disparados para observers registrados

## Configuração

Variáveis de ambiente necessárias:

- `RABBITMQ_URL`: URL de conexão com o RabbitMQ
- `MONGO_URL`: URL de conexão com o MongoDB

## Estratégia de Retry

O sistema implementa uma estratégia de retry com backoff exponencial:

1. Primeira falha: 1 segundo de delay
2. Segunda falha: 2 segundos de delay
3. Terceira falha: 4 segundos de delay

Após 3 tentativas (configurável), a mensagem é enviada para a Dead Letter Queue (DLQ).

Configurações:

- `RETRY_MAX_ATTEMPTS`: Número máximo de tentativas (padrão: 3)
- `RETRY_INITIAL_DELAY_MS`: Delay inicial em ms (padrão: 1000)
- `RETRY_BACKOFF_FACTOR`: Fator de multiplicação (padrão: 2)

## Execução

```bash
# Desenvolvimento
npm run dev (Comentar o trecho "app" no docker-compose.yml)

# Produção
docker compose up -d --build

# Testes
npm test

# Endpoints
POST /api/orders: Cria um novo pedido
POST /api/orders/batch: Processa um lote de pedidos
GET /api/orders/:id/status: Consulta status de um pedido
GET /api/health: Health check
```
