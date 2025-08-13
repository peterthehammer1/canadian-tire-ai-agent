# 🚀 Deploy to Vercel - Quick Guide

## ⚡ **5-Minute Deployment**

### **Step 1: Push to GitHub**
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - Canadian Tire AI Agent"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/canadian-tire-ai-agent.git
git push -u origin main
```

### **Step 2: Deploy to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your repository: `canadian-tire-ai-agent`
5. Click "Deploy"

### **Step 3: Configure Environment Variables**
In Vercel dashboard:
1. Go to your project
2. Click "Settings" → "Environment Variables"
3. Add: `RETELL_API_KEY` = `key_9fa420c9e4d8ffa2ab040b681898`

### **Step 4: Get Your URL**
Your app will be available at:
```
https://canadian-tire-ai-agent.vercel.app
```

### **Step 5: Configure Retell AI**
In Retell AI dashboard, set webhook to:
```
https://canadian-tire-ai-agent.vercel.app/webhook/ai
```

## 🎯 **What You'll Get**
- ✅ **Real domain** that Retell AI can reach
- ✅ **HTTPS** automatically enabled
- ✅ **Global CDN** for fast access
- ✅ **Automatic deployments** when you push to GitHub
- ✅ **Free hosting** for small apps

## 🔧 **After Deployment**
1. Test your app: Visit your Vercel URL
2. Test the webhook: Make a call to your AI agent
3. Monitor appointments: Check the admin interface

## 🆘 **Need Help?**
- Vercel docs: [vercel.com/docs](https://vercel.com/docs)
- Check deployment logs in Vercel dashboard
- Verify environment variables are set correctly

---

**Ready to deploy? Let's get your Canadian Tire AI agent online! 🚗✨**
