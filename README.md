# Nexus Processor Architecture

Solução técnica para o desafio: Node.JS - Processamento de Eventos em Tempo Real

## Clean Architecture Layers

1. **Core**: Contém as regras de negócio, entidades e casos de uso
2. **Infrastructure**: Implementações concretas de bancos de dados, mensageria, etc.
3. **Interfaces**: Controladores, workers e pontos de entrada da aplicação

## Design Patterns Implementados

1. **Observer**: Para notificação de eventos no sistema
2. **Strategy**: Para diferentes estratégias de processamento
3. **Dependency Injection**: Para inversão de dependência
4. **Factory**: Para criação de instâncias de objetos complexos

## Fluxo de Processamento

1. Mensagem é recebida do RabbitMQ
2. OrderProcessor inicia o processamento
3. RetryHandler gerencia tentativas em caso de falha
4. ProcessOrderUseCase executa a lógica de negócio
5. Eventos são disparados para observers registrados
