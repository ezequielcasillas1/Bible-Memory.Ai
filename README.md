# Bible Memory AI

A modern web application for memorizing Bible verses with AI-powered assistance.

## 🔒 Security Notice

**Your OpenAI API key is secure!** This application properly handles API keys:

- ✅ OpenAI API key is stored server-side only (Supabase Edge Functions)
- ✅ No sensitive keys are exposed in the frontend code
- ✅ All API calls to OpenAI happen server-side
- ✅ Rate limiting and input validation implemented

### Public vs Private Keys

**Safe to be public (already in code):**
- Supabase URL and Anon Key (designed for frontend use)

**Never exposed (properly secured):**
- OpenAI API key (server-side only)
- Bible API key (server-side only)
- Database credentials
- Private API keys

## 🚀 Features

- **Secure Authentication**: Email/password and social login (Google, Facebook, X, Instagram, Snapchat)
- **AI-Powered Verse Generation**: Get personalized Bible verses for memorization
- **Interactive Memorization**: Study timer and accuracy tracking
- **Multiple Bible Versions**: Support for KJV, ASV, and more
- **Search & Favorites**: Find and save your favorite verses
- **Progress Tracking**: Monitor your memorization journey
- **Responsive Design**: Works on all devices

## 🛠️ Technology Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase Edge Functions
- **AI**: OpenAI GPT-4 (server-side only)
- **Bible Data**: Multiple Bible APIs
- **Deployment**: Netlify

## 🔧 Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local`
4. Set up Supabase project and add environment variables
5. Configure authentication providers in Supabase Dashboard:
   - Go to Authentication > Settings > Auth Providers
   - Enable and configure: Google, Facebook, Twitter
   - Set Site URL: `https://biblememory.ai`
   - Set Redirect URLs: `https://biblememory.ai/auth/callback`
5. **Important**: Add these API keys to Supabase Edge Functions environment variables (NOT in .env files):
   - `OPENAI_API_KEY=your_openai_key`
   - `BIBLE_API_KEY=your_bible_api_key`
6. Run development server: `npm run dev`

## 🔐 Authentication Setup

### Social Login Configuration

Configure these OAuth providers in your Supabase Dashboard:

1. **Google OAuth**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`

2. **Facebook OAuth**:
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a Facebook App
   - Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`

3. **Twitter OAuth**:
   - Go to [Twitter Developer Portal](https://developer.twitter.com/)
   - Create an app and get API keys
   - Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`

### Default User Account

A free user account has been configured for: `ezequielcasillas1@gmail.com`

## 📚 Bible Versions Supported

- King James Version (KJV) - Available
- American Standard Version (ASV) - Available
- Additional versions coming soon

## 🤝 Contributing

Contributions are welcome! Please ensure all security best practices are followed.

## 📄 License

This project is open source and available under the MIT License.