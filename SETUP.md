# Setup Guide for Swiss Legal Chat App

## Environment Variables Setup

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Fill in your Firebase configuration in `.env.local`:

```env
# Firebase Configuration (get these from Firebase Console)
NEXT_PUBLIC_API_KEY=your-firebase-api-key
NEXT_PUBLIC_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_PROJECT_ID=your-project-id
NEXT_PUBLIC_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_MESSAGE_ID=your-messaging-sender-id
NEXT_PUBLIC_APP_ID=your-app-id
NEXT_PUBLIC_GA_MEASUREMENT_ID=your-ga-measurement-id

# Firebase Admin SDK (Server-side) - Get from Firebase Console > Service Accounts
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_LLM_MODEL=gpt-4o-mini
OPENAI_EMBED_MODEL=text-embedding-3-small

# Pinecone Configuration
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX=swiss-legal-openai-1536
```

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password authentication
4. Get your configuration:
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Add a web app if you haven't already
   - Copy the config values to your `.env.local`

## Running the Application

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Troubleshooting Login Issues

If login is not working:

1. **Check environment variables**: Make sure all Firebase variables are set in `.env.local`
2. **Check browser console**: Look for Firebase initialization errors
3. **Verify Firebase project**: Ensure Authentication is enabled in Firebase Console
4. **Check network**: Ensure you can reach Firebase servers

The login form now shows detailed error messages to help with debugging.
