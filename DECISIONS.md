# Architecture Decisions

## Naming
- Backend directory name is `server` (not `backend`).
- Frontend directory name is `client` (not `frontend`).

## Transport
- gRPC is used for server communication.
- Envoy provides gRPC-Web translation for browser-based clients.

## Deployment (Local)
- `docker-compose.yml` orchestrates `postgres`, `server`, `envoy`, and `client`.
- Service ports:
  - `server`: `50051`
  - `envoy`: `8080` (proxy), `9901` (admin)
  - `client`: `5173`
