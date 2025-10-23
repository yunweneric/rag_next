# Swiss Legal Chat App - Complete Setup Guide

## 🚀 Project Overview

This is a Swiss Legal Chat Application built with Next.js 15, React 19, and Supabase. It provides an AI-powered legal assistant with RAG (Retrieval-Augmented Generation) capabilities for Swiss legal questions.

## 📋 Features

- ✅ **Authentication**: Email/password login with Supabase
- ✅ **Chat Interface**: ChatGPT-style interface for legal questions
- ✅ **RAG System**: Retrieval-Augmented Generation with Swiss legal documents
- ✅ **Lawyer Recommendations**: AI-powered lawyer matching based on conversation
- ✅ **Real-time Chat**: Persistent conversation history
- ✅ **Responsive Design**: Mobile-friendly interface
- ✅ **Row Level Security**: Secure user data isolation

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: Shadcn UI, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: Ollama (local LLM) or OpenAI, LangChain
- **Vector Database**: Pinecone (optional)
- **Styling**: Tailwind CSS

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js** (v20.13.1 or higher)
- **Git**
- **Supabase Account** (project already configured)
- **Ollama** (optional - for local LLM) or **OpenAI API Key**

### 2. Installation

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd my-rag-app

# Install dependencies
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration (Already configured)
NEXT_PUBLIC_SUPABASE_URL=https://txffyrrotilvgzuzwrvc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZmZ5cnJvdGlsdmd6dXp3cnZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTAwODIsImV4cCI6MjA3NjYyNjA4Mn0.I_aYElAZEpn410NnCGBoUdDyv2xhc9ukcRwToe1bn-c

# AI Configuration (Choose one)
# Option 1: Ollama (Local LLM)
OLLAMA_URL=http://localhost:11434

# Option 2: OpenAI
OPENAI_API_KEY=your-openai-api-key

# Vector Database (Optional - for enhanced search)
PINECONE_API_KEY=your-pinecone-api-key
```

### 4. Database Setup

The database schema is already set up. If you need to recreate it:

```bash
# Run the database setup script
npm run setup:db
```

Or manually execute the SQL in `setup-database.sql` in your Supabase SQL Editor.

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 📊 Database Schema

The application uses the following Supabase tables:

### Tables Created

1. **profiles**: User profile information
   - `id` (UUID, Primary Key)
   - `email` (Text, Not Null)
   - `full_name` (Text)
   - `username` (Text, Unique)
   - `avatar_url` (Text)
   - `website` (Text)
   - `updated_at` (Timestamp)

2. **chat_conversations**: Chat conversation metadata
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key to auth.users)
   - `title` (Text)
   - `created_at` (Timestamp)
   - `updated_at` (Timestamp)

3. **chat_messages**: Individual chat messages with sources
   - `id` (UUID, Primary Key)
   - `conversation_id` (UUID, Foreign Key to chat_conversations)
   - `role` (Text, 'user' or 'assistant')
   - `content` (Text, Not Null)
   - `sources` (JSONB)
   - `citations` (JSONB)
   - `confidence` (Decimal)
   - `follow_ups` (JSONB)
   - `metrics` (JSONB)
   - `response_version` (Integer)
   - `created_at` (Timestamp)

4. **lawyers**: Database of Swiss lawyers with specialties
   - `id` (UUID, Primary Key)
   - `name` (Text, Not Null)
   - `email` (Text, Not Null)
   - `phone` (Text)
   - `website` (Text)
   - `specialties` (Text Array, Not Null)
   - `location` (Text)
   - `languages` (Text Array)
   - `rating` (Decimal)
   - `experience_years` (Integer)
   - `created_at` (Timestamp)

### Security Features

- **Row Level Security (RLS)** enabled on all tables
- **User-specific data isolation** - users can only access their own data
- **Automatic profile creation** on user signup
- **Secure authentication** with Supabase Auth

## 🎯 Usage

1. **Sign up/Login**: Create an account or sign in
2. **Ask Questions**: Type legal questions in the chat interface
3. **Get Answers**: Receive AI-powered responses with sources
4. **Lawyer Recommendations**: Get matched with relevant Swiss lawyers
5. **Contact Lawyers**: Use provided contact information

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run setup:db     # Setup database schema

# Document Processing
npm run ingest       # Ingest legal documents
```

### Project Structure

```
my-rag-app/
├── app/                    # Next.js App Router
│   ├── (user)/            # User routes
│   │   ├── chat/          # Chat interface
│   │   ├── login/         # Login page
│   │   └── signup/        # Signup page
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication
│   │   ├── chat/          # Chat endpoints
│   │   ├── conversations/ # Conversation management
│   │   └── lawyers/       # Lawyer data
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── chat/              # Chat components
│   └── ui/                # UI components
├── lib/                   # Library code
│   ├── features/          # Feature modules
│   │   ├── auth/          # Authentication
│   │   └── chat/          # Chat functionality
│   ├── shared/            # Shared utilities
│   └── utils.ts           # Utility functions
├── scripts/               # Build and setup scripts
├── setup-database.sql     # Database schema
└── public/                # Static assets
```

## 🐛 Troubleshooting

### Common Issues

1. **Ollama Connection Issues**
   - Ensure Ollama is running on `http://localhost:11434`
   - Install required models: `ollama pull llama3.2`

2. **Supabase Connection Issues**
   - Verify your project URL and anon key are correct
   - Check that the database tables exist

3. **Authentication Issues**
   - Ensure Supabase Auth is properly configured
   - Check that RLS policies are correctly set up

4. **Build Issues**
   - Clear Next.js cache: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

### Getting Help

- Check the browser console for errors
- Review the Supabase logs in the dashboard
- Ensure all environment variables are set correctly

## 🔐 Security

- All API routes require authentication
- Row Level Security (RLS) enabled on all tables
- User data is isolated per authenticated user
- Sensitive operations are server-side only
- JWT tokens are properly handled and validated

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Ready to start building with Swiss Legal Chat App!** 🚀
