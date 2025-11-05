# 🚀 Production Deployment Setup

## Auto-Deploy from GitHub (Recommended)

### 1. Push to GitHub
```bash
git push origin main
```

### 2. Set up Cloudflare Auto-Deploy

**Connect GitHub to Cloudflare:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) 
2. Workers & Pages → Create → Pages
3. Connect to GitHub → Select your repo
4. Build settings:
   - **Framework:** None
   - **Build command:** `cd v2-cloudflare && npm run build`
   - **Build output:** `/dist`
   - **Root directory:** `/`

**Environment Variables:**
```bash
OPENAI_API_KEY=your-key-here
CLOUDFLARE_ACCOUNT_ID=your-account-id
```

### 3. Set up Vercel Auto-Deploy

**Connect GitHub to Vercel:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import Project → GitHub → Select your repo
3. Framework: **SvelteKit**
4. Root Directory: **v2-frontend**
5. Build settings auto-detected ✅

**Environment Variables:**
```bash
VITE_API_URL=https://your-workers-url.workers.dev
```

## 🌍 **What You Get**

### **Automatic Deployment Pipeline:**
- ✅ **Push to main** → Auto-deploy backend + frontend
- ✅ **Preview deployments** for pull requests
- ✅ **Zero-downtime** deployments
- ✅ **Rollback capability** if issues occur

### **Global Performance:**
- ✅ **Backend:** Cloudflare Workers in 320+ cities
- ✅ **Frontend:** Vercel Edge Network globally
- ✅ **Database:** D1 with global replication
- ✅ **Storage:** R2 with worldwide distribution

### **Production URLs:**
- **Frontend:** `https://your-app.vercel.app`
- **API:** `https://your-api.workers.dev`
- **Health:** `https://your-api.workers.dev/health`

## 🎯 **Current Status**

✅ **Backend deployed:** https://ai-voiceover-api.rss-reply.workers.dev  
🔄 **Frontend:** Setting up auto-deploy  
🗄️ **Database:** D1 configured with schema  
🪣 **Storage:** R2 bucket created  

## 🔧 **Manual Deploy (Backup)**

If auto-deploy fails:

```bash
# Backend
cd v2-cloudflare
wrangler deploy

# Frontend  
cd v2-frontend
vercel --prod --yes
```

## 📊 **Monitoring**

- **Cloudflare Analytics:** Real-time request metrics
- **Vercel Analytics:** Frontend performance data
- **Health Checks:** `/health` endpoint monitoring
- **Error Tracking:** Built-in error logging

---

**🎉 Your cutting-edge AI Voiceover app will auto-deploy on every push to main!**
