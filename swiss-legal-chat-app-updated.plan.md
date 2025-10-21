# Swiss Legal Chat Application (Updated with Supabase MCP)

## Architecture Overview

- **Frontend**: ChatGPT-style interface with Shadcn UI components
- **Backend**: Next.js API routes for RAG queries and chat management
- **Auth**: Supabase email/password authentication using @supabase/ssr
- **AI**: Swiss legal RAG service extending `BaseRAGService`
- **Database**: Supabase for user sessions, chat history, and lawyer database
- **MCP Integration**: Use Supabase MCP tools for project management and database operations

## Implementation Steps

### 1. Environment & Dependencies Setup
**Files**: `.env.local`, `package.json`

Install required packages:
- `@supabase/ssr` for modern Supabase SSR integration
- `@supabase/supabase-js` for client-side operations
- `@pinecone-database/pinecone`, `@langchain/pinecone`, `@langchain/textsplitters` for RAG
- `ollama` for local LLM
- `pdf-parse` or `langchain/document_loaders` for PDF processing

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
PINECONE_API_KEY=your-pinecone-key
OLLAMA_URL=http://localhost:11434
```

### 2. Supabase Project Setup (Using MCP)
**Use Supabase MCP tools to:**

- Check existing projects: `mcp_supabase_list_projects`
- Create new project if needed: `mcp_supabase_create_project`
- Get project URL and keys: `mcp_supabase_get_project_url`, `mcp_supabase_get_anon_key`
- Generate TypeScript types: `mcp_supabase_generate_typescript_types`

### 3. Database Schema Setup (Using MCP)
**Use Supabase MCP tools to create tables:**

- Apply migrations for user profiles: `mcp_supabase_apply_migration`
- Create chat_conversations table
- Create lawyers table with specialties
- Set up Row Level Security (RLS) policies
- Create storage bucket for document uploads

Migration example:
```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING ((SELECT auth.uid()) = id);

-- Create chat conversations table
CREATE TABLE chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat messages table
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES chat_conversations(id) NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB,
  confidence DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lawyers table
CREATE TABLE lawyers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  specialties TEXT[] NOT NULL,
  location TEXT,
  languages TEXT[],
  rating DECIMAL,
  experience_years INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for all tables
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations and messages
CREATE POLICY "Users can view own conversations" ON chat_conversations FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can create own conversations" ON chat_conversations FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own conversations" ON chat_conversations FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view messages in own conversations" ON chat_messages FOR SELECT USING (
  conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = (SELECT auth.uid()))
);
CREATE POLICY "Users can insert messages in own conversations" ON chat_messages FOR INSERT WITH CHECK (
  conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = (SELECT auth.uid()))
);

-- Lawyers are public
CREATE POLICY "Lawyers are publicly readable" ON lawyers FOR SELECT USING (true);
```

### 4. Supabase Client Setup
**Files**: `lib/shared/utils/supabase.ts`

Create modern SSR-compatible Supabase clients:
```typescript
// lib/shared/utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/shared/utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore if called from Server Component
          }
        },
      },
    }
  )
}
```

### 5. Swiss Legal RAG Service
**Files**: `lib/features/legal/swiss-legal-service.ts`

Extend `BaseRAGService` with:
- Domain keywords: ["swiss law", "schweiz", "switzerland", "legal", "gesetz", "recht", "zivilrecht", "strafrecht", "familienrecht", etc.]
- Custom prompts for Swiss legal context
- Document processing for legal PDFs
- Implement abstract methods: `getNoInformationMessage()`, `buildContext()`, `getDomainPrompt()`

### 6. Lawyer Recommendation System
**Files**: `lib/features/legal/lawyer-recommendations.ts`

- Use Supabase database for lawyer data
- Category detection from chat conversation using LLM
- Recommendation logic based on discussed topics
- Return 3-5 relevant lawyers with contact info
- Store recommendation history in Supabase

### 7. Shadcn UI Components
**Files**: `components/ui/*`, `components.json`

Initialize Shadcn and add components:
- `button`, `input`, `card`, `avatar`, `scroll-area`, `separator`, `badge`, `alert`
- Custom chat components: `ChatMessage`, `ChatInput`, `ChatContainer`, `LawyerRecommendation`

### 8. API Routes with Supabase Integration
**Files**: `app/api/chat/route.ts`, `app/api/lawyers/route.ts`

**POST `/api/chat`**:
- Validate Supabase auth using `mcp_supabase_get_project`
- Call Swiss legal RAG service
- Store conversation and messages in Supabase
- Detect if conversation should end (recommendation trigger)
- Return: `{ answer, sources, confidence, shouldRecommendLawyers, conversationId }`

**GET `/api/lawyers`**:
- Accept query param: `?category=family-law`
- Query Supabase lawyers table
- Return filtered lawyer recommendations

### 9. Chat Interface
**Files**: `app/page.tsx`, `app/chat/page.tsx`, `components/chat/*`

ChatGPT-style layout:
- Left sidebar: Chat history from Supabase
- Main area: Message thread with auto-scroll
- Bottom: Input with send button
- Welcome screen with example questions
- Lawyer recommendation card at conversation end
- Real-time updates using Supabase subscriptions

### 10. Authentication Flow with Modern SSR
**Files**: `app/login/page.tsx`, `app/signup/page.tsx`, `middleware.ts`

- Login/signup pages with Supabase auth using `@supabase/ssr`
- Protected chat routes (middleware)
- Redirect unauthenticated users to login
- Use Server Actions for form submissions

### 11. Document Ingestion Script
**Files**: `scripts/ingest-documents.ts`, `data/legal-docs/`

- Script to process Swiss legal PDFs
- Store in Pinecone with proper metadata
- Upload original documents to Supabase Storage
- Run once to populate vector database

### 12. Monitoring and Logs (Using MCP)
**Use Supabase MCP tools for monitoring:**
- Check project logs: `mcp_supabase_get_logs`
- Get security advisors: `mcp_supabase_get_advisors`
- Monitor project status: `mcp_supabase_get_project`

## Key Files Created/Modified

```
lib/
  features/
    legal/
      swiss-legal-service.ts
      lawyer-recommendations.ts
  shared/
    utils/
      supabase/
        client.ts
        server.ts
        middleware.ts
      cn.ts (Shadcn utility)
components/
  ui/ (Shadcn components)
  chat/
    chat-container.tsx
    chat-message.tsx
    chat-input.tsx
    lawyer-card.tsx
app/
  api/
    chat/
      route.ts
    lawyers/
      route.ts
  login/
    page.tsx
    actions.ts
  chat/
    page.tsx
  auth/
    confirm/
      route.ts
middleware.ts
.env.local
scripts/
  ingest-documents.ts
data/
  legal-docs/ (your PDFs here)
```

## Testing Checklist

1. User can sign up/login with email using Supabase auth
2. Chat interface loads and displays welcome
3. User can send messages and receive AI responses
4. Sources are displayed with confidence scores
5. After relevant conversation, lawyer recommendations appear
6. API routes are secure (require authentication)
7. RAG retrieves relevant legal information
8. Chat history is persisted in Supabase
9. Lawyer recommendations are stored and retrieved from Supabase
10. Real-time updates work using Supabase subscriptions

## MCP Integration Benefits

- **Project Management**: Use MCP tools to manage Supabase projects programmatically
- **Database Operations**: Apply migrations and execute SQL using MCP tools
- **Monitoring**: Check logs and security advisors via MCP
- **Type Safety**: Generate TypeScript types using MCP tools
- **Edge Functions**: Deploy serverless functions using MCP tools

## To-dos

- [ ] Install dependencies and create environment configuration
- [ ] Set up Supabase project using MCP tools
- [ ] Create database schema using MCP migrations
- [ ] Initialize Shadcn UI and install required components
- [ ] Implement Swiss legal RAG service extending BaseRAGService
- [ ] Create lawyer recommendation system with Supabase database
- [ ] Build Next.js API routes for chat and lawyer recommendations
- [ ] Build ChatGPT-style chat interface with Shadcn components
- [ ] Implement login/signup pages and authentication middleware
- [ ] Create document ingestion script for Swiss legal PDFs
- [ ] Set up monitoring and logging using MCP tools
