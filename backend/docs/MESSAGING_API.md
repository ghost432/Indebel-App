# API de Messagerie

## 1. Créer ou récupérer une conversation

**URL** : `/api/messages/conversations`
**Méthode** : `POST`
**Auth** : Oui

**Request Body**:
```json
{
  "freelancer_id": 123,
  "employer_id": 456
}
```

**Response**:
```json
{
  "success": true,
  "conversation": {
    "id": 1,
    "freelancer_id": 123,
    "employer_id": 456,
    "created_at": "2023-10-25T12:00:00.000Z",
    "updated_at": "2023-10-25T12:00:00.000Z"
  }
}
```

## 2. Récupérer les conversations d'un utilisateur

**URL** : `/api/messages/conversations`
**Méthode** : `GET`
**Auth** : Oui

**Response**:
```json
{
  "success": true,
  "conversations": [
    {
      "id": 1,
      "freelancer_id": 123,
      "employer_id": 456,
      "freelancer_prenom": "Jean",
      "freelancer_nom": "Dupont",
      "employer_denomination": "Entreprise XYZ",
      "last_message": "Bonjour, je suis intéressé par votre offre.",
      "last_message_date": "2023-10-25T14:30:00.000Z",
      "unread_count": 2
    }
  ]
}
```

## 3. Récupérer les messages d'une conversation

**URL** : `/api/messages/conversations/:conversationId`
**Méthode** : `GET`
**Auth** : Oui

**Response**:
```json
{
  "success": true,
  "messages": [
    {
      "id": 1,
      "conversation_id": 1,
      "sender_id": 123,
      "content": "Bonjour, je suis intéressé par votre offre.",
      "is_read": true,
      "created_at": "2023-10-25T14:30:00.000Z",
      "sender_prenom": "Jean",
      "sender_nom": "Dupont",
      "sender_role": "freelancer"
    }
  ]
}
```

## 4. Envoyer un message

**URL** : `/api/messages/conversations/:conversationId/messages`
**Méthode** : `POST`
**Auth** : Oui

**Request Body**:
```json
{
  "content": "Bonjour, je vous contacte concernant votre offre."
}
```

**Response**:
```json
{
  "success": true,
  "message": {
    "id": 2,
    "conversation_id": 1,
    "sender_id": 123,
    "content": "Bonjour, je vous contacte concernant votre offre.",
    "is_read": false,
    "created_at": "2023-10-25T15:00:00.000Z"
  }
}
```

## Tables de base de données

### conversations
- `id` (INT, PK)
- `freelancer_id` (INT, FK to users.id)
- `employer_id` (INT, FK to users.id)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### messages
- `id` (INT, PK)
- `conversation_id` (INT, FK to conversations.id)
- `sender_id` (INT, FK to users.id)
- `content` (TEXT)
- `is_read` (BOOLEAN, default: false)
- `created_at` (TIMESTAMP)
