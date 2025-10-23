# Swiss Legal Chat API - Postman Collection

This Postman collection provides comprehensive testing for the Swiss Legal Chat API with JWT authentication.

## 📋 Collection Overview

The collection includes the following API endpoints:

### 🔐 Authentication
- **Login** - Authenticate with email/password to get JWT token
- **Register** - Create new user account and get JWT token
- **Get JWT Token** - Helper endpoint for token management

### 💬 Chat
- **Send Message** - Send a message to the AI assistant
- **Send Message to Existing Conversation** - Continue an existing conversation

### 📝 Conversations
- **Get All Conversations** - Retrieve all user conversations
- **Create New Conversation** - Start a new conversation
- **Get Conversation Messages** - Get messages from a specific conversation
- **Delete Conversation** - Remove a conversation

### ⚖️ Lawyers
- **Get All Lawyers** - Retrieve all available lawyers
- **Search Lawyers** - Search lawyers by specialty or name

### ❌ Error Examples
- **Unauthorized Request** - Example of request without authentication
- **Invalid Token** - Example of request with invalid JWT token

## 🚀 Setup Instructions

### 1. Import the Collection

1. Open Postman
2. Click **Import** button
3. Select the `Swiss Legal Chat API.postman_collection.json` file
4. The collection will be imported with all endpoints

### 2. Configure Environment Variables

The collection uses the following variables:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `base_url` | `http://localhost:3000` | Your API base URL |
| `jwt_token` | (empty) | JWT token for authentication |
| `conversation_id` | (empty) | Conversation ID for testing |

### 3. Get JWT Token

#### Option A: Using the API Endpoints

1. **Register** a new account (Authentication → Register)
2. **Login** with existing credentials (Authentication → Login)
3. The JWT token will be automatically extracted and saved to collection variables

### 4. Test the Endpoints

1. **Start with Authentication** - Get your JWT token
2. **Test Chat functionality** - Send messages to the AI
3. **Test Conversations** - Create, retrieve, and manage conversations
4. **Test Lawyers** - Search for legal professionals

## 🔧 Usage Examples

### Basic Chat Flow

1. **Register** new account (Authentication → Register) OR **Login** (Authentication → Login)
2. **Send Message** (Chat → Send Message)
3. **Get Conversations** (Conversations → Get All Conversations)
4. **Get Messages** (Conversations → Get Conversation Messages)

### Advanced Testing

1. **Create Conversation** (Conversations → Create New Conversation)
2. **Continue Conversation** (Chat → Send Message to Existing Conversation)
3. **Search Lawyers** (Lawyers → Search Lawyers)
4. **Delete Conversation** (Conversations → Delete Conversation)

## 📝 Request Examples

### Register New User

```bash
POST {{base_url}}/api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "username": "newuser",
  "full_name": "New User"
}
```

### Login User

```bash
POST {{base_url}}/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Send Chat Message

```bash
POST {{base_url}}/api/chat
Authorization: Bearer {{jwt_token}}
Content-Type: application/json

{
  "message": "What are the requirements for starting a business in Switzerland?",
  "conversationId": null
}
```

### Get Conversations

```bash
GET {{base_url}}/api/conversations
Authorization: Bearer {{jwt_token}}
```

### Create Conversation

```bash
POST {{base_url}}/api/conversations
Authorization: Bearer {{jwt_token}}
Content-Type: application/json

{
  "title": "Business Legal Questions"
}
```

## 🔍 Response Examples

### Successful Chat Response

```json
{
  "answer": "To start a business in Switzerland, you need to...",
  "sources": [
    {
      "content": "Business registration requirements...",
      "page": 15,
      "section": "Business Law",
      "score": 0.95
    }
  ],
  "confidence": 0.92,
  "processingTime": 1.5,
  "conversationId": "conv_123",
  "shouldRecommendLawyers": true,
  "lawyerRecommendations": [
    {
      "id": "lawyer_1",
      "name": "Dr. John Smith",
      "specialties": ["Business Law", "Corporate Law"],
      "rating": 4.8,
      "location": "Zurich"
    }
  ]
}
```

### Error Response

```json
{
  "error": "Unauthorized"
}
```

## 🛠️ Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check if JWT token is set correctly
   - Verify token is not expired
   - Ensure token format: `Bearer <token>`

2. **404 Not Found**
   - Verify `base_url` is correct
   - Check if the API server is running

3. **500 Internal Server Error**
   - Check server logs
   - Verify all required environment variables are set

### Token Management

- **Token Expiration**: JWT tokens expire. Re-authenticate to get a new token
- **Token Format**: Always use `Bearer ` prefix in Authorization header
- **Token Storage**: Store tokens securely, never commit them to version control

## 🔒 Security Notes

- **Never share JWT tokens** in public repositories
- **Use environment variables** for sensitive data
- **Rotate tokens regularly** for production use
- **Validate tokens** on the server side

## 📚 Additional Resources

- [JWT Authentication Guide](https://jwt.io/introduction)
- [Postman Documentation](https://learning.postman.com/docs/)
- [JWT Authentication Documentation](https://jwt.io/introduction)

## 🤝 Support

If you encounter issues:

1. Check the **Error Examples** folder in the collection
2. Verify your JWT token is valid
3. Ensure all required headers are included
4. Check the API server logs for detailed error messages

---

**Happy Testing! 🚀**
