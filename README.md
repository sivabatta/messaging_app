# Private Messaging App

A WhatsApp-style 1:1 messaging app with real-time chat, in-database media storage, and 7-day media expiry.

- **Backend**: Node.js + Express + Socket.IO + MongoDB (Mongoose)
- **Frontend**: React (Vite) + Tailwind CSS + Socket.IO client
- **Auth**: JWT + bcrypt
- **Media storage**: Binary BLOBs in MongoDB — **no S3/Cloudinary**
- **Expiry**: 7 days. A daily cron deletes expired media; the download button disappears in the UI once expired
- **Allowed media**: JPG, PNG, MP4, MOV (image ≤ 10 MB, video ≤ 50 MB by default)

---

## 1. Project structure

```
message-app/
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── models/         # User, Message, Media
│   │   ├── controllers/    # auth, message, media
│   │   ├── routes/         # /api/auth, /api/messages, /api/media
│   │   ├── middleware/     # JWT auth, multer upload
│   │   ├── socket/         # Socket.IO: presence, typing, delivery, seen
│   │   ├── jobs/cleanup.js # node-cron daily purge
│   │   ├── app.js
│   │   └── server.js
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/client.js
│   │   ├── context/        # AuthContext, SocketContext
│   │   ├── components/     # ChatSidebar, ChatWindow, MessageBubble, MediaPreview, UploadProgress, TypingIndicator
│   │   ├── pages/          # Login, Signup, Chat
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.js
│   └── tailwind.config.js
├── docker-compose.yml
└── README.md
```

---

## 2. Database schema (MongoDB / Mongoose)

### `users`
| field | type | notes |
|---|---|---|
| `username` | String, unique | 3–32 chars |
| `email` | String, unique, lowercase | |
| `passwordHash` | String | bcrypt, cost 12 |
| `online` | Boolean | maintained by socket connect/disconnect |
| `lastSeen` | Date | |
| `createdAt`, `updatedAt` | Date | |

### `media`
| field | type | notes |
|---|---|---|
| `fileName` | String | original name |
| `fileType` | String | MIME |
| `kind` | `image \| video` | |
| `size` | Number | bytes |
| `data` | Buffer | BLOB, `select: false` so it never auto-loads |
| `sender` / `receiver` | ObjectId(User) | |
| `uploadDate` | Date | |
| `expiryDate` | Date | TTL index — Mongo evicts; the cron is the authoritative cleanup |

### `messages`
| field | type | notes |
|---|---|---|
| `sender` / `receiver` | ObjectId(User) | |
| `type` | `text \| image \| video` | |
| `text` | String | for text messages |
| `media` | ObjectId(Media) \| null | nulled when media is purged so history still renders |
| `seen` | Boolean | |
| `seenAt` | Date \| null | |

---

## 3. API

All endpoints (except signup/login) require `Authorization: Bearer <token>`.

| Method | Path | Body / params | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | `{ username, email, password }` | Create user, returns `{ token, user }` |
| `POST` | `/api/auth/login` | `{ email, password }` | Returns `{ token, user }` |
| `GET`  | `/api/auth/me` | — | Current user |
| `GET`  | `/api/auth/users` | — | All other users (for sidebar) |
| `POST` | `/api/messages` | `{ to, text }` | Send text message |
| `POST` | `/api/messages/media` | multipart: `file`, `to` | Upload image/video (JPG/PNG/MP4/MOV) |
| `GET`  | `/api/messages/history/:userId` | `?limit=50&before=ISO` | Conversation history (paginated) |
| `POST` | `/api/messages/seen` | `{ from }` | Mark messages from `from` as seen |
| `GET`  | `/api/media/:id` | `?token=` accepted for `<img>`/`<video>` | Stream the BLOB (sender or receiver only, 410 if expired) |
| `GET`  | `/api/media/:id/meta` | — | Metadata without the BLOB |
| `GET`  | `/api/health` | — | `{ ok: true }` |

---

## 4. Socket.IO events

Client connects with `io({ auth: { token } })`.

| Event | Direction | Payload |
|---|---|---|
| `presence:update` | server → all | `{ userId, online, lastSeen? }` |
| `message:new` | server → recipient + sender | full message object |
| `message:seen` | server → original sender | `{ by, at }` |
| `typing:start` / `typing:stop` | bidirectional | `{ to }` from client, `{ from }` from server |

---

## 5. Media expiration

1. On upload, `expiryDate = now + MEDIA_TTL_DAYS` (default 7 days).
2. `MediaPreview.jsx` hides the download button and falls back to "Media expired" when `expiryDate <= now`.
3. The download endpoint returns `410 Gone` for an expired BLOB even before it's purged.
4. `node-cron` runs daily at `03:00` server time:
   - Find all `Media` with `expiryDate <= now`
   - Null out the `media` reference on every `Message` that points at them (so chat history still renders)
   - Delete the `Media` docs (and the BLOBs along with them)
5. MongoDB's TTL index is a safety net in case the cron misses a run.

The cleanup also runs once at boot to catch up after long downtime.

---

## 6. Security

- Passwords hashed with bcrypt (cost 12).
- JWT in `Authorization` header for REST, in `socket.handshake.auth.token` for Socket.IO; verified on every request and on every socket handshake.
- Media access is gated to **sender or receiver only** — server compares `req.user.id` to both.
- File type filter (JPG/PNG/MP4/MOV) and per-kind size caps enforced server-side; multer also enforces a hard upper bound.
- `helmet`, CORS pinned to `CLIENT_ORIGIN`, signup/login rate-limited (50/15min).
- Media route accepts `?token=` so `<img>` / `<video>` tags can authenticate — token still verified, never logged.

---

## 7. Setup

### Option A — Docker (recommended)

```bash
cp backend/.env.example backend/.env   # or just export JWT_SECRET
docker compose up --build
```

- Frontend: http://localhost:8090
- Backend:  http://localhost:5000
- Mongo:    localhost:27017

### Option B — Local dev

Requires Node 20+ and a running MongoDB.

```bash
# 1. Backend
cd backend
cp .env.example .env
# edit .env: set JWT_SECRET to something long and random
npm install
npm run dev          # http://localhost:5000

# 2. Frontend (separate terminal)
cd frontend
npm install
npm run dev          # http://localhost:5173, proxies /api + /socket.io → :5000
```

Open `http://localhost:5173`, sign up two accounts in two browsers (or one regular + one incognito), and start chatting.

### Environment variables (backend/.env)

| Var | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | API + WS port |
| `MONGODB_URI` | `mongodb://mongo:27017/messageapp` | Mongo connection |
| `JWT_SECRET` | — | **Required.** Use a long random string |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS origin |
| `MEDIA_TTL_DAYS` | `7` | Media expiry window |
| `MAX_IMAGE_MB` | `10` | Per-image cap |
| `MAX_VIDEO_MB` | `50` | Per-video cap |

---

## 8. How real-time works

1. Frontend opens a Socket.IO connection with the JWT.
2. On connect, server marks `user.online = true` and broadcasts `presence:update`.
3. When you `POST /api/messages` (text) or `POST /api/messages/media`, the server creates the doc, then emits `message:new` to both peers' sockets — the receiver sees the bubble appear without polling.
4. When you open a conversation, the client `POST /api/messages/seen` and the original sender's socket receives `message:seen` → checkmarks turn to "✓✓".
5. Typing in the composer emits `typing:start`, debounced to emit `typing:stop` 1.5s after the last keystroke.

---

## 9. Notes on the design choices

- **In-DB BLOBs vs. GridFS** — requirements explicitly say "store … directly inside the database … as binary/BLOB data". A single `Buffer` field on the `Media` doc is the most literal interpretation. For files in this size range (up to 50 MB) Mongo accepts it; for larger files you'd swap to GridFS. The `data` field is `select: false` so listing media never accidentally loads BLOBs into memory.
- **Why a cron *and* a TTL index** — the requirements specifically ask for a scheduled cleanup job. The TTL index is kept as a safety net but not relied on.
- **Token in query for media** — `<img src="…">` can't carry an `Authorization` header. The route accepts the JWT via `?token=` so we can keep media private without serving a signed-URL substitute.
