# Nexus Processor Architecture 🚀

Solução técnica para o desafio: Node.JS - Processamento de Eventos em Tempo Real

![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.12-orange)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

Solução técnica para processamento de eventos em tempo real com Node.js, RabbitMQ e MongoDB.

## 📋 Contexto Funcional

Sistema de processamento de pedidos de e-commerce com:

✔️ Recebimento de pedidos individuais ou em lote  
✔️ Processamento assíncrono via RabbitMQ  
✔️ Atualização de estoque e notificação de clientes  
✔️ Mecanismos de resiliência (retry + DLQ)

## 🏗️ Arquitetura

### Camadas (Clean Architecture)

| Camada         | Responsabilidade              | Componentes Principais      |
| -------------- | ----------------------------- | --------------------------- |
| **Core**       | Regras de negócio e entidades | Order, EventBus, Observers  |
| **Infra**      | Implementações concretas      | RabbitMQ, MongoDB, Express  |
| **Interfaces** | Pontos de entrada             | API REST, Message Consumers |

### Padrões de Projeto

| Padrão                   | Aplicação                         | Benefícios                       |
| ------------------------ | --------------------------------- | -------------------------------- |
| **Observer**             | Notificação de eventos (EventBus) | Desacoplamento entre componentes |
| **Dependency Injection** | Injeção de dependências           | Testabilidade e flexibilidade    |

## 🔄 Fluxo de Mensagens

```mermaid
sequenceDiagram
    participant Cliente
    participant API
    participant RabbitMQ
    participant Processor
    participant MongoDB
    participant EventBus

    Cliente->>API: POST /api/orders
    API->>RabbitMQ: Publica mensagem
    RabbitMQ->>Processor: Consome mensagem
    Processor->>MongoDB: Atualiza status
    Processor->>EventBus: Notifica eventos
    EventBus->>Inventory: Atualiza estoque
    EventBus->>Notifier: Envia email
```

Visualiza o diagrama em: https://www.mermaidchart.com/

## 🛠️ Configuração

```bash
# Variáveis obrigatórias
RABBITMQ_URL="amqp://user:pass@host:port/vhost"
MONGO_URL="mongodb://user:pass@host:port/db?authSource=admin"

# Configurações de resiliência (opcionais)
RETRY_MAX_ATTEMPTS=3       # Tentativas antes de DLQ
RETRY_INITIAL_DELAY_MS=1000 # Delay inicial em ms
RETRY_BACKOFF_FACTOR=2     # Fator exponencial
```

## 🚀 Execução

```bash
# Ambiente de desenvolvimento
npm run dev

# Produção com Docker
docker compose up -d --build

# Testes
npm test                # Unitários
npm run test:integration # Integração

# Health Check
curl http://localhost:3000/api/health
```

# Nexus Processor - Postman Collection 🚀

![Postman](https://img.shields.io/badge/Postman-Collection-orange)
![API Testing](https://img.shields.io/badge/Testing-API-blue)

Coleção completa para testar todos os endpoints da API Nexus Processor.

## 📦 O que contém

- Testes funcionais para validação do processamento de pedidos
- Fluxos completos de:
  - Health Check
  - Pedidos individuais
  - Processamento em lote
  - Consulta de status

## 🔗 Como usar

1. Importe o arquivo `Nexus Processor.postman_collection.json` no Postman
2. Configure as variáveis de ambiente:
   ```json
   {
     "base_url": "http://localhost:3000",
     "timestamp": "",
     "orderId": ""
   }
   ```

## 🔄 Fluxo de Teste

1. **Health Check**  
   Verifica disponibilidade da API (`GET /api/health`)

2. **Pedido Individual**

   ```json
   POST /api/orders
   {
     "customer": "Cliente Teste",
     "items": [{
       "productId": "prod-1",
       "quantity": 2,
       "price": 19.99
     }]
   }
   ```

3. **Pedido com Excesso de Itens**  
   Testa validação de limite (máx. 10 itens)

4. **Processamento em Lote**

   ```json
   POST /api/orders/batch
   {
     "customer": "John Doe",
     "orders": [
       { "items": [...] },
       { "items": [...] }
     ]
   }
   ```

5. **Consulta de Status**  
   Usa o `orderId` gerado anteriormente:  
   `GET /api/orders/{{orderId}}/status`

## 📊 Estratégia de Resiliência

```mermaid
graph LR
    A[Request] --> B{Sucesso?}
    B -->|Sim| C[Processa]
    B -->|Não| D{Contagem < 3?}
    D -->|Sim| E[Espera backoff]
    E --> F[Retry]
    D -->|Não| G[DLQ]
```

| Tentativa | Delay | Ação                |
| --------- | ----- | ------------------- |
| 1         | 1s    | Retry imediato      |
| 2         | 2s    | Backoff exponencial |
| 3         | 4s    | Envia para DLQ      |

Visualiza o diagrama em: https://www.mermaidchart.com/
