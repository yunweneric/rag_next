# Swiss Legal Chat API - Response Documentation

This document describes the API response structures for the Swiss Legal Chat application, designed for Flutter app integration.

## Base URL
```
https://your-domain.com/api
```

## Authentication
- **Pages**: Authentication required (Firebase token in cookies)
- **API Routes**: No authentication required

---

## 1. Chat API

### Endpoint
```
POST /api/chat
```

### Request Body
```json
{
  "message": "What are the requirements for starting a business in Switzerland?",
  "conversationId": null
}
```

### Response Structure
```json
{
  "success": true,
  "data": {
    "status": "complete",
    "message": {
      "textMd": "# Starting a Business in Switzerland\n\nTo start a business in Switzerland, you need to...",
      "summary": "Business registration requirements",
      "blocks": []
    },
    "citations": [
      {
        "marker": 1,
        "sourceId": "pdf:1:abc123",
        "offsets": {
          "start": 0,
          "end": 50
        }
      }
    ],
    "sources": [
      {
        "id": "pdf:1:abc123",
        "title": "Swiss Legal Code – Page 1",
        "page": 1,
        "url": "/docs/swiss_legal.pdf#page=1",
        "snippet": "Business registration requirements...",
        "score": 0.9
      }
    ],
    "followUps": [
      "What documents do I need for business registration?",
      "How long does the registration process take?",
      "What are the costs involved?"
    ],
    "metrics": {
      "confidence": 0.85,
      "processingTime": 1250,
      "tokenUsage": {
        "prompt": 0,
        "completion": 0,
        "total": 0
      }
    }
  },
  "conversationId": "conv_abc123def456"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Message is required",
  "conversationId": null
}
```

---

## 2. Conversations API

### Get All Conversations
```
GET /api/conversations
```

### Response Structure
```json
{
  "conversations": [
    {
      "id": "conv_abc123def456",
      "title": "Business Registration Requirements",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T11:45:00.000Z"
    },
    {
      "id": "conv_def456ghi789",
      "title": "Employment Law Questions",
      "created_at": "2024-01-14T14:20:00.000Z",
      "updated_at": "2024-01-14T15:10:00.000Z"
    }
  ]
}
```

### Create New Conversation
```
POST /api/conversations
```

### Request Body
```json
{
  "title": "New Legal Question"
}
```

### Response Structure
```json
{
  "conversation": {
    "id": "conv_new123abc456",
    "userId": "anonymous-user",
    "title": "New Legal Question",
    "createdAt": "2024-01-15T12:00:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

---

## 3. Messages API

### Get Messages for Conversation
```
GET /api/conversations/{id}/messages
```

### Response Structure
```json
{
  "messages": [
    {
      "id": "msg_abc123",
      "role": "user",
      "content": "What are the requirements for starting a business?",
      "sources": [],
      "citations": [],
      "follow_ups": [],
      "metrics": {},
      "response_version": 1,
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "msg_def456",
      "role": "assistant",
      "content": "# Starting a Business in Switzerland\n\nTo start a business...",
      "sources": [
        {
          "id": "pdf:1:abc123",
          "title": "Swiss Legal Code – Page 1",
          "page": 1,
          "url": "/docs/swiss_legal.pdf#page=1",
          "snippet": "Business registration requirements...",
          "score": 0.9
        }
      ],
      "citations": [
        {
          "marker": 1,
          "sourceId": "pdf:1:abc123"
        }
      ],
      "follow_ups": [
        "What documents do I need?",
        "How long does it take?",
        "What are the costs?"
      ],
      "metrics": {
        "confidence": 0.85,
        "processingTime": 1250,
        "tokenUsage": {
          "prompt": 0,
          "completion": 0,
          "total": 0
        }
      },
      "response_version": 2,
      "created_at": "2024-01-15T10:31:00.000Z"
    }
  ]
}
```

---

## 4. Delete Conversation

### Endpoint
```
DELETE /api/conversations/{id}
```

### Response Structure
```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

---

## Flutter Integration Examples

### 1. Send Chat Message

```dart
class ChatService {
  static const String baseUrl = 'https://your-domain.com/api';
  
  Future<ChatResponse> sendMessage({
    required String message,
    String? conversationId,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/chat'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'message': message,
        'conversationId': conversationId,
      }),
    );
    
    if (response.statusCode == 200) {
      return ChatResponse.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to send message');
    }
  }
}

class ChatResponse {
  final bool success;
  final ChatData? data;
  final String? conversationId;
  final String? error;
  
  ChatResponse({
    required this.success,
    this.data,
    this.conversationId,
    this.error,
  });
  
  factory ChatResponse.fromJson(Map<String, dynamic> json) {
    return ChatResponse(
      success: json['success'] ?? false,
      data: json['data'] != null ? ChatData.fromJson(json['data']) : null,
      conversationId: json['conversationId'],
      error: json['error'],
    );
  }
}

class ChatData {
  final String status;
  final MessageContent message;
  final List<Citation> citations;
  final List<Source> sources;
  final List<String> followUps;
  final Metrics metrics;
  
  ChatData({
    required this.status,
    required this.message,
    required this.citations,
    required this.sources,
    required this.followUps,
    required this.metrics,
  });
  
  factory ChatData.fromJson(Map<String, dynamic> json) {
    return ChatData(
      status: json['status'],
      message: MessageContent.fromJson(json['message']),
      citations: (json['citations'] as List)
          .map((c) => Citation.fromJson(c))
          .toList(),
      sources: (json['sources'] as List)
          .map((s) => Source.fromJson(s))
          .toList(),
      followUps: List<String>.from(json['followUps']),
      metrics: Metrics.fromJson(json['metrics']),
    );
  }
}

class MessageContent {
  final String textMd;
  final String? summary;
  final List<dynamic> blocks;
  
  MessageContent({
    required this.textMd,
    this.summary,
    required this.blocks,
  });
  
  factory MessageContent.fromJson(Map<String, dynamic> json) {
    return MessageContent(
      textMd: json['textMd'],
      summary: json['summary'],
      blocks: json['blocks'] ?? [],
    );
  }
}

class Citation {
  final int marker;
  final String sourceId;
  final Offsets? offsets;
  
  Citation({
    required this.marker,
    required this.sourceId,
    this.offsets,
  });
  
  factory Citation.fromJson(Map<String, dynamic> json) {
    return Citation(
      marker: json['marker'],
      sourceId: json['sourceId'],
      offsets: json['offsets'] != null 
          ? Offsets.fromJson(json['offsets']) 
          : null,
    );
  }
}

class Offsets {
  final int start;
  final int end;
  
  Offsets({required this.start, required this.end});
  
  factory Offsets.fromJson(Map<String, dynamic> json) {
    return Offsets(
      start: json['start'],
      end: json['end'],
    );
  }
}

class Source {
  final String id;
  final String? title;
  final int page;
  final String? url;
  final String? snippet;
  final double score;
  
  Source({
    required this.id,
    this.title,
    required this.page,
    this.url,
    this.snippet,
    required this.score,
  });
  
  factory Source.fromJson(Map<String, dynamic> json) {
    return Source(
      id: json['id'],
      title: json['title'],
      page: json['page'],
      url: json['url'],
      snippet: json['snippet'],
      score: json['score'].toDouble(),
    );
  }
}

class Metrics {
  final double confidence;
  final int processingTime;
  final TokenUsage tokenUsage;
  
  Metrics({
    required this.confidence,
    required this.processingTime,
    required this.tokenUsage,
  });
  
  factory Metrics.fromJson(Map<String, dynamic> json) {
    return Metrics(
      confidence: json['confidence'].toDouble(),
      processingTime: json['processingTime'],
      tokenUsage: TokenUsage.fromJson(json['tokenUsage']),
    );
  }
}

class TokenUsage {
  final int prompt;
  final int completion;
  final int total;
  
  TokenUsage({
    required this.prompt,
    required this.completion,
    required this.total,
  });
  
  factory TokenUsage.fromJson(Map<String, dynamic> json) {
    return TokenUsage(
      prompt: json['prompt'],
      completion: json['completion'],
      total: json['total'],
    );
  }
}
```

### 2. Get Conversations

```dart
Future<List<Conversation>> getConversations() async {
  final response = await http.get(
    Uri.parse('$baseUrl/conversations'),
    headers: {'Content-Type': 'application/json'},
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return (data['conversations'] as List)
        .map((c) => Conversation.fromJson(c))
        .toList();
  } else {
    throw Exception('Failed to load conversations');
  }
}

class Conversation {
  final String id;
  final String title;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  Conversation({
    required this.id,
    required this.title,
    required this.createdAt,
    required this.updatedAt,
  });
  
  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id'],
      title: json['title'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }
}
```

### 3. Get Messages

```dart
Future<List<Message>> getMessages(String conversationId) async {
  final response = await http.get(
    Uri.parse('$baseUrl/conversations/$conversationId/messages'),
    headers: {'Content-Type': 'application/json'},
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return (data['messages'] as List)
        .map((m) => Message.fromJson(m))
        .toList();
  } else {
    throw Exception('Failed to load messages');
  }
}

class Message {
  final String id;
  final String role;
  final String content;
  final List<Source> sources;
  final List<Citation> citations;
  final List<String> followUps;
  final Metrics metrics;
  final int responseVersion;
  final DateTime createdAt;
  
  Message({
    required this.id,
    required this.role,
    required this.content,
    required this.sources,
    required this.citations,
    required this.followUps,
    required this.metrics,
    required this.responseVersion,
    required this.createdAt,
  });
  
  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'],
      role: json['role'],
      content: json['content'],
      sources: (json['sources'] as List)
          .map((s) => Source.fromJson(s))
          .toList(),
      citations: (json['citations'] as List)
          .map((c) => Citation.fromJson(c))
          .toList(),
      followUps: List<String>.from(json['follow_ups']),
      metrics: Metrics.fromJson(json['metrics']),
      responseVersion: json['response_version'] ?? 1,
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}
```

---

## Error Handling

### Common HTTP Status Codes
- `200`: Success
- `400`: Bad Request (missing required fields)
- `500`: Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

---

## Notes for Flutter Integration

1. **Markdown Rendering**: The `message.textMd` field contains markdown-formatted text. Use a markdown renderer like `flutter_markdown` to display it properly.

2. **Conversation Continuity**: Always store and pass the `conversationId` from responses to maintain conversation context.

3. **Error Handling**: Check the `success` field in responses and handle errors appropriately.

4. **Loading States**: Use the `processingTime` field to show loading indicators.

5. **Confidence Scores**: Display confidence levels to users when appropriate (0.0 to 1.0 scale).

6. **Follow-up Questions**: Use the `followUps` array to suggest next questions to users.

7. **Sources**: Display source information and citations to provide transparency about where information comes from.
