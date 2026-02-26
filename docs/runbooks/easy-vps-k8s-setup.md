# Easy VPS Kubernetes Setup (Cloudflare Tunnel + Auto Deploy)

This is the fastest setup path for DuoTrak on a Linux VPS.

After one-time setup, deployment is just:

```bash
git push origin main
```

## 1) On VPS: clone repo and prepare env files

```bash
git clone <YOUR_GITHUB_REPO_URL> duotrak
cd duotrak
```

Create/fill:
- `.env.local`
- `backend/.env`
- `firebase-adminsdk.json`

## 2) Run one-command setup on VPS

```bash
chmod +x scripts/create-k8s-secrets-from-env.sh scripts/vps/easy-setup.sh
./scripts/vps/easy-setup.sh --cloudflare-tunnel-token "<YOUR_CLOUDFLARE_TUNNEL_TOKEN>"
```

What this does:
- installs `k3s` if needed
- creates/updates K8s secrets from your env files
- applies frontend/backend/cloudflared manifests
- waits for rollout completion

## 3) Cloudflare hostnames

Ensure your Cloudflare Tunnel routes:
- `duotrak.org` -> `http://duotrak-frontend.default.svc.cluster.local:80`
- `api.duotrak.org` -> `http://duotrak-backend.default.svc.cluster.local:8000`

## 4) GitHub auto-deploy on push to main

The workflow is:
- `.github/workflows/deploy.yml`

Required GitHub Secrets:
- `KUBE_CONFIG`
- `DEPLOY_WEBHOOK_URL` (optional)

## 5) Verify

```bash
kubectl get pods -n default
kubectl rollout status deployment/duotrak-frontend -n default
kubectl rollout status deployment/duotrak-backend -n default
kubectl rollout status deployment/cloudflared -n default
```

Then open:
- `https://duotrak.org`
- `https://api.duotrak.org/`

## Important

You do **not** need to manually copy frontend and backend folders after this.
Push to GitHub `main` is the normal deployment flow.
