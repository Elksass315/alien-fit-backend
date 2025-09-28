# Alien Fit Backend

## 🚀 Chat & Presence Module

This backend now ships with a real-time chat experience between end users and the trainer pool. Every user keeps a single anonymous conversation thread regardless of which trainer responds, and all real-time updates flow through Socket.IO with Redis-backed presence tracking.

### What’s Included

- **Chat persistence** powered by Sequelize models (`ChatEntity`, `MessageEntity`).
- **Role-aware REST API** for users, trainers, and admins under `~/api/v1/chat`.
- **Authenticated Socket.IO gateway** that reuses the JWT flow from the HTTP stack.
- **Redis heartbeat** system that records online state and `lastSeen` timestamps with a new admin-facing counter endpoint.

## ⚙️ Prerequisites

| Dependency | Purpose | Default |
|------------|---------|---------|
| Node.js ≥ 18 | Runtime | — |
| PostgreSQL | Primary database | `env.DB_URI` |
| Redis ≥ 6 | Presence & heartbeat | `redis://localhost:6379/0` |

Update your environment variables (see `.env.example`) with:

```bash
REDIS_URL=redis://localhost:6379/0
```

## 🔌 Socket.IO Contract

All socket connections must send a valid Bearer token via either:

- `Authorization: Bearer <ACCESS_TOKEN>` header, or
- `handshake.auth.token`, or
- `?token=<ACCESS_TOKEN>` query parameter.

### Core Events

| Event | Direction | Payload | Notes |
|-------|-----------|---------|-------|
| `chat:send` | client → server | `{ content: string, userId?: string }` | `userId` required for trainers/admins. |
| `chat:message` | server → client | `{ id, content, createdAt, senderType, isMine? }` | Trainers receive `senderId`/`chatId` as well. |
| `heartbeat` | client → server | — | Send every ~25s to stay online. |

Rooms:

- Users join `chat:<userId>`.
- Trainers/admins join `trainers`.

## 🧭 REST Endpoints (v1)

| Method & Path | Role | Description |
|---------------|------|-------------|
| `GET /chat/me` | User | Retrieve chat metadata + own presence. |
| `GET /chat/me/messages` | User | List chat messages (paginated). |
| `POST /chat/me/messages` | User | Send a message to trainers. |
| `GET /chat/users` | Trainer/Admin | Paginated list of user chats + presence snapshot. |
| `GET /chat/users/:userId/messages` | Trainer/Admin | Fetch conversation with a specific user. |
| `POST /chat/users/:userId/messages` | Trainer/Admin | Reply to a user. |
| `GET /chat/presence/online/count` | Admin | Aggregated online user count. |
| `GET /chat/presence/:userId` | Admin | Presence + last seen for a user. |

All routes are mounted under `/api/v1/chat` and protected by the existing JWT middleware.

## ▶️ Quick Start

```powershell
npm install
npm run build
npm run start:dev
```

Ensure Redis is running before starting the dev server.

### Manual Socket Playground

Once the server is running, open [`/socket-test.html`](http://localhost:3000/socket-test.html) in your browser to exercise the Socket.IO APIs, emit chat events, send heartbeats, and call the REST helpers without any additional tooling.

## ✅ Quality Checks

- `npm run build` – TypeScript compilation.
- `npm run lint` – ESLint (optional but recommended).

## 📚 Further Ideas

- Message read receipts per trainer.
- Push notifications for new trainer replies.
- Socket.IO Redis adapter for horizontal scaling.

Happy coding! ✨
