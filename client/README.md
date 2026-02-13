# Client (React + TypeScript)

Frontend for the Schedule Management System.

## Features

- Month calendar view with day-level agenda panel
- Create, edit, and delete appointment flows
- Conflict feedback in create/edit forms
- Recurrence controls (None / Daily / Weekly / Monthly)
- gRPC API access through Envoy JSON transcoding endpoint

## Scripts

```bash
npm run dev         # start Vite dev server
npm run build       # production build
npm run lint        # lint sources
npm run test        # run frontend tests once
npm run test:watch  # run frontend tests in watch mode
npm run preview     # preview built app
```

## Environment Variables

Copy `.env.example` to `.env` and adjust values if needed.

```env
VITE_GRPC_WEB_URL=http://localhost:8080
VITE_USER_ID=demo-user
```

## Running Locally

From repository root:

```bash
npm install
npm run dev:backend
npm run dev:frontend
```

Frontend URL: `http://localhost:5173`
