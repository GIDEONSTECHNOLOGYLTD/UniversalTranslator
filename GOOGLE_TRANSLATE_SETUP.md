# Google Translate API Setup Guide

## Why Use Google Translate API?

Your Universal Translator currently uses custom dictionaries for African languages, which work great for common words and phrases. However, Google Translate API will significantly improve:

- **Complex sentences and phrases** not in custom dictionaries
- **Grammar and context** understanding
- **Broader vocabulary** coverage
- **More natural translations** for longer texts
- **Support for all 69 languages** in your app

## Step-by-Step Setup

### 1. Create Google Cloud Account
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Accept terms and create a new project (or use existing)

### 2. Enable Translate API
1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Cloud Translation API"
3. Click on "Cloud Translation API" and click **Enable**

### 3. Create API Key
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **API Key**
3. Copy the generated API key
4. (Recommended) Click **Restrict Key** and limit to "Cloud Translation API"

### 4. Configure Your App
1. Create a `.env` file in your project root:
```bash
cp .env.example .env
```

2. Edit `.env` and add your API key:
```env
GOOGLE_TRANSLATE_API_KEY=your_actual_api_key_here
```

3. Restart your server:
```bash
npm start
```

### 5. Test the Integration
```bash
# Test with a complex sentence
curl -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"I hope you have a wonderful day","from":"english","to":"swahili"}'
```

## How It Works

Your app now uses a **smart fallback system**:

1. **Custom Dictionary** (95% confidence) - For common words/phrases
2. **Google Translate** (80% confidence) - For complex sentences
3. **Basic Translation** (50% confidence) - Word-by-word fallback

## Pricing

Google Translate API pricing:
- **Free tier**: 500,000 characters per month
- **Paid**: $20 per 1M characters after free tier
- Most personal/small business use stays within free tier

## Security Notes

- Never commit your API key to version control
- The `.env` file is already in `.gitignore`
- Consider using environment variables in production
- Restrict your API key to specific APIs and domains

## Troubleshooting

**"Translation failed"**: Check your API key and internet connection
**"Quota exceeded"**: You've hit the free tier limit
**"API not enabled"**: Make sure Cloud Translation API is enabled

## Testing Without API Key

Your app works perfectly without Google Translate using custom dictionaries for:
- Swahili, Zulu, Amharic, Luganda, Bambara
- Common phrases in 15+ other African languages
- Offline caching for repeated translations

The Google API just makes it even better for complex sentences!
