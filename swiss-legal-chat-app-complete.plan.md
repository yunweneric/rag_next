# Swiss Legal Chat Application (Complete with Email/Password Auth)

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
```bash
npm install @supabase/ssr @supabase/supabase-js @pinecone-database/pinecone @langchain/pinecone @langchain/textsplitters ollama pdf-parse
```

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

Apply migration using `mcp_supabase_apply_migration`:

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

-- Set up Storage for avatars
INSERT INTO storage.buckets (id, name) VALUES ('avatars', 'avatars');

-- Set up access controls for storage
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload an avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Anyone can update their own avatar" ON storage.objects FOR UPDATE USING ((SELECT auth.uid()) = owner) WITH CHECK (bucket_id = 'avatars');

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### 4. Supabase Client Setup (Modern SSR)
**Files**: `lib/shared/utils/supabase/`

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

// lib/shared/utils/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshing the auth token
  await supabase.auth.getUser()

  return supabaseResponse
}
```

### 5. Authentication Components
**Files**: `app/login/page.tsx`, `app/login/actions.ts`, `app/auth/confirm/route.ts`

**Login Page with Email/Password:**
```tsx
// app/login/page.tsx
import { login, signup } from './actions'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Swiss Legal Assistant
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to get legal advice
          </p>
        </div>
        <form className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div className="flex space-x-4">
            <button
              formAction={login}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Sign In
            </button>
            <button
              formAction={signup}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

**Server Actions for Authentication:**
```typescript
// app/login/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/shared/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/chat')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/chat')
}
```

**Email Confirmation Route:**
```typescript
// app/auth/confirm/route.ts
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = '/chat'

  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      redirectTo.searchParams.delete('next')
      return NextResponse.redirect(redirectTo)
    }
  }

  redirectTo.pathname = '/error'
  return NextResponse.redirect(redirectTo)
}
```

### 6. Middleware for Protected Routes
**Files**: `middleware.ts`

```typescript
// middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/shared/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 7. Swiss Legal RAG Service
**Files**: `lib/features/legal/swiss-legal-service.ts`

Extend `BaseRAGService` with:
- Domain keywords: ["swiss law", "schweiz", "switzerland", "legal", "gesetz", "recht", "zivilrecht", "strafrecht", "familienrecht", etc.]
- Custom prompts for Swiss legal context
- Document processing for legal PDFs
- Implement abstract methods: `getNoInformationMessage()`, `buildContext()`, `getDomainPrompt()`

### 8. Lawyer Recommendation System
**Files**: `lib/features/legal/lawyer-recommendations.ts`

- Use Supabase database for lawyer data
- Category detection from chat conversation using LLM
- Recommendation logic based on discussed topics
- Return 3-5 relevant lawyers with contact info
- Store recommendation history in Supabase

### 9. Shadcn UI Components
**Files**: `components/ui/*`, `components.json`

Initialize Shadcn and add components:
- `button`, `input`, `card`, `avatar`, `scroll-area`, `separator`, `badge`, `alert`
- Custom chat components: `ChatMessage`, `ChatInput`, `ChatContainer`, `LawyerRecommendation`

### 10. API Routes with Authentication
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

### 11. Chat Interface with Authentication
**Files**: `app/page.tsx`, `app/chat/page.tsx`, `components/chat/*`

ChatGPT-style layout:
- Protected routes that redirect to login if not authenticated
- Left sidebar: Chat history from Supabase
- Main area: Message thread with auto-scroll
- Bottom: Input with send button
- Welcome screen with example questions
- Lawyer recommendation card at conversation end
- Real-time updates using Supabase subscriptions

### 12. Document Ingestion Script
**Files**: `scripts/ingest-documents.ts`, `data/legal-docs/`

- Script to process Swiss legal PDFs
- Store in Pinecone with proper metadata
- Upload original documents to Supabase Storage
- Run once to populate vector database

### 13. Monitoring and Logs (Using MCP)
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

## Authentication Flow

1. **User visits app** → Redirected to `/login` if not authenticated
2. **User signs up** → Email confirmation sent → Confirmed via `/auth/confirm`
3. **User signs in** → Session stored in cookies → Redirected to `/chat`
4. **Protected routes** → Middleware validates session → Refreshes if needed
5. **API calls** → Server validates auth → Returns user-specific data
6. **Chat history** → Stored per user in Supabase with RLS
7. **Lawyer recommendations** → Stored per user with conversation context

## Testing Checklist

1. ✅ User can sign up with email/password
2. ✅ Email confirmation works via `/auth/confirm`
3. ✅ User can sign in with email/password
4. ✅ Protected routes redirect to login if not authenticated
5. ✅ Chat interface loads and displays welcome for authenticated users
6. ✅ User can send messages and receive AI responses
7. ✅ Sources are displayed with confidence scores
8. ✅ After relevant conversation, lawyer recommendations appear
9. ✅ API routes are secure (require authentication)
10. ✅ RAG retrieves relevant legal information
11. ✅ Chat history is persisted in Supabase per user
12. ✅ Lawyer recommendations are stored and retrieved from Supabase
13. ✅ Real-time updates work using Supabase subscriptions

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
- [ ] Set up modern Supabase SSR clients
- [ ] Create email/password authentication pages and actions
- [ ] Implement middleware for protected routes
- [ ] Initialize Shadcn UI and install required components
- [ ] Implement Swiss legal RAG service extending BaseRAGService
- [ ] Create lawyer recommendation system with Supabase database
- [ ] Build Next.js API routes for chat and lawyer recommendations
- [ ] Build ChatGPT-style chat interface with Shadcn components
- [ ] Create document ingestion script for Swiss legal PDFs
- [ ] Set up monitoring and logging using MCP tools
