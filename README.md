# Clinikally - AI Skincare & Haircare Assistant

An AI-powered chatbot that helps users with skincare and haircare queries using RAG (Retrieval Augmented Generation) and web search capabilities.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express 5
- **Database:** PostgreSQL (Neon) with Prisma ORM
- **AI:** Google Gemini API, LangChain
- **Search:** Exa API for web search

## Prerequisites

- Node.js 18+
- npm
- PostgreSQL database (or Neon account)

## Project Structure

```
clinikally/
├── frontend/          # React frontend
│   ├── src/
│   └── package.json
├── backend/           # Express backend
│   ├── src/
│   ├── prisma/
│   └── package.json
└── package.json       # Root package.json (orchestrates both)
```

## Local Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd clinikally
```

### 2. Set up environment variables

**Backend (`backend/.env`):**

```env
DATABASE_URL='your-postgresql-connection-string'
GEMINI_API_KEY='your-gemini-api-key'
EXA_API_KEY='your-exa-api-key'
PORT=3000
```

**Frontend (`frontend/.env`):**

```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Install dependencies

```bash
# Install all dependencies (frontend + backend)
npm run install:all
```

Or install separately:

```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install
```

### 4. Set up the database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 5. Ingest data (optional)

If you have product/blog data to ingest:

```bash
cd backend
npm run ingest:products
npm run ingest:blogs
```

### 6. Run the development server

```bash
# Run both frontend and backend
npm run dev

# Or run separately:
npm run dev:frontend  # Frontend on http://localhost:5173
npm run dev:backend   # Backend on http://localhost:3000
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run both frontend and backend in development |
| `npm run dev:frontend` | Run frontend only |
| `npm run dev:backend` | Run backend only |
| `npm run build` | Build both frontend and backend for production |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push Prisma schema to database |

## Deployment (Render.com)

1. Connect your GitHub repository to Render
2. Create a new **Web Service**
3. Configure:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm run start`
4. Add environment variables:
   - `DATABASE_URL`
   - `GEMINI_API_KEY`
   - `EXA_API_KEY`
   - `NODE_ENV=production`

The frontend is served from the backend in production mode.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/chat` | POST | Send a chat message |
| `/api/chat/history/:sessionId` | GET | Get chat history |
| `/api/chat/history/:sessionId` | DELETE | Clear chat history |
| `/api/search` | POST | Search products/blogs |

## License

MIT
