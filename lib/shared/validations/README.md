# API Validation with Zod

This directory contains Zod validation schemas for all API endpoints in the Swiss Legal Chat application.

## 📁 File Structure

```
lib/shared/validations/
├── auth.ts          # Authentication validation schemas
├── chat.ts          # Chat and conversation validation schemas
├── lawyers.ts       # Lawyer search validation schemas
├── index.ts         # Export all schemas
└── README.md        # This documentation
```

## 🔧 Validation Schemas

### Authentication (`auth.ts`)

#### `loginSchema`
- **Email**: Valid email format
- **Password**: Minimum 6 characters

```typescript
{
  email: string (email format)
  password: string (min 6 chars)
}
```

#### `registerSchema`
- **Email**: Valid email format
- **Password**: Minimum 6 characters
- **Username**: 3-50 characters
- **Full Name**: 2-100 characters (optional)

```typescript
{
  email: string (email format)
  password: string (min 6 chars)
  username: string (3-50 chars)
  full_name?: string (2-100 chars)
}
```

#### `otpVerificationSchema`
- **Token**: Minimum 6 characters
- **Email**: Valid email format
- **Type**: 'email' or 'sms'

```typescript
{
  token: string (min 6 chars)
  email: string (email format)
  type: 'email' | 'sms'
}
```

#### `profileUpdateSchema`
- **Username**: 3-50 characters (optional)
- **Full Name**: 2-100 characters (optional)
- **Avatar URL**: Valid URL format (optional)

```typescript
{
  username?: string (3-50 chars)
  full_name?: string (2-100 chars)
  avatar_url?: string (valid URL)
}
```

### Chat (`chat.ts`)

#### `chatMessageSchema`
- **Message**: 1-5000 characters
- **Conversation ID**: Valid UUID format (optional)

```typescript
{
  message: string (1-5000 chars)
  conversationId?: string (UUID format)
}
```

#### `createConversationSchema`
- **Title**: 1-200 characters

```typescript
{
  title: string (1-200 chars)
}
```

#### `createMessageSchema`
- **Content**: 1-5000 characters
- **Role**: 'user' or 'assistant'
- **Sources**: Array of source objects (optional)
- **Confidence**: 0-1 number (optional)
- **Lawyer Recommendations**: Array of lawyer objects (optional)

```typescript
{
  content: string (1-5000 chars)
  role: 'user' | 'assistant'
  sources?: Array<{
    content: string
    page: number (min 1)
    section?: string
    score: number (0-1)
  }>
  confidence?: number (0-1)
  lawyer_recommendations?: Array<{
    id: string
    name: string
    specialties: string[]
    rating: number (0-5)
    location: string
  }>
}
```

### Lawyers (`lawyers.ts`)

#### `lawyerSearchSchema`
- **Query**: 1-100 characters (optional)

```typescript
{
  q?: string (1-100 chars)
}
```

#### `lawyerRecommendationSchema`
- **Conversation History**: Array of message objects
- **User Question**: 1+ characters

```typescript
{
  conversationHistory: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  userQuestion: string (min 1 char)
}
```

## 🛠️ Usage in API Routes

### Request Body Validation

```typescript
import { validateRequestBody, isValidationSuccess } from '@/lib/shared/utils/validation'
import { loginSchema } from '@/lib/shared/validations'

export async function POST(request: NextRequest) {
  // Validate request body
  const validation = await validateRequestBody(request, loginSchema)
  if (!isValidationSuccess(validation)) {
    return validation // Returns validation error response
  }
  
  const { email, password } = validation.data
  // Use validated data...
}
```

### Query Parameter Validation

```typescript
import { validateQueryParams, createValidationErrorResponse } from '@/lib/shared/utils/validation'
import { lawyerSearchSchema } from '@/lib/shared/validations'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  // Validate query parameters
  const validation = validateQueryParams(searchParams, lawyerSearchSchema)
  if (!validation.success) {
    return createValidationErrorResponse(validation.errors)
  }
  
  const { q: query } = validation.data
  // Use validated query...
}
```

## 📝 Error Response Format

### Validation Errors

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

### HTTP Status Codes

- **400 Bad Request**: Validation errors
- **401 Unauthorized**: Authentication errors
- **500 Internal Server Error**: Server errors

## 🧪 Testing Validation

### Valid Requests

```bash
# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Register
POST /api/auth/register
{
  "email": "newuser@example.com",
  "password": "password123",
  "username": "newuser",
  "full_name": "New User"
}

# Chat Message
POST /api/chat
{
  "message": "What are Swiss business requirements?",
  "conversationId": "uuid-here"
}
```

### Invalid Requests

```bash
# Invalid email format
POST /api/auth/login
{
  "email": "invalid-email",
  "password": "123"
}

# Missing required fields
POST /api/auth/register
{
  "email": "user@example.com"
}

# Message too long
POST /api/chat
{
  "message": "Very long message... (over 5000 chars)"
}
```

## 🔒 Security Benefits

1. **Input Sanitization**: All inputs are validated and sanitized
2. **Type Safety**: TypeScript types are automatically generated
3. **Error Prevention**: Invalid data is caught before processing
4. **Consistent Errors**: Standardized error response format
5. **Documentation**: Schemas serve as API documentation

## 🚀 Best Practices

1. **Always validate**: Never trust client input
2. **Use specific schemas**: Create schemas for each endpoint
3. **Handle errors gracefully**: Return clear validation messages
4. **Test edge cases**: Test with invalid data
5. **Keep schemas updated**: Update schemas when API changes

## 📚 Additional Resources

- [Zod Documentation](https://zod.dev/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [TypeScript Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
