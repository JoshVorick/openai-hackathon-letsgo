# API Endpoints Documentation

## Chat-Related Endpoints

### Main Chat Endpoint
- **Path**: `/app/(chat)/api/chat/route.ts`
- **URL**: `POST /api/chat`
- **Description**: Main chat endpoint for AI conversations
- **Expected Payload**:
  ```json
  {
    "id": "uuid-string",
    "message": {
      "id": "uuid-string", 
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "user message content"
        }
      ]
    },
    "selectedChatModel": "chat-model" | "chat-model-reasoning",
    "selectedVisibilityType": "public" | "private"
  }
  ```
- **Response**: Server-Sent Events (SSE) stream
- **Features**: Authentication required, database persistence, rate limiting

### Chat Stream by ID
- **Path**: `/app/(chat)/api/chat/[id]/stream/route.ts` 
- **URL**: `GET /api/chat/[id]/stream`
- **Description**: Stream endpoint for specific chat

## File Management

### File Upload
- **Path**: `/app/(chat)/api/files/upload/route.ts`
- **URL**: `POST /api/files/upload`
- **Description**: Upload files (images) for chat attachments
- **Frontend**: `components/multimodal-input.tsx:176`
- **Expected**: FormData with file
- **Features**: Authentication required, 5MB limit, JPEG/PNG only

## User Interactions

### Message Voting
- **Path**: `/app/(chat)/api/vote/route.ts`
- **URL**: `PATCH /api/vote`
- **Description**: Upvote/downvote messages
- **Frontend**: `components/message-actions.tsx:79,128`
- **Expected Payload**:
  ```json
  {
    "chatId": "string",
    "messageId": "string", 
    "type": "up" | "down"
  }
  ```

### Chat History
- **Path**: `/app/(chat)/api/history/route.ts`
- **URL**: `GET /api/history`
- **Description**: Retrieve chat history

### Document Management
- **Path**: `/app/(chat)/api/document/route.ts`
- **URL**: Various methods for document operations

### Suggestions
- **Path**: `/app/(chat)/api/suggestions/route.ts`
- **URL**: For chat suggestions

## Authentication

### NextAuth
- **Path**: `/app/(auth)/api/auth/[...nextauth]/route.ts`
- **URL**: `/api/auth/*`
- **Description**: NextAuth.js authentication endpoints

### Guest Auth
- **Path**: `/app/(auth)/api/auth/guest/route.ts`
- **URL**: `/api/auth/guest`
- **Description**: Guest user creation

## Other

### Agent Endpoint
- **Path**: `/app/api/agent/route.ts`
- **URL**: `POST /api/agent`
- **Description**: Alternative agent endpoint

## Frontend-Backend Mismatch Issue

**PROBLEM**: The frontend `components/chat.tsx` is sending:
```json
{
  "messages": [ChatMessage[]],
  "model": "string"
}
```

But the backend expects:
```json
{
  "id": "uuid",
  "message": ChatMessage,
  "selectedChatModel": "chat-model" | "chat-model-reasoning", 
  "selectedVisibilityType": "public" | "private"
}
```

This mismatch is causing the 400 Bad Request error.

## File Locations Reference

```
app/
├── (auth)/
│   └── api/
│       └── auth/
├── (chat)/
│   └── api/
│       ├── chat/
│       │   ├── [id]/stream/
│       │   └── route.ts ← MAIN CHAT ENDPOINT
│       ├── document/
│       ├── files/upload/
│       ├── history/
│       ├── suggestions/
│       └── vote/
└── api/
    └── agent/
```