# Cloudflare Tunnel K8s Auto-Deploy + First-Run Welcome Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy DuoTrak to Kubernetes via Cloudflare Tunnel with automatic deploys on every `main` push, plus a first-dashboard-visit welcome UI that works the same for inviter/invitee and all auth methods.

**Architecture:** GitHub Actions builds frontend/backend images and updates Kubernetes Deployments to SHA tags after each push to `main`. Cloudflare Tunnel (`cloudflared`) runs in-cluster and routes `duotrak.org` to frontend service and `api.duotrak.org` to backend service. Frontend gets a new first-run welcome component gated by a client-side "seen" flag.

**Tech Stack:** Next.js 15, FastAPI, Docker, Kubernetes manifests, GitHub Actions, Cloudflare Tunnel, Jest/RTL.

---

### Task 1: Add backend Kubernetes manifests

**Files:**
- Create: `k8s/backend-deployment.yaml`
- Create: `k8s/backend-service.yaml`
- Modify: `k8s/deployment.yaml`
- Test: `k8s/backend-deployment.yaml`
- Test: `k8s/backend-service.yaml`

**Step 1: Write the failing validation check**

Run: `kubectl apply --dry-run=client -f k8s/backend-deployment.yaml`
Expected: FAIL with "no such file" (or equivalent).

**Step 2: Create minimal backend Deployment manifest**

Add `k8s/backend-deployment.yaml` with:
- `apps/v1` Deployment named `duotrak-backend`
- container image `ghcr.io/<owner>/<repo>-backend:latest` (placeholder)
- container port `8000`
- env from secret/config references

**Step 3: Create backend Service manifest**

Add `k8s/backend-service.yaml` with:
- `Service` named `duotrak-backend`
- `type: ClusterIP`
- service port `8000` -> targetPort `8000`

**Step 4: Align frontend deployment service references**

Update `k8s/deployment.yaml`:
- `NEXT_PUBLIC_API_BASE_URL=https://api.duotrak.org`
- `FASTAPI_URL=http://duotrak-backend:8000`

**Step 5: Re-run manifest validation**

Run: `kubectl apply --dry-run=client -f k8s/backend-deployment.yaml -f k8s/backend-service.yaml -f k8s/deployment.yaml`
Expected: PASS (client-side validation succeeds).

**Step 6: Commit**

```bash
git add k8s/backend-deployment.yaml k8s/backend-service.yaml k8s/deployment.yaml
git commit -m "feat(k8s): add backend deployment and service manifests"
```

### Task 2: Add Cloudflare Tunnel manifests

**Files:**
- Create: `k8s/cloudflared-configmap.yaml`
- Create: `k8s/cloudflared-deployment.yaml`
- Modify: `k8s/ingress.yaml`
- Test: `k8s/cloudflared-configmap.yaml`
- Test: `k8s/cloudflared-deployment.yaml`

**Step 1: Write the failing validation check**

Run: `kubectl apply --dry-run=client -f k8s/cloudflared-configmap.yaml`
Expected: FAIL with "no such file" (or equivalent).

**Step 2: Create tunnel config map**

Add `k8s/cloudflared-configmap.yaml` with ingress rules:
- `hostname: duotrak.org` -> `http://duotrak-frontend.default.svc.cluster.local:80`
- `hostname: api.duotrak.org` -> `http://duotrak-backend.default.svc.cluster.local:8000`
- final catch-all `http_status:404`

**Step 3: Create cloudflared deployment**

Add `k8s/cloudflared-deployment.yaml` with:
- 1 replica `cloudflare/cloudflared:latest`
- command `tunnel --no-autoupdate run`
- token from secret key ref (e.g., `CF_TUNNEL_TOKEN`)
- mounted config from `cloudflared-configmap`

**Step 4: Mark ingress as non-prod/deprecated**

Update `k8s/ingress.yaml` header comments to indicate Cloudflare Tunnel is the production entrypoint and ingress is optional fallback.

**Step 5: Re-run manifest validation**

Run: `kubectl apply --dry-run=client -f k8s/cloudflared-configmap.yaml -f k8s/cloudflared-deployment.yaml`
Expected: PASS.

**Step 6: Commit**

```bash
git add k8s/cloudflared-configmap.yaml k8s/cloudflared-deployment.yaml k8s/ingress.yaml
git commit -m "feat(k8s): add cloudflare tunnel manifests"
```

### Task 3: Upgrade GitHub Actions to build/deploy both services on each main push

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Test: `.github/workflows/deploy.yml`

**Step 1: Write the failing workflow check**

Run: `rg -n "backend|duotrak-backend|kubectl set image" .github/workflows/deploy.yml`
Expected: FAIL to find complete backend deployment coverage.

**Step 2: Add backend image build-and-push**

Update `.github/workflows/deploy.yml`:
- keep trigger `push` on `main`
- build/push frontend image from repo root Dockerfile
- build/push backend image from `backend/Dockerfile`
- tag both with `sha-${{ github.sha }}` and optional `latest`

**Step 3: Update deploy step to roll both deployments**

In deploy job:
- set frontend image to SHA tag
- set backend image to SHA tag
- `kubectl rollout status deployment/duotrak-frontend`
- `kubectl rollout status deployment/duotrak-backend`

**Step 4: Add notification step**

Add a final step using a webhook or email action that sends:
- success payload on successful rollout
- failure payload on failed job with run URL

**Step 5: Re-run workflow lint/sanity checks**

Run: `rg -n "sha-\\$\\{\\{ github.sha \\}\\}|duotrak-backend|rollout status" .github/workflows/deploy.yml`
Expected: PASS showing both frontend and backend deploy paths.

**Step 6: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: deploy frontend and backend on main push with notifications"
```

### Task 4: Add deployment runbook and secret setup documentation

**Files:**
- Create: `docs/runbooks/cloudflare-tunnel-k8s-deploy.md`
- Modify: `.env.example`
- Test: `docs/runbooks/cloudflare-tunnel-k8s-deploy.md`

**Step 1: Write the failing documentation grep**

Run: `rg -n "CF_TUNNEL_TOKEN|duotrak.org|api.duotrak.org|KUBE_CONFIG" docs/runbooks`
Expected: FAIL to find a complete runbook.

**Step 2: Create runbook with exact setup steps**

Document:
- Cloudflare tunnel creation and token retrieval
- required DNS hostnames in Cloudflare
- required GitHub secrets (`KUBE_CONFIG`, notification secrets)
- required K8s secrets/configmaps
- initial deploy and verification commands

**Step 3: Document env keys in `.env.example`**

Add or clarify keys used in deployment:
- `NEXT_PUBLIC_API_BASE_URL=https://api.duotrak.org`
- `CLIENT_ORIGIN_URL=https://duotrak.org`
- any required backend secret placeholders

**Step 4: Validate docs contain critical setup terms**

Run: `rg -n "CF_TUNNEL_TOKEN|duotrak.org|api.duotrak.org|KUBE_CONFIG|kubectl rollout status" docs/runbooks/cloudflare-tunnel-k8s-deploy.md .env.example`
Expected: PASS.

**Step 5: Commit**

```bash
git add docs/runbooks/cloudflare-tunnel-k8s-deploy.md .env.example
git commit -m "docs: add cloudflare tunnel deployment runbook"
```

### Task 5: Add first-run dashboard welcome UI component

**Files:**
- Create: `src/components/dashboard/FirstRunWelcomeCard.tsx`
- Create: `src/components/dashboard/__tests__/FirstRunWelcomeCard.test.tsx`
- Test: `src/components/dashboard/__tests__/FirstRunWelcomeCard.test.tsx`

**Step 1: Write the failing component test**

Add test cases in `FirstRunWelcomeCard.test.tsx`:
- renders welcome heading/message
- renders contact/support message
- close/dismiss invokes callback

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/dashboard/__tests__/FirstRunWelcomeCard.test.tsx --runInBand`
Expected: FAIL because component does not exist yet.

**Step 3: Implement minimal component**

Create `FirstRunWelcomeCard.tsx`:
- polished first-run UI card/modal
- role/auth-method-agnostic copy
- includes optional contact line for `charlenelaar26@gmail.com`
- `onDismiss` prop

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/dashboard/__tests__/FirstRunWelcomeCard.test.tsx --runInBand`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/dashboard/FirstRunWelcomeCard.tsx src/components/dashboard/__tests__/FirstRunWelcomeCard.test.tsx
git commit -m "feat(ui): add first-run dashboard welcome card"
```

### Task 6: Gate welcome UI on first dashboard visit only

**Files:**
- Create: `src/hooks/useFirstRunWelcome.ts`
- Modify: `src/components/dashboard-content.tsx`
- Create: `src/hooks/__tests__/useFirstRunWelcome.test.ts`
- Test: `src/hooks/__tests__/useFirstRunWelcome.test.ts`

**Step 1: Write the failing hook tests**

Add tests for hook behavior:
- default visible when no persisted flag exists
- dismiss persists flag
- next render hides component

**Step 2: Run test to verify it fails**

Run: `npm test -- src/hooks/__tests__/useFirstRunWelcome.test.ts --runInBand`
Expected: FAIL because hook does not exist yet.

**Step 3: Implement minimal persistence hook**

Create `useFirstRunWelcome.ts`:
- uses local storage key (e.g., `duotrak.dashboard.welcomeSeen`)
- returns `{ isVisible, dismiss }`
- guards SSR access to `window/localStorage`

**Step 4: Integrate into dashboard content**

Modify `dashboard-content.tsx`:
- mount `FirstRunWelcomeCard` when `isVisible === true`
- dismiss via hook callback
- keep behavior independent of inviter/invitee and auth method

**Step 5: Run tests**

Run: `npm test -- src/hooks/__tests__/useFirstRunWelcome.test.ts src/components/dashboard/__tests__/FirstRunWelcomeCard.test.tsx --runInBand`
Expected: PASS.

**Step 6: Commit**

```bash
git add src/hooks/useFirstRunWelcome.ts src/hooks/__tests__/useFirstRunWelcome.test.ts src/components/dashboard-content.tsx
git commit -m "feat(ui): show welcome message only on first dashboard visit"
```

### Task 7: End-to-end verification and rollback drill

**Files:**
- Modify: `docs/runbooks/cloudflare-tunnel-k8s-deploy.md`
- Test: `.github/workflows/deploy.yml`
- Test: `k8s/cloudflared-configmap.yaml`
- Test: `k8s/backend-deployment.yaml`

**Step 1: Validate all manifests/workflow definitions**

Run: `kubectl apply --dry-run=client -f k8s/deployment.yaml -f k8s/service.yaml -f k8s/backend-deployment.yaml -f k8s/backend-service.yaml -f k8s/cloudflared-configmap.yaml -f k8s/cloudflared-deployment.yaml`
Expected: PASS.

**Step 2: Push test commit to `main` in staging/safe window**

Run: `git commit --allow-empty -m "chore: trigger deployment pipeline verification" && git push origin main`
Expected: GitHub workflow starts automatically.

**Step 3: Verify deploy and domain health**

Run:
- `kubectl rollout status deployment/duotrak-frontend`
- `kubectl rollout status deployment/duotrak-backend`
- `curl -I https://duotrak.org`
- `curl -I https://api.duotrak.org/`

Expected:
- both rollouts complete
- domain responses are healthy

**Step 4: Verify notification delivery**

Check that success/failure message is delivered with commit SHA and workflow link.

**Step 5: Document rollback command**

Add explicit rollback snippet to runbook:
- `kubectl set image deployment/duotrak-frontend duotrak-frontend=<previous_sha_tag>`
- `kubectl set image deployment/duotrak-backend duotrak-backend=<previous_sha_tag>`

**Step 6: Commit**

```bash
git add docs/runbooks/cloudflare-tunnel-k8s-deploy.md
git commit -m "docs: add deployment verification and rollback procedure"
```

## Notes for Execution
- Keep existing user-local uncommitted UI work intact while implementing deployment tasks.
- Prefer immutable SHA tags in production rollouts; keep `latest` only as convenience.
- If deployment fails unexpectedly, apply `@systematic-debugging` before patching.
- For frontend UI polish adjustments, apply `@frontend-design`.
