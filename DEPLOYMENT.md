# 🚀 AI Voiceover Deployment Guide

## 🌟 **Option 1: Full Edge Stack (Recommended)**

### **Step 1: Deploy Backend to Cloudflare Workers**

```bash
# 1. Install Cloudflare CLI
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Deploy the edge backend
cd v2-cloudflare
./deploy.sh

# Your API will be live at:
# https://ai-voiceover-api.your-subdomain.workers.dev
```

### **Step 2: Deploy Frontend to Vercel**

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy SvelteKit frontend
cd v2-frontend

# 3. Update API endpoint in vite.config.ts
# Change proxy target to your Cloudflare Workers URL

# 4. Deploy to Vercel
vercel --prod

# Your app will be live at:
# https://ai-voiceover.vercel.app
```

### **Benefits:**
- ⚡ **Sub-50ms response times** globally
- 🌍 **320+ edge locations** worldwide
- 💰 **Serverless pricing** - pay per request
- 🔒 **Enterprise security** built-in
- 📈 **Unlimited scalability**

---

## 🔄 **Option 2: Railway Deployment (Easier)**

### **Step 1: Deploy Bun Backend to Railway**

```bash
# 1. Connect GitHub to Railway
# Visit: https://railway.app

# 2. Deploy from GitHub
# Select your repo > v2-backend folder
# Railway auto-detects Bun

# 3. Add environment variables:
OPENAI_API_KEY=your-key-here
PORT=8000

# Your API will be live at:
# https://your-app.railway.app
```

### **Step 2: Deploy Frontend to Vercel**

```bash
cd v2-frontend
# Update API proxy to Railway URL
vercel --prod
```

### **Benefits:**
- 🚀 **3x faster** than Flask
- 🛠️ **Easy deployment** from GitHub
- 💾 **Persistent storage**
- 🔧 **Simple configuration**

---

## 🎨 **Frontend Deployment Options**

### **Vercel (Recommended)**
```bash
cd v2-frontend
npm install -g vercel
vercel --prod
```
- ✅ **Perfect for SvelteKit**
- ✅ **Global CDN**
- ✅ **Zero config**
- ✅ **Free tier**

### **Cloudflare Pages**
```bash
# Connect GitHub repo to Cloudflare Pages
# Build command: npm run build
# Output directory: build
```
- ✅ **Global edge network**
- ✅ **Fast builds**
- ✅ **Integrated with Workers**

### **Netlify**
```bash
cd v2-frontend
npm install -g netlify-cli
netlify deploy --prod
```
- ✅ **Easy deployment**
- ✅ **Form handling**
- ✅ **Branch previews**

---

## 🗄️ **Database Options**

### **Cloudflare D1 (Edge)**
```bash
cd v2-cloudflare
wrangler d1 create ai-voiceover-db
wrangler d1 execute ai-voiceover-db --file=./schema.sql
```
- ✅ **Global replication**
- ✅ **Sub-millisecond reads**
- ✅ **Serverless SQLite**

### **Turso (Modern SQLite)**
```bash
# 1. Sign up at: https://turso.tech
# 2. Create database
# 3. Update connection string
```
- ✅ **Global SQLite**
- ✅ **Edge replicas**
- ✅ **Great for Bun**

### **Railway PostgreSQL**
```bash
# Add PostgreSQL service in Railway dashboard
# Connection string auto-provided
```
- ✅ **Traditional SQL**
- ✅ **Easy setup**
- ✅ **Persistent**

---

## 🔧 **Environment Variables**

### **Backend (.env)**
```bash
OPENAI_API_KEY=sk-your-key-here
DATABASE_URL=your-db-connection-string
NODE_ENV=production
PORT=8000
```

### **Cloudflare Workers**
```bash
# Set via Wrangler CLI or Dashboard
wrangler secret put OPENAI_API_KEY
```

### **Frontend**
```bash
# Update API endpoints in vite.config.ts
VITE_API_URL=https://your-backend-url.com
```

---

## 🎯 **Quick Start Commands**

### **Full Edge Deployment**
```bash
# Backend
cd v2-cloudflare
wrangler login
./deploy.sh

# Frontend  
cd ../v2-frontend
# Update API URL in vite.config.ts
vercel --prod
```

### **Railway + Vercel**
```bash
# 1. Push to GitHub
git push origin main

# 2. Connect Railway to GitHub
# 3. Deploy v2-backend folder

# 4. Deploy frontend
cd v2-frontend
vercel --prod
```

---

## 📊 **Cost Estimates**

### **Edge Stack (Cloudflare + Vercel)**
- **Cloudflare Workers:** $5/month (10M requests)
- **Vercel:** Free (hobby) / $20/month (pro)
- **Total:** ~$5-25/month

### **Railway + Vercel**
- **Railway:** $5/month (starter)
- **Vercel:** Free (hobby)
- **Total:** ~$5/month

### **All Free Tier**
- **Render:** Free (with limitations)
- **Netlify:** Free (hobby)
- **Total:** $0/month

---

## 🌟 **Portfolio Impact**

### **Edge Stack Shows:**
- ✅ **Cutting-edge knowledge** - Cloudflare Workers, Bun
- ✅ **Performance optimization** - Global edge deployment
- ✅ **Modern architecture** - Serverless, microservices
- ✅ **Scalability mindset** - Built for millions of users

### **URLs for Your Resume:**
- **Live App:** https://ai-voiceover.vercel.app
- **API Docs:** https://ai-voiceover-api.workers.dev/health
- **GitHub:** https://github.com/yourusername/ai-voiceover

---

## 🚀 **Next Steps**

1. **Choose your stack** (I recommend Edge for maximum impact)
2. **Set up accounts** (Cloudflare, Vercel, etc.)
3. **Deploy backend first** (get API working)
4. **Deploy frontend** (connect to API)
5. **Add custom domain** (professional touch)
6. **Set up monitoring** (analytics, logs)

**Ready to deploy? Let me know which option you want to go with!** 🎯
