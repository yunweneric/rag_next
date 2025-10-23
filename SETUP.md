# Swiss Legal Chat App Setup

## Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory with the following variables:

   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://txffyrrotilvgzuzwrvc.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZmZ5cnJvdGlsdmd6dXp3cnZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTAwODIsImV4cCI6MjA3NjYyNjA4Mn0.I_aYElAZEpn410NnCGBoUdDyv2xhc9ukcRwToe1bn-c

   # Pinecone Configuration (Optional - for vector search)
   PINECONE_API_KEY=your-pinecone-api-key

   # Ollama Configuration (Optional - for local LLM)
   OLLAMA_URL=http://localhost:11434

   # OpenAI Configuration (Alternative to Ollama)
   OPENAI_API_KEY=your-openai-api-key
   ```

3. **Set up the database:**
   ```bash
   # Run the database setup script
   npm run setup:db
   ```
   
   Or manually execute the SQL in `setup-database.sql` in your Supabase SQL Editor.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Environment Variables

The application uses the following environment variables:

## Prerequisites

1. **Node.js** (v20.13.1 or higher)
2. **Ollama** running locally with the following models:
   - `llama3.2` (for chat)
   - `nomic-embed-text` (for embeddings)
3. **Pinecone** account with API key
4. **Supabase** project (already configured)

## Setup Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Ollama models:**
   ```bash
   ollama pull llama3.2
   ollama pull nomic-embed-text
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual API keys
   ```

4. **Ingest legal documents:**
   ```bash
   npm run ingest
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## Features

- ✅ **Authentication**: Email/password login with Supabase
- ✅ **Chat Interface**: ChatGPT-style interface for legal questions
- ✅ **RAG System**: Retrieval-Augmented Generation with Swiss legal documents
- ✅ **Lawyer Recommendations**: AI-powered lawyer matching based on conversation
- ✅ **Real-time Chat**: Persistent conversation history
- ✅ **Responsive Design**: Mobile-friendly interface

## Database Schema

The app uses the following Supabase tables:
- `profiles`: User profile information
- `chat_conversations`: Chat conversation metadata
- `chat_messages`: Individual chat messages with sources
- `lawyers`: Database of Swiss lawyers with specialties

## API Endpoints

- `POST /api/chat`: Send messages and get AI responses
- `GET /api/lawyers`: Get lawyer recommendations
- `POST /api/lawyers`: Get personalized lawyer recommendations

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: Shadcn UI, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: Ollama (local LLM), LangChain
- **Vector Database**: Pinecone
- **Styling**: Tailwind CSS

## Usage

1. **Sign up/Login**: Create an account or sign in
2. **Ask Questions**: Type legal questions in the chat interface
3. **Get Answers**: Receive AI-powered responses with sources
4. **Lawyer Recommendations**: Get matched with relevant Swiss lawyers
5. **Contact Lawyers**: Use provided contact information

## Development

- **Document Ingestion**: Use `scripts/ingest-documents.ts` to add new legal documents
- **Adding Lawyers**: Insert new lawyers into the `lawyers` table in Supabase
- **Customizing Responses**: Modify `lib/features/legal/swiss-legal-service.ts`

## Troubleshooting

- **Ollama Connection**: Ensure Ollama is running on `http://localhost:11434`
- **Pinecone**: Verify your API key is correct and has proper permissions
- **Supabase**: Check that your project URL and anon key are correct
- **Models**: Ensure required Ollama models are downloaded

## Security

- All API routes require authentication
- Row Level Security (RLS) enabled on all tables
- User data is isolated per authenticated user
- Sensitive operations are server-side only
