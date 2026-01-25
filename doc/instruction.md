# 架构

**ces** 


``` Mermaid 
sequenceDiagram
    participant User as 用户 (Angular)
    participant Java as Spring Boot (WebFlux)
    participant Python as FastAPI (LangGraph)
    participant DB as PostgreSQL (pgvector)
    participant LLM as Model (vLLM/OpenAI)

    Note over User, Java: 1. 建立 SSE 连接
    User->>Java: POST /api/chat (Query + JWT)
    
    Note over Java: 2. 业务处理
    Java->>Java: 验证 Token & 限流检查 (Rate Limiting)
    
    Note over Java, Python: 3. 异步转发 (Non-blocking)
    Java->>Python: POST /agent/stream (Clean Prompt)
    
    activate Python
    Note over Python: 4. LangGraph 启动
    Python->>DB: 混合检索 (Keyword + Vector) [5]
    DB-->>Python: 返回 Top-K 文档片段
    
    Python->>LLM: 发送 Prompt + 上下文
    
    loop 流式生成 (Streaming)
        LLM-->>Python: 生成 Token 块
        Python-->>Java: SSE Event (data: chunk)
        Java-->>User: 透明转发 (Flux flush)
    end
    
    Note over Python: 5. 后处理
    Python->>DB: 异步保存对话历史 (可选)
    deactivate Python
```

```Mermaid
graph TD
    %% 前端层 (Micro-Frontend)
    subgraph Frontend [Angular Client -Micro-Frontend]
        Shell[Host App -Shell]
        AIRemote[AI Remote Module -MFE]
    end

    %% 业务网关层 (Java)
    subgraph Backend_Java [Java Spring Boot -WebFlux]
        Gateway[API Gateway / BFF]
        Auth[Auth & Rate Limiting]
        Circuit[Circuit Breaker -Resilience4j]
    end

    %% AI 推理层 (Python)
    subgraph AI_Service_Python [Python FastAPI -Sidecar]
        API[FastAPI Endpoint]
        Orchestrator[LangGraph Orchestrator]
        
        subgraph Nodes [Agent State Nodes]
            Retriever[Retrieval Node]
            Reasoning[LLM Reasoning Node]
            Tools[Tool Execution Node]
        end
    end

    %% 数据与模型层
    subgraph Data_Infrastructure
        PG[(PostgreSQL)]
        Vector[(pgvector Extension)]
        LLM_Provider[Model Provider -vLLM / OpenAI]
    end

    %% 连接关系
    Shell -->|Loads| AIRemote
    AIRemote -->|SSE Stream| Gateway
    Gateway -->|Async HTTP/gRPC| API
    
    API --> Orchestrator
    Orchestrator --> Nodes
    
    Retriever -->|Hybrid Search| PG
    Retriever -->|Vector Search| Vector
    Reasoning -->|Inference| LLM_Provider
```



[Mermaid地址](https://mermaid.ai/app/projects/a2d2c1bf-fa7d-4bc5-a183-c94a3dd48f2c/diagrams/df70991c-1474-4514-b0bb-d50b92c7770e/version/v0.1/edit)
```Mermaid
graph TD
    %% 样式定义
    classDef java fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef db fill:#fff3e0,stroke:#e65100,stroke-width:2px;
    classDef gateway fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;
    classDef ext fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px;

    User((用户)) -->|HTTPS| Ingress[(API Gateway
    入口网关)]:::gateway
    
    subgraph "核心业务域 (Private Cloud)"
        Ingress -->|路由转发| Agent[(智能体Agent
        Spring Boot + LangChain4j)]:::java
        
        Agent <-->|读写历史| Mongo[(MongoDB\n长期记忆)]:::db
        Agent <-->|向量检索| VectorDB[(PgVector\n长期知识库)]:::db
    end
    
    subgraph "MCP 工具生态"
        Agent <==>|MCP 协议| ToolA[(MCP Server\n数据库查询工具)]:::ext
        Agent <==>|MCP 协议| ToolB[(MCP Server\n网络搜索工具)]:::ext
    end

    subgraph "大模型服务域"
        Agent -->|构建 Prompt| Proxy[(API Gateway\n出口代理/审计)]:::gateway
        Proxy -->|鉴权 & 流控| LLM(大语言模型\nOpenAI / DeepSeek):::ext
    end
```

