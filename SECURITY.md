# Security Documentation

## API Key Security

### ✅ Properly Secured Keys

The following keys are properly secured and never exposed to the client:

- **OpenAI API Key**: Stored only in Supabase Edge Functions environment variables
- **Supabase Service Role Key**: Never used in frontend code

### 🔓 Public Keys (Safe to Expose)

The following keys are designed to be public and safe to include in frontend code:

- **Supabase URL** (`VITE_SUPABASE_URL`): Public endpoint for your Supabase project
- **Supabase Anon Key** (`VITE_SUPABASE_ANON_KEY`): Anonymous key with Row Level Security
- **Bible API Key** (`BIBLE_API_KEY`): Free public API key for bible-api.com

### 🔒 Security Measures Implemented

1. **Server-Side API Calls**: All sensitive API calls happen in Supabase Edge Functions
2. **Rate Limiting**: Implemented to prevent abuse
3. **Input Validation**: All user inputs are validated and sanitized
4. **Authentication**: Proper authorization checks on all endpoints
5. **Error Handling**: No sensitive information leaked in error messages

### 🚨 What to Never Expose

- OpenAI API keys
- Database passwords
- Private API keys
- Supabase service role keys
- Any key that costs money per request

### 📋 Security Checklist

- [x] OpenAI API key stored in Supabase Edge Functions only
- [x] No sensitive keys in frontend code
- [x] Rate limiting implemented
- [x] Input validation and sanitization
- [x] Proper error handling
- [x] Authentication on all endpoints

### 🔍 How to Verify Security

1. **Check Network Tab**: OpenAI API key should never appear in browser network requests
2. **View Source**: No sensitive keys should be visible in HTML source
3. **Bundle Analysis**: No sensitive keys in JavaScript bundles
4. **Environment Variables**: Only public keys should have `VITE_` prefix

### 📞 Reporting Security Issues

If you believe you've found a security vulnerability, please report it responsibly.