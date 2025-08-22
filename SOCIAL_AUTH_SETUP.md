# Social Authentication Setup Guide

## 🔐 Setting Up Social OAuth Providers

This guide will walk you through connecting Google, Facebook, and X (Twitter) to your Bible Memory AI application.

## 📋 Prerequisites

- Access to your Supabase Dashboard
- Developer accounts for each social platform
- Your live site URL: `https://biblememory.ai`

---

## 🔵 1. Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client IDs**
5. Choose **Web application**
6. Add these **Authorized redirect URIs**:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   http://localhost:54321/auth/v1/callback
   ```
7. Copy your **Client ID** and **Client Secret**

### Step 2: Configure in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **Google** and toggle it **ON**
3. Enter your **Client ID** and **Client Secret**
4. Click **Save**

---

## 🔵 2. Facebook OAuth Setup

### Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **Create App** → **Consumer** → **Next**
3. Enter app name: "Bible Memory AI"
4. Add **Facebook Login** product
5. Go to **Facebook Login** → **Settings**
6. Add **Valid OAuth Redirect URIs**:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   http://localhost:54321/auth/v1/callback
   ```
7. Copy your **App ID** and **App Secret** from **Settings** → **Basic**

### Step 2: Configure in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **Facebook** and toggle it **ON**
3. Enter your **Client ID** (App ID) and **Client Secret** (App Secret)
4. Click **Save**

---

## 🔵 3. X (Twitter) OAuth Setup

### Step 1: Create Twitter App

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Apply for developer account if needed
3. Create a new **App**
4. Go to **App Settings** → **Authentication settings**
5. Enable **OAuth 2.0**
6. Add **Callback URLs**:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   http://localhost:54321/auth/v1/callback
   ```
7. Copy your **Client ID** and **Client Secret**

### Step 2: Configure in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **Twitter** and toggle it **ON**
3. Enter your **Client ID** and **Client Secret**
4. Click **Save**

---

## 🔵 4. Instagram OAuth Setup

Instagram login is handled through Facebook Business. You need:

1. **Facebook Business Account**
2. **Instagram Business Account** linked to Facebook
3. Follow Facebook setup above
4. In Facebook App, add **Instagram Basic Display** product
5. Configure Instagram permissions in Facebook Developer Console

---

## 🔵 5. Snapchat OAuth Setup

Snapchat requires custom OAuth implementation:

1. Go to [Snapchat Developer Portal](https://developers.snapchat.com/)
2. Create a new app
3. Get **Client ID** and **Client Secret**
4. This requires custom implementation in Supabase Edge Functions

---

## ⚙️ Supabase Configuration

### Site URL Configuration

1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Set **Site URL**: `https://biblememory.ai`
3. Add **Redirect URLs**:
   ```
   https://biblememory.ai/auth/callback
   http://localhost:5173/auth/callback
   ```

### Email Templates (Optional)

Customize email templates in **Authentication** → **Email Templates**:
- Confirmation email
- Password reset email
- Magic link email

---

## 🧪 Testing Social Login

1. **Development**: Test with `http://localhost:5173`
2. **Production**: Test with `https://biblememory.ai`
3. Check browser console for any OAuth errors
4. Verify user creation in **Authentication** → **Users**

---

## 🔍 Finding Your Supabase Project Reference

Your Supabase project reference is in your project URL:
```
https://your-project-ref.supabase.co
```

Replace `your-project-ref` with your actual project reference in all callback URLs.

---

## 🚨 Common Issues & Solutions

### Issue: "Invalid redirect URI"
**Solution**: Ensure callback URLs match exactly in both platforms

### Issue: "App not approved for production"
**Solution**: Submit apps for review on Facebook/Google for production use

### Issue: "OAuth error in console"
**Solution**: Check that all credentials are correctly entered in Supabase

### Issue: "User creation fails"
**Solution**: Verify RLS policies allow user profile creation

---

## 📞 Support

If you encounter issues:
1. Check Supabase logs in **Logs** → **Auth**
2. Verify all callback URLs are correct
3. Ensure OAuth apps are in "Live" mode (not development)
4. Test with different browsers/incognito mode

---

## ✅ Verification Checklist

- [ ] Google OAuth credentials created and configured
- [ ] Facebook app created and configured  
- [ ] Twitter app created and configured
- [ ] Supabase providers enabled with correct credentials
- [ ] Site URL and redirect URLs configured
- [ ] Tested login flow in development
- [ ] Tested login flow in production
- [ ] User profiles created successfully
- [ ] Social login buttons working in UI

Once all providers are configured, users will be able to sign in with their social accounts seamlessly!