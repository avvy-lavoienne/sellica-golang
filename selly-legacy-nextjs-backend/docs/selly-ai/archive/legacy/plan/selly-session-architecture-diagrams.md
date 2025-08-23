# SELLY Session Management Architecture Diagrams

**Document**: Technical Architecture Visualization  
**Version**: 1.0  
**Date**: January 10, 2025  
**Status**: 📋 Architecture Reference  
**Priority**: 📚 Documentation

---

## 🏗️ **System Architecture Overview**

### **High-Level Architecture Diagram**

```mermaid
graph TB
    subgraph "Client Layer"
        UI[SELLY Chat Interface]
        Mobile[Mobile Interface]
        Desktop[Desktop Interface]
    end
    
    subgraph "Session Management Layer"
        USM[Unified Session Manager]
        CSE[Cross-Device Sync Engine]
        CWF[Conversion Workflow]
    end
    
    subgraph "Storage Layer"
        L1[L1 Cache - Memory]
        L2[L2 Cache - Redis]
        L3[L3 Storage - Supabase]
    end
    
    subgraph "Real-Time Layer"
        WS[WebSocket Server]
        PS[PubSub System]
        CRE[Conflict Resolution Engine]
    end
    
    subgraph "Analytics Layer"
        AE[Analytics Engine]
        MI[Metrics Ingestion]
        RT[Real-Time Insights]
    end
    
    UI --> USM
    Mobile --> USM
    Desktop --> USM
    
    USM --> CSE
    USM --> CWF
    USM --> L1
    
    CSE --> WS
    CSE --> PS
    CSE --> CRE
    
    L1 --> L2
    L2 --> L3
    
    USM --> AE
    AE --> MI
    AE --> RT
```

---

## 🔄 **Session Lifecycle Flow**

### **Authenticated User Session Flow**

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Chat Interface
    participant USM as Session Manager
    participant R as Redis
    participant S as Supabase
    participant PS as PersonaService
    
    U->>UI: Login & Start Chat
    UI->>USM: createSession('authenticated', userId)
    USM->>S: Validate user & create session record
    USM->>R: Store session metadata
    USM->>UI: Return sessionId
    
    U->>UI: Send message
    UI->>USM: updateSession(sessionId, message)
    USM->>R: Update conversation history
    USM->>PS: Apply persona with session context
    PS->>USM: Return enhanced response
    USM->>UI: Deliver response
    
    Note over USM,R: Real-time sync to other devices
    USM->>R: Broadcast session update
    R->>UI: Notify other devices
```

### **Guest User Session Flow**

```mermaid
sequenceDiagram
    participant G as Guest User
    participant UI as Chat Interface
    participant USM as Session Manager
    participant LS as LocalStorage
    participant R as Redis
    
    G->>UI: Start Chat (No Login)
    UI->>USM: createSession('guest')
    USM->>USM: Generate guestUUID
    USM->>LS: Store session locally
    USM->>R: Store minimal session metadata
    USM->>UI: Return sessionId
    
    G->>UI: Continue conversation
    UI->>USM: updateSession(sessionId, data)
    USM->>LS: Update local storage
    USM->>R: Update session activity
    
    Note over G,R: Guest decides to login
    G->>UI: Login
    UI->>USM: convertGuestToAuthenticated(sessionId, userId)
    USM->>R: Migrate session data
    USM->>LS: Clear guest data
    USM->>UI: Return new authenticated session
```

---

## 🌐 **Cross-Device Synchronization Architecture**

### **Multi-Device Session Sync**

```mermaid
graph LR
    subgraph "Device 1 - Mobile"
        D1[Chat Interface]
        D1C[Local Cache]
    end
    
    subgraph "Device 2 - Desktop"
        D2[Chat Interface]
        D2C[Local Cache]
    end
    
    subgraph "Device 3 - Tablet"
        D3[Chat Interface]
        D3C[Local Cache]
    end
    
    subgraph "Sync Infrastructure"
        CSE[Cross-Device Sync Engine]
        R[Redis PubSub]
        CRE[Conflict Resolution]
    end
    
    D1 <--> CSE
    D2 <--> CSE
    D3 <--> CSE
    
    CSE <--> R
    CSE <--> CRE
    
    D1C -.-> R
    D2C -.-> R
    D3C -.-> R
```

### **Conflict Resolution Flow**

```mermaid
flowchart TD
    A[Session Update from Device A] --> CR{Conflict Detected?}
    B[Session Update from Device B] --> CR
    
    CR -->|No Conflict| D[Apply Updates]
    CR -->|Conflict Detected| E[Conflict Resolution Engine]
    
    E --> F{Resolution Strategy}
    F -->|Last Write Wins| G[Apply Most Recent Update]
    F -->|Merge Compatible| H[Merge Non-Conflicting Changes]
    F -->|User Intervention| I[Request User Decision]
    
    G --> J[Broadcast Resolution]
    H --> J
    I --> J
    
    J --> K[Update All Devices]
```

---

## 💾 **Data Storage Architecture**

### **Multi-Layer Caching Strategy**

```mermaid
graph TB
    subgraph "Application Layer"
        APP[SELLY Application]
    end
    
    subgraph "L1 Cache - Memory (Sub-ms)"
        L1[In-Memory Cache]
        L1H[Hot Session Data]
        L1M[Recent Messages]
    end
    
    subgraph "L2 Cache - Redis (1-10ms)"
        L2[Redis Cache]
        L2S[Session Metadata]
        L2C[Conversation History]
        L2P[User Preferences]
    end
    
    subgraph "L3 Storage - Database (50-200ms)"
        L3[Supabase Database]
        L3S[Persistent Sessions]
        L3A[Analytics Data]
        L3U[User Profiles]
    end
    
    APP --> L1
    L1 -->|Cache Miss| L2
    L2 -->|Cache Miss| L3
    
    L1H --> L1
    L1M --> L1
    
    L2S --> L2
    L2C --> L2
    L2P --> L2
    
    L3S --> L3
    L3A --> L3
    L3U --> L3
```

### **Redis Data Partitioning**

```mermaid
graph LR
    subgraph "Hot Data (1h TTL)"
        H1[session:id:meta]
        H2[session:id:active_devices]
        H3[session:id:current_context]
    end
    
    subgraph "Warm Data (24h TTL)"
        W1[session:id:preferences]
        W2[session:id:recent_history]
        W3[session:id:metrics]
    end
    
    subgraph "Cold Data (7d TTL)"
        C1[session:id:full_history]
        C2[session:id:analytics]
        C3[session:id:device_history]
    end
    
    subgraph "Real-Time Channels"
        RT1[session:id:updates]
        RT2[session:id:sync]
        RT3[session:id:conflicts]
    end
```

---

## 🔄 **Guest-to-Authenticated Conversion Flow**

### **Conversion Process Architecture**

```mermaid
flowchart TD
    A[Guest Session Active] --> B{Conversion Trigger}
    B -->|User Login| C[Validate Guest Session]
    B -->|Sensitive Action| C
    B -->|Extended Usage| C
    
    C --> D{Validation Success?}
    D -->|No| E[Handle Validation Error]
    D -->|Yes| F[Prepare Conversion Data]
    
    F --> G[Create Authenticated Session]
    G --> H[Migrate Conversation History]
    H --> I[Transfer User Preferences]
    I --> J[Update Session References]
    J --> K[Archive Guest Session]
    K --> L[Notify Conversion Complete]
    
    E --> M[Fallback to Guest Mode]
    L --> N[Update Client Session]
```

### **Data Migration Flow**

```mermaid
sequenceDiagram
    participant GS as Guest Session
    participant CM as Conversion Manager
    participant AS as Auth Session
    participant R as Redis
    participant S as Supabase
    
    Note over GS,S: Conversion Process Start
    CM->>GS: Extract session data
    CM->>CM: Validate data integrity
    CM->>AS: Create authenticated session
    CM->>R: Migrate Redis data
    CM->>S: Create persistent record
    
    Note over CM,S: Data Transfer
    CM->>AS: Transfer conversation history
    CM->>AS: Migrate user preferences
    CM->>AS: Copy administrative context
    
    Note over CM,S: Cleanup & Finalization
    CM->>GS: Archive guest session
    CM->>R: Update session references
    CM->>S: Commit transaction
    CM->>AS: Activate new session
```

---

## 📊 **Analytics & Monitoring Architecture**

### **Real-Time Analytics Pipeline**

```mermaid
graph TB
    subgraph "Event Sources"
        UI[UI Interactions]
        API[API Calls]
        SYS[System Events]
    end
    
    subgraph "Event Processing"
        EI[Event Ingestion]
        EP[Event Processing]
        EA[Event Aggregation]
    end
    
    subgraph "Storage & Analysis"
        TS[Time Series DB]
        AS[Analytics Store]
        ML[ML Pipeline]
    end
    
    subgraph "Visualization"
        RT[Real-Time Dashboard]
        BI[Business Intelligence]
        AL[Alerting System]
    end
    
    UI --> EI
    API --> EI
    SYS --> EI
    
    EI --> EP
    EP --> EA
    
    EA --> TS
    EA --> AS
    AS --> ML
    
    TS --> RT
    AS --> BI
    ML --> AL
```

### **Performance Monitoring Flow**

```mermaid
flowchart LR
    subgraph "Metrics Collection"
        M1[Session Metrics]
        M2[Cache Metrics]
        M3[Sync Metrics]
        M4[Error Metrics]
    end
    
    subgraph "Processing"
        AGG[Aggregation Engine]
        THR[Threshold Checker]
        TRE[Trend Engine]
    end
    
    subgraph "Actions"
        DASH[Update Dashboards]
        ALERT[Trigger Alerts]
        AUTO[Auto-scaling]
        OPT[Optimization]
    end
    
    M1 --> AGG
    M2 --> AGG
    M3 --> AGG
    M4 --> AGG
    
    AGG --> THR
    AGG --> TRE
    
    THR --> ALERT
    TRE --> DASH
    ALERT --> AUTO
    TRE --> OPT
```

---

## 🔒 **Security Architecture**

### **Session Security Framework**

```mermaid
graph TB
    subgraph "Security Layers"
        AUTH[Authentication Layer]
        AUTHZ[Authorization Layer]
        ENC[Encryption Layer]
        AUDIT[Audit Layer]
    end
    
    subgraph "Session Protection"
        TOKEN[Token Validation]
        CSRF[CSRF Protection]
        XSS[XSS Prevention]
        RATE[Rate Limiting]
    end
    
    subgraph "Data Protection"
        ENCRYPT[Data Encryption]
        MASK[Data Masking]
        ANON[Anonymization]
        RETENTION[Retention Policies]
    end
    
    AUTH --> TOKEN
    AUTHZ --> CSRF
    ENC --> ENCRYPT
    AUDIT --> MASK
    
    TOKEN --> XSS
    CSRF --> RATE
    ENCRYPT --> ANON
    MASK --> RETENTION
```

---

## 🚀 **Deployment Architecture**

### **Blue-Green Deployment Strategy**

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Traffic Router]
    end
    
    subgraph "Blue Environment (Current)"
        B1[Session Manager v1]
        B2[Redis Cluster v1]
        B3[Application v1]
    end
    
    subgraph "Green Environment (New)"
        G1[Session Manager v2]
        G2[Redis Cluster v2]
        G3[Application v2]
    end
    
    subgraph "Shared Resources"
        DB[Supabase Database]
        MON[Monitoring]
    end
    
    LB -->|100% Traffic| B1
    LB -.->|0% Traffic| G1
    
    B1 --> B2
    B2 --> B3
    B3 --> DB
    
    G1 --> G2
    G2 --> G3
    G3 --> DB
    
    B3 --> MON
    G3 --> MON
```

---

*These architectural diagrams provide visual representation of the enhanced SELLY session management system, illustrating the complex interactions between components and the flow of data through the system.*
