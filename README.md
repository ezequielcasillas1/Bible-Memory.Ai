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
- Bible API key (free public API)

**Never exposed (properly secured):**
- OpenAI API key (server-side only)
- Database credentials
- Private API keys

## 🚀 Features

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
5. **Important**: Add OpenAI API key to Supabase Edge Functions environment variables (NOT in .env files)
6. Run development server: `npm run dev`

## 📚 Bible Versions Supported

- King James Version (KJV) - Available
- American Standard Version (ASV) - Available
- Additional versions coming soon

## 🤝 Contributing

Contributions are welcome! Please ensure all security best practices are followed.

## 📄 License

This project is open source and available under the MIT License.