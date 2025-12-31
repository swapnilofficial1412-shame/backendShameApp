# Backend Shame App

Backend application built with Node.js, TypeScript, Express, Prisma, and PostgreSQL.

## Tech Stack

- **Node.js** - Runtime environment
- **TypeScript** - Type-safe JavaScript
- **Express** - Web framework
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **dotenv** - Environment variable management
- **Zod** - Schema validation

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher) or Docker
- npm or yarn

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up PostgreSQL database:**
   
   **Option A: Using Docker (Recommended for development)**
   ```bash
   docker run --name shame-postgres \
     -e POSTGRES_USER=shame \
     -e POSTGRES_PASSWORD=shame \
     -e POSTGRES_DB=shame_db \
     -p 5432:5432 \
     -d postgres:15
   ```
   
   **Option B: Using local PostgreSQL**
   - Install PostgreSQL and create a database
   - Update the `DATABASE_URL` in `.env` with your credentials

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   The `.env.example` file includes default values for Docker PostgreSQL setup. If using a different database, update the `DATABASE_URL` accordingly:
   ```
   DATABASE_URL="postgresql://shame:shame@localhost:5432/shame_db?schema=public"
   ```

4. **Set up the database:**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate
   
   # Run database migrations
   npm run prisma:migrate
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript project
- `npm start` - Start the production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## API Endpoints

### Health Check
- `GET /health` - Returns server health status

## Project Structure

```
backendShameApp/
├── src/
│   └── server.ts          # Main server file
├── prisma/
│   └── schema.prisma      # Prisma schema
├── dist/                  # Compiled JavaScript (generated)
├── .env                   # Environment variables (not in git)
├── .env.example           # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```



curl -X POST http://localhost:3000/api/promises \
  -H "Content-Type: application/json" \
  -d '{
    "accusedName": "John Doe",
    "description": "Promised to ship MVP by Friday",
    "datePromised": "01-01-2025",
    "visibilityDelayHours": 1
  }'