# 整体架构

**ces** 


整体架构设计
我们将系统分为四层：接入层、应用层、数据层、基础设施层。

```Mermaid
graph TD
    %% ==========================================
    %% 外部层
    %% ==========================================
    User(("用户 / 前端"))
    LLM_Provider["外部大模型 API\n(OpenAI / DeepSeek)"]
    
    %% ==========================================
    %% 网关层 (Spring Cloud Gateway)
    %% ==========================================
    subgraph "接入层 (DMZ)"
        Gateway["API Gateway\n(Spring Cloud Gateway + WebFlux)"]
        style Gateway fill:#f3e5f5,stroke:#4a148c
    end

    %% ==========================================
    %% 服务治理
    %% ==========================================
    subgraph "基础设施 (Infra)"
        Nacos["Nacos Cluster\n(注册 & 配置中心)"]
        style Nacos fill:#e3f2fd,stroke:#0d47a1
    end

    %% ==========================================
    %% 内部服务层
    %% ==========================================
    subgraph "应用层 (Microservices)"
        %% Java 服务
        JavaApp["Java 业务服务\n(Spring Boot + LangChain4j)\n职责：RAG, 业务工具, MCP Host"]
        style JavaApp fill:#e8f5e9,stroke:#1b5e20
        
        %% Python 服务
        PythonApp["Python Agent 服务\n(FastAPI + LangGraph)\n职责：复杂推理, 编排"]
        style PythonApp fill:#fff3e0,stroke:#e65100
        
        %% 互通
        JavaApp <==>|"内部调用 (HTTP/RPC)"| PythonApp
        JavaApp -.-> Nacos
        PythonApp -.-> Nacos
    end

    %% ==========================================
    %% 数据层
    %% ==========================================
    subgraph "数据层 (Persistence)"
        PgVector[("PostgreSQL (PgVector)\n长期记忆")]
        Mongo[("MongoDB\n短期记忆 (Chat Memory)")]
    end

    %% ==========================================
    %% 连线
    %% ==========================================
    User ==>|"1. HTTPS/WebSocket"| Gateway
    Gateway ==>|"2. 路由分发"| JavaApp
    Gateway ==>|"2. 路由分发"| PythonApp
    
    JavaApp --> PgVector
    JavaApp --> Mongo
    
    %% AI Proxy 模式
    JavaApp -.->|"3. 请求 LLM"| Gateway
    PythonApp -.->|"3. 请求 LLM"| Gateway
    Gateway -.->|"4. 鉴权/计费/审计"| LLM_Provider
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

