# Swiss Legal Chat Application - Feature-Based Architecture

## 🏗️ Architecture Overview

The application has been refactored to follow a clean feature-based architecture where:

- **`app/` folder**: Contains only routing and API endpoints
- **`lib/features/` folder**: Contains all business logic organized by features
- **`lib/shared/` folder**: Contains shared utilities and base services

## 📁 Directory Structure

```
lib/
├── features/
│   ├── auth/                          # Authentication feature
│   │   ├── data/
│   │   │   └── actions/
│   │   │       └── (removed - using auth client directly)
│   │   └── presentation/
│   │       ├── components/
│   │       │   └── login-form.tsx     # Login form component
│   │       └── pages/
│   │           ├── login-page.tsx     # Login page component
│   │           └── error-page.tsx     # Error page component
│   └── chat/                          # Chat feature
│       ├── data/
│       │   └── services/
│       │       ├── swiss-legal-service.ts      # Swiss legal RAG service
│       │       ├── lawyer-service.ts           # Lawyer recommendations
│       │       └── chat-conversation-service.ts # Chat management
│       └── presentation/
│           ├── components/
│           │   └── chat-interface.tsx # Main chat UI component
│           └── pages/
│               └── chat-page.tsx      # Chat page component
└── shared/
    ├── data/
    │   └── services/
    │       └── base_service.ts         # Base CRUD service
    ├── types/
    │   └── database.ts                 # Database types
    └── utils/
        ├── auth/
        │   ├── client.ts              # Client-side auth client
        │   ├── server.ts              # Server-side auth client
        │   └── middleware.ts          # Auth middleware
        └── cn.ts                      # Utility functions

app/
├── api/
│   ├── chat/
│   │   └── route.ts                   # Chat API endpoint
│   ├── lawyers/
│   │   └── route.ts                   # Lawyers API endpoint
│   └── auth/
│       ├── confirm/
│       │   └── route.ts               # Email confirmation
│       └── logout/
│           └── route.ts               # Logout endpoint
├── chat/
│   └── page.tsx                       # Chat route (delegates to feature)
├── login/
│   └── page.tsx                       # Login route (delegates to feature)
├── error/
│   └── page.tsx                       # Error route (delegates to feature)
├── page.tsx                           # Root route
├── layout.tsx                         # Root layout
└── middleware.ts                      # Next.js middleware
```

## 🔧 Key Components

### 1. Base Service (`lib/shared/data/services/base_service.ts`)

A generic base class that provides CRUD operations for any database table:

```typescript
export class BaseService<T extends TableName> {
  // Generic CRUD methods
  async create(data: Database['public']['Tables'][T]['Insert'])
  async getById(id: string)
  async getAll()
  async updateById(id: string, data: Database['public']['Tables'][T]['Update'])
  async deleteById(id: string)
  // ... and more
}
```

### 2. Feature-Specific Services

Each feature extends the base service for specific functionality:

- **`SwissLegalService`**: Extends `BaseRAGService` for Swiss legal AI responses
- **`LawyerService`**: Extends `BaseService` for lawyer recommendations
- **`ChatConversationService`**: Extends `BaseService` for chat management

### 3. Presentation Layer

Components are organized by feature:
- **`auth/presentation/`**: Login forms, error pages
- **`chat/presentation/`**: Chat interface, message components

## 🚀 Benefits of This Architecture

1. **Separation of Concerns**: Each feature is self-contained
2. **Reusability**: Base services can be extended for new features
3. **Maintainability**: Easy to locate and modify specific functionality
4. **Scalability**: New features can be added without affecting existing ones
5. **Testing**: Each feature can be tested independently

## 🔄 Data Flow

1. **User Interaction** → Presentation Layer (components)
2. **API Routes** → Feature Services (business logic)
3. **Feature Services** → Base Services (CRUD operations)
4. **Base Services** → Database (database operations)

## 📋 Migration Summary

### What Was Moved:
- `lib/features/legal/` → `lib/features/chat/`
- `components/chat/` → `lib/features/chat/presentation/components/`
- `app/login/actions.ts` → (using auth client directly in components)
- Login/signup logic → Auth feature
- Chat logic → Chat feature

### What Was Created:
- `BaseService` - Generic CRUD operations
- Feature-based directory structure
- Proper separation of concerns
- Type-safe service extensions

### What Was Cleaned Up:
- Removed duplicate files
- Consolidated similar functionality
- Improved type safety
- Better error handling

## 🎯 Next Steps

1. **Add more features** following the same pattern
2. **Implement proper error boundaries** in presentation layer
3. **Add comprehensive testing** for each service
4. **Implement caching strategies** in base services
5. **Add feature flags** for gradual rollouts

This architecture provides a solid foundation for scaling the Swiss Legal Chat Application while maintaining clean, maintainable code.
