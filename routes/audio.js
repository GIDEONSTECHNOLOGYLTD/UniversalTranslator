const express = require('express');
const router = express.Router();

// Text-to-speech endpoint
router.post('/speak', (req, res) => {
    try {
        const { text, language, voice = 'default' } = req.body;
        
        if (!text) {
            return res.status(400).json({
                error: 'Text is required for speech synthesis'
            });
        }
        
        // For now, return instructions for client-side TTS
        // In production, you might use services like Google TTS, Amazon Polly, etc.
        res.json({
            message: 'Use client-side Web Speech API for text-to-speech',
            text,
            language: language || 'en',
            voice,
            instructions: {
                api: 'speechSynthesis',
                method: 'speak',
                voiceURI: getVoiceURI(language)
            }
        });
        
    } catch (error) {
        console.error('TTS error:', error);
        res.status(500).json({
            error: 'Text-to-speech failed',
            message: error.message
        });
    }
});

// Get available voices for a language
router.get('/voices/:language', (req, res) => {
    try {
        const { language } = req.params;
        
        // Voice mappings for different languages
        const voiceMap = {
            'english': ['en-US', 'en-GB', 'en-AU'],
            'twi': ['en-GH'], // Fallback to English Ghana
            'yoruba': ['en-NG'], // Fallback to English Nigeria
            'hausa': ['en-NG'],
            'igbo': ['en-NG'],
            'french': ['fr-FR', 'fr-CA'],
            'spanish': ['es-ES', 'es-MX'],
            'arabic': ['ar-SA', 'ar-EG'],
            'swahili': ['sw-KE'],
            'amharic': ['am-ET'],
            'portuguese': ['pt-BR', 'pt-PT'],
            'mandarin': ['zh-CN', 'zh-TW'],
            'hindi': ['hi-IN'],
            'urdu': ['ur-PK']
        };
        
        const voices = voiceMap[language.toLowerCase()] || ['en-US'];
        
        res.json({
            language,
            voices,
            default: voices[0],
            total: voices.length
        });
        
    } catch (error) {
        console.error('Error fetching voices:', error);
        res.status(500).json({
            error: 'Failed to fetch voices',
            message: error.message
        });
    }
});

// Speech recognition endpoint (placeholder)
router.post('/recognize', (req, res) => {
    try {
        const { language = 'english' } = req.body;
        
        // Return instructions for client-side speech recognition
        res.json({
            message: 'Use client-side Web Speech API for speech recognition',
            language,
            instructions: {
                api: 'webkitSpeechRecognition',
                lang: getLanguageCode(language),
                continuous: false,
                interimResults: true
            }
        });
        
    } catch (error) {
        console.error('Speech recognition error:', error);
        res.status(500).json({
            error: 'Speech recognition setup failed',
            message: error.message
        });
    }
});

// Audio pronunciation guide
router.get('/pronunciation/:language/:word', (req, res) => {
    try {
        const { language, word } = req.params;
        
        // Basic pronunciation guides for common words
        const pronunciationGuides = {
            'twi': {
                'akwaaba': 'ah-KWAH-bah',
                'medaase': 'meh-DAH-seh',
                'aane': 'AH-neh',
                'daabi': 'DAH-bee'
            },
            'yoruba': {
                'kaabo': 'KAH-ah-boh',
                'e se': 'eh-SHEH',
                'beni': 'BEH-nee',
                'rara': 'RAH-rah',
                'bawo ni': 'BAH-woh nee'
            },
            'hausa': {
                'sannu': 'SAHN-noo',
                'na gode': 'nah GOH-deh',
                'yaya kake': 'YAH-yah KAH-keh'
            },
            'igbo': {
                'ndewo': 'n-DEH-woh',
                'dalu': 'DAH-loo',
                'kedu ka i mere': 'KEH-doo kah ee MEH-reh'
            }
        };
        
        const guide = pronunciationGuides[language.toLowerCase()]?.[word.toLowerCase()];
        
        if (!guide) {
            return res.status(404).json({
                error: 'Pronunciation guide not available',
                language,
                word
            });
        }
        
        res.json({
            word,
            language,
            pronunciation: guide,
            phonetic: guide,
            tips: getPronunciationTips(language)
        });
        
    } catch (error) {
        console.error('Error fetching pronunciation:', error);
        res.status(500).json({
            error: 'Failed to fetch pronunciation guide',
            message: error.message
        });
    }
});

// Helper function to get voice URI
function getVoiceURI(language) {
    const voiceMap = {
        'english': 'en-US',
        'twi': 'en-GH',
        'yoruba': 'en-NG',
        'hausa': 'en-NG',
        'igbo': 'en-NG',
        'french': 'fr-FR',
        'spanish': 'es-ES',
        'arabic': 'ar-SA',
        'swahili': 'sw-KE',
        'portuguese': 'pt-BR',
        'mandarin': 'zh-CN',
        'hindi': 'hi-IN'
    };
    
    return voiceMap[language.toLowerCase()] || 'en-US';
}

// Helper function to get language code for speech recognition
function getLanguageCode(language) {
    const codeMap = {
        'english': 'en-US',
        'twi': 'en-GH',
        'yoruba': 'en-NG',
        'hausa': 'en-NG',
        'igbo': 'en-NG',
        'french': 'fr-FR',
        'spanish': 'es-ES',
        'arabic': 'ar-SA',
        'swahili': 'sw-KE',
        'portuguese': 'pt-BR',
        'mandarin': 'zh-CN',
        'hindi': 'hi-IN'
    };
    
    return codeMap[language.toLowerCase()] || 'en-US';
}

// Helper function to get pronunciation tips
function getPronunciationTips(language) {
    const tips = {
        'twi': [
            'Twi is a tonal language - pay attention to pitch',
            'Vowels are generally pronounced clearly',
            'Double vowels are held longer'
        ],
        'yoruba': [
            'Yoruba has three tones: high, mid, and low',
            'Tone marks are crucial for meaning',
            'Nasal vowels are common'
        ],
        'hausa': [
            'Hausa has distinctive long and short vowels',
            'Glottal stops are important',
            'Emphasis on correct vowel length'
        ],
        'igbo': [
            'Igbo is tonal with high and low tones',
            'Vowel harmony is important',
            'Some consonant clusters may be challenging'
        ]
    };
    
    return tips[language.toLowerCase()] || ['Practice with native speakers when possible'];
}

module.exports = router;
