# Cloudflare Tunnel Kubernetes Auto-Deploy Design

**Date:** 2026-02-26  
**Owner:** DuoTrak

## Goal
Deploy DuoTrak on Kubernetes running on a GCP VPS with automatic deploys on every push to `main`, no dependency on a changing public IP, and production domains:
- `duotrak.org` for frontend
- `api.duotrak.org` for backend API

## Decision Summary
Use Cloudflare Tunnel as the edge entrypoint instead of exposing Kubernetes via public IP + ingress controller.

Why this was chosen:
- Avoids direct public-IP dependency on the VPS
- Works without opening inbound `80/443`
- Keeps service exposure internal to cluster (`ClusterIP`)
- Simplifies DNS and TLS at Cloudflare edge

## High-Level Architecture
1. GitHub Actions builds frontend and backend images on each push to `main`.
2. Images are pushed to GHCR with immutable SHA tags.
3. Deploy job updates Kubernetes Deployments to the new SHA image tags.
4. `cloudflared` in-cluster maintains an outbound tunnel to Cloudflare.
5. Cloudflare routes:
   - `duotrak.org` -> frontend service (`duotrak-frontend:80`)
   - `api.duotrak.org` -> backend service (`duotrak-backend:8000`)
6. Deployment status notification is sent for success/failure.

## Kubernetes Topology
- `duotrak-frontend` Deployment + Service (`ClusterIP`, target `3000`)
- `duotrak-backend` Deployment + Service (`ClusterIP`, target `8000`)
- `cloudflared` Deployment using a Cloudflare Tunnel token from K8s Secret
- Optional removal/deprecation of existing ingress manifest for prod path

## CI/CD Design
Trigger:
- `push` on `main`

Build:
- Frontend image: `ghcr.io/<owner>/<repo>-frontend:sha-<commit>`
- Backend image: `ghcr.io/<owner>/<repo>-backend:sha-<commit>`

Deploy:
- Authenticate to cluster via `KUBE_CONFIG` secret
- Update images via `kubectl set image` or rendered manifest patch
- Wait for rollout status for frontend and backend

Notification:
- On success: include commit SHA, branch, and timestamp
- On failure: include failed step and link to workflow run

## Runtime Configuration and Secrets
GitHub Secrets:
- `KUBE_CONFIG`
- `CF_TUNNEL_TOKEN` (if injected during deploy)
- Notification provider secrets (email/webhook)

Kubernetes Secrets/Config:
- `cloudflared` tunnel token secret
- frontend env values (`NEXT_PUBLIC_API_BASE_URL=https://api.duotrak.org`, etc.)
- backend env values (`CLIENT_ORIGIN_URL=https://duotrak.org`, API keys, DB URL, auth secrets)

## Product Requirement Included in This Design
Add a first-time dashboard welcome experience:
- Show a polished welcome card/modal on first dashboard visit
- Same UX for inviter/invitee and independent of auth method
- Can include a support/contact message for `charlenelaar26@gmail.com`
- Persist "seen" state so user only sees it once

## Rollback Strategy
- Re-run deploy job with previous known-good SHA tag, or manual `kubectl set image` to previous SHA.
- Keep at least several recent GHCR SHA tags available for quick rollback.

## Risks and Mitigations
- Risk: Tunnel token leakage  
  Mitigation: store only in GitHub/K8s secrets, never in repo.
- Risk: Build succeeds but rollout fails due to env/config mismatch  
  Mitigation: explicit rollout checks and failure notifications.
- Risk: Backend CORS/cookie origin mismatch with new domains  
  Mitigation: set production `CLIENT_ORIGIN_URL` and CORS origins to `https://duotrak.org`.

## Success Criteria
- Push to `main` automatically deploys both frontend and backend.
- `https://duotrak.org` serves frontend through Cloudflare Tunnel.
- `https://api.duotrak.org` serves backend API through Cloudflare Tunnel.
- Deployment notifications arrive for both success and failure.
- First-time dashboard welcome UI appears once and is role/auth-method agnostic.
