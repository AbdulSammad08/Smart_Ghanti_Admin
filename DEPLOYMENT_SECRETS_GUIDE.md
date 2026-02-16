# ============================================
# Environment Variables & Secrets Configuration
# For Azure Container Apps Deployment
# ============================================

## ENVIRONMENT VARIABLES (Non-sensitive)

These should be set as environment variables in Azure Container Apps:

```
# Supabase Configuration
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_VISITORS_TABLE=visitors

# Recognition Thresholds
FACE_DISTANCE_THRESHOLD=0.6
MIN_FACE_DISTANCE=0.40

# System Configuration
LOG_LEVEL=INFO
SYNC_INTERVAL_MINUTES=5
```

## SECRETS (Sensitive - Use Azure Container Apps Secrets)

These MUST be managed as secrets/mounted volumes:

### 1. Firebase Service Account JSON
**Secret Name:** `firebase-creds`
**Mounted Path:** `/mnt/secrets/firebase-creds.json`

How to get:
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. In Azure Container Apps: Create a secret with the full JSON content
5. Mount at path: `/mnt/secrets/firebase-creds.json`

Example Firebase service account JSON structure:
```json
{
  "type": "service_account",
  "project_id": "smartbell-61451",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxx@smartbell-61451.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### 2. Supabase Service Role Key
**Secret Name:** `supabase-service-role-key`
**Environment Variable:** `SUPABASE_SERVICE_ROLE_KEY`

How to get:
1. Go to Supabase Dashboard > Project > Settings > API
2. Copy the `service_role` (secret) key
3. In Azure Container Apps: Create a secret with this value

## AZURE CONTAINER APPS SETUP

### Step 1: Create Environment Variables in Portal

In Azure Container Apps UI or via CLI:

```bash
# Via Azure CLI
az containerapp update \
  --name recog-face \
  --resource-group <your-rg> \
  --set-env-vars \
    SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co \
    SUPABASE_VISITORS_TABLE=visitors \
    SUPABASE_SERVICE_ROLE_KEY=<from-secret> \
    FACE_DISTANCE_THRESHOLD=0.6 \
    FIREBASE_CREDS_PATH=/mnt/secrets/firebase-creds.json
```

### Step 2: Create Secrets

```bash
# Create Firebase credentials secret
az containerapp secret set \
  --name recog-face \
  --resource-group <your-rg> \
  --secrets firebase-creds=@firebase-service-account.json

# Create Supabase service role key secret
az containerapp secret set \
  --name recog-face \
  --resource-group <your-rg> \
  --secrets supabase-key=<your-service-role-key>
```

### Step 3: Mount Secrets as Volume

When creating/updating the container app, mount the Firebase secret:

```bash
az containerapp update \
  --name recog-face \
  --resource-group <your-rg> \
  --volume-mounts \
    name=secrets-volume \
    path=/mnt/secrets
```

## REQUIRED ENVIRONMENT VARIABLES IN api.py

The system expects:
- `FIREBASE_CREDS_PATH` = `/mnt/secrets/firebase-creds.json`
- `SUPABASE_URL` = (from config.py or env var)
- `SUPABASE_SERVICE_ROLE_KEY` = (from env var)
- `SUPABASE_VISITORS_TABLE` = "visitors"

## VERIFICATION CHECKLIST

Before deploying to Azure Container Apps:

- [ ] Firebase service account JSON is secured in Azure Container Apps Secrets
- [ ] Supabase service role key is stored in Azure Container Apps Secrets
- [ ] SUPABASE_URL env var points to correct Supabase project
- [ ] SUPABASE_VISITORS_TABLE matches actual table name in Supabase
- [ ] FIREBASE_CREDS_PATH is set to `/mnt/secrets/firebase-creds.json`
- [ ] Volume mount is configured to mount secrets
- [ ] Port 5000 is exposed and ingress is enabled
- [ ] Health check endpoint `/health` is reachable

## LOCAL TESTING BEFORE DEPLOYMENT

To test locally before pushing to Azure:

```bash
# Create a .env file for local testing
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_VISITORS_TABLE=visitors
FIREBASE_CREDS_PATH=./backend/config/firebase-service-account.json

# Run locally
python api.py
```

## COMMON ISSUES

### Issue: "FileNotFoundError: Firebase credentials not found"
**Solution:** Check that Firebase service account is mounted at correct path or env var is set correctly

### Issue: "Supabase authentication failed"
**Solution:** Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct in Container Apps secrets

### Issue: "Cannot connect to database"
**Solution:** Check firewall rules in Supabase and Firebase allow connections from Azure Container Apps outbound IPs
