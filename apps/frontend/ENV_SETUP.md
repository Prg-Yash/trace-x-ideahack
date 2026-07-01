# 🔐 Environment Variables Setup

## ⚠️ Important: Secrets Management

**Never commit API keys to git!** Your `.env` files are in `.gitignore` for security.

---

## 🚀 Quick Setup

### Step 1: Copy Example Files

```bash
cd apps/frontend

# For web/development
cp .env.example .env

# For desktop app
cp .env.desktop.example .env.desktop
```

### Step 2: Add Your API Keys

Edit the copied files and replace placeholder values with your actual keys.

---

## 🔑 Required API Keys

### 1. OpenRouter API Key

**What it's for:** AI commentary and analysis features

**How to get:**
1. Visit: https://openrouter.ai/
2. Sign up/Login
3. Go to Keys section
4. Create new key
5. Copy to `VITE_OPEN_ROUTER_API_KEY`

**Free tier:** Yes (limited credits)

### 2. Gemini API Key

**What it's for:** Additional AI features (optional)

**How to get:**
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Create API key
4. Copy to `GEMINI_API_KEY`

**Free tier:** Yes (generous limits)

---

## 📝 Configuration Files

### `.env` (Web Development)

```env
# API Backend
VITE_API_URL=http://127.0.0.1:8000/api/v1

# AI Services
VITE_OPEN_ROUTER_API_KEY=sk-or-v1-your_key_here
GEMINI_API_KEY=your_gemini_key_here
VITE_SCRIPT_API_ENDPOINT=https://openrouter.ai/api/v1
```

### `.env.desktop` (Desktop App)

Same as `.env` but specifically for Tauri desktop builds.

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Keep `.env` files in `.gitignore`
- ✅ Use `.env.example` for templates
- ✅ Rotate keys if accidentally exposed
- ✅ Use environment-specific keys (dev/prod)

### ❌ DON'T:
- ❌ Commit `.env` files to git
- ❌ Share keys in chat/email
- ❌ Use production keys in development
- ❌ Hardcode keys in source code

---

## 🐛 Troubleshooting

### Issue: "API key not found"

**Solution:**
1. Verify `.env` file exists
2. Check file is named exactly `.env` (not `.env.txt`)
3. Restart dev server: `npm run dev`

### Issue: "Pushed secret to GitHub"

**Solution:**
1. Immediately rotate the exposed key
2. Remove from git history:
   ```bash
   git rm --cached apps/frontend/.env
   git commit -m "Remove secrets"
   git push
   ```
3. Visit GitHub security settings to dismiss alert

### Issue: "Environment variable not loading"

**Solution:**
1. Variables must start with `VITE_` to be exposed to frontend
2. Restart dev server after changing `.env`
3. Check browser console for actual variable values

---

## 🌐 Different Environments

### Local Development
```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

### Production
```env
VITE_API_URL=https://your-api-domain.com/api/v1
```

### ngrok Tunnel (for testing)
```env
VITE_API_URL=https://your-id.ngrok-free.app/api/v1
```

---

## 🔄 GitHub Actions (CI/CD)

For building with GitHub Actions, add secrets:

1. Go to: `Settings` → `Secrets and variables` → `Actions`
2. Click `New repository secret`
3. Add each secret:
   - `VITE_OPEN_ROUTER_API_KEY`
   - `GEMINI_API_KEY`

Then update `.github/workflows/build-desktop.yml`:

```yaml
- name: Build Tauri app
  env:
    VITE_OPEN_ROUTER_API_KEY: ${{ secrets.VITE_OPEN_ROUTER_API_KEY }}
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  working-directory: ./apps/frontend
  run: npm run tauri:build
```

---

## ✅ Verification

Check your setup:

```bash
# Should show your API key (in dev mode)
echo $VITE_OPEN_ROUTER_API_KEY

# Or check in browser console
console.log(import.meta.env.VITE_OPEN_ROUTER_API_KEY)
```

---

## 📚 Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [OpenRouter Docs](https://openrouter.ai/docs)
- [Gemini API Docs](https://ai.google.dev/docs)

---

## 🎯 Quick Start Checklist

- [ ] Copy `.env.example` to `.env`
- [ ] Copy `.env.desktop.example` to `.env.desktop`
- [ ] Get OpenRouter API key
- [ ] Get Gemini API key (optional)
- [ ] Add keys to both files
- [ ] Restart dev server
- [ ] Test API features work

---

**Setup complete! Your API keys are now secure.** 🔐
