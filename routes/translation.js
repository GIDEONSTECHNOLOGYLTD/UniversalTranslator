const express = require('express');
const router = express.Router();
const axios = require('axios');

// Language mappings for better support
const LANGUAGE_CODES = {
    'twi': 'tw',
    'akan': 'ak',
    'yoruba': 'yo',
    'hausa': 'ha',
    'igbo': 'ig',
    'english': 'en',
    'french': 'fr',
    'spanish': 'es',
    'arabic': 'ar',
    'swahili': 'sw',
    'amharic': 'am',
    'portuguese': 'pt',
    'mandarin': 'zh',
    'hindi': 'hi',
    'urdu': 'ur',
    'fulani': 'ff',
    'kanuri': 'kr',
    'tiv': 'tiv',
    'edo': 'bin',
    'efik': 'efi',
    'zulu': 'zu'
};

// Custom translation dictionaries for African languages
const CUSTOM_TRANSLATIONS = {
    'twi_to_yoruba': {
        'akwaaba': 'kaabo',
        'medaase': 'e se',
        'aane': 'beni',
        'daabi': 'rara',
        'me din de': 'oruko mi ni',
        'wo ho te sen': 'bawo ni',
        'me pe wo': 'mo feran re',
        'nante yiye': 'o dabo',
        'ɛyɛ': 'o dara',
        'mepaakyɛw': 'je ka lo'
    },
    'yoruba_to_twi': {
        'kaabo': 'akwaaba',
        'e se': 'medaase',
        'beni': 'aane',
        'rara': 'daabi',
        'oruko mi ni': 'me din de',
        'bawo ni': 'wo ho te sen',
        'mo feran re': 'me pe wo',
        'o dabo': 'nante yiye',
        'o dara': 'ɛyɛ',
        'je ka lo': 'mepaakyɛw'
    },
    // Swahili translations (Tanzania, Kenya)
    'english_to_swahili': {
        'hello': 'hujambo',
        'goodbye': 'kwaheri',
        'thank you': 'asante',
        'please': 'tafadhali',
        'yes': 'ndio',
        'no': 'hapana',
        'good': 'nzuri',
        'how are you': 'habari yako',
        'how are you today': 'habari yako leo',
        'i love you': 'nakupenda',
        'have a good day': 'uwe na siku njema',
        'see you later': 'tutaonana baadaye',
        'what is your name': 'jina lako ni nani',
        'my name is': 'jina langu ni',
        'welcome': 'karibu',
        'friend': 'rafiki',
        'family': 'familia',
        'love': 'upendo',
        'peace': 'amani',
        'water': 'maji',
        'food': 'chakula'
    },
    'swahili_to_english': {
        'hujambo': 'hello',
        'kwaheri': 'goodbye',
        'asante': 'thank you',
        'tafadhali': 'please',
        'ndio': 'yes',
        'hapana': 'no',
        'nzuri': 'good',
        'habari yako': 'how are you',
        'habari yako leo': 'how are you today',
        'nakupenda': 'i love you',
        'uwe na siku njema': 'have a good day',
        'tutaonana baadaye': 'see you later',
        'jina lako ni nani': 'what is your name',
        'jina langu ni': 'my name is',
        'karibu': 'welcome',
        'rafiki': 'friend',
        'familia': 'family',
        'upendo': 'love',
        'amani': 'peace',
        'maji': 'water',
        'chakula': 'food'
    },
    // Zulu translations
    'english_to_zulu': {
        'hello': 'sawubona',
        'goodbye': 'sala kahle',
        'thank you': 'ngiyabonga',
        'please': 'ngicela',
        'yes': 'yebo',
        'no': 'cha',
        'good': 'okuhle',
        'how are you': 'unjani',
        'welcome': 'siyakwamukela',
        'friend': 'umngane',
        'family': 'umndeni',
        'love': 'uthando',
        'peace': 'ukuthula',
        'water': 'amanzi',
        'food': 'ukudla'
    },
    'zulu_to_english': {
        'sawubona': 'hello',
        'sala kahle': 'goodbye',
        'ngiyabonga': 'thank you',
        'ngicela': 'please',
        'yebo': 'yes',
        'cha': 'no',
        'okuhle': 'good',
        'unjani': 'how are you',
        'siyakwamukela': 'welcome',
        'umngane': 'friend',
        'umndeni': 'family',
        'uthando': 'love',
        'ukuthula': 'peace',
        'amanzi': 'water',
        'ukudla': 'food'
    },
    // Amharic translations (basic transliterations)
    'english_to_amharic': {
        'hello': 'selam',
        'goodbye': 'dehna hun',
        'thank you': 'ameseginalehu',
        'please': 'ebakish',
        'yes': 'awo',
        'no': 'alelem',
        'good': 'tiru',
        'how are you': 'dehneh neh',
        'welcome': 'enquan dehna metash',
        'friend': 'guadegna',
        'family': 'beteseb',
        'love': 'fikir',
        'peace': 'selam',
        'water': 'wuha',
        'food': 'migib'
    },
    'amharic_to_english': {
        'selam': 'hello',
        'dehna hun': 'goodbye',
        'ameseginalehu': 'thank you',
        'ebakish': 'please',
        'awo': 'yes',
        'alelem': 'no',
        'tiru': 'good',
        'dehneh neh': 'how are you',
        'enquan dehna metash': 'welcome',
        'guadegna': 'friend',
        'beteseb': 'family',
        'fikir': 'love',
        'wuha': 'water',
        'migib': 'food'
    },
    // Luganda translations (Uganda)
    'english_to_luganda': {
        'hello': 'ki kati',
        'goodbye': 'tulabagane',
        'thank you': 'webale',
        'please': 'nsaba',
        'yes': 'ye',
        'no': 'nedda',
        'good': 'kirungi',
        'how are you': 'oli otya',
        'welcome': 'tukusanyuse',
        'friend': 'mukwano',
        'family': 'famire',
        'love': 'okwagala',
        'peace': 'emirembe',
        'water': 'amazzi',
        'food': 'emmere'
    },
    'luganda_to_english': {
        'ki kati': 'hello',
        'tulabagane': 'goodbye',
        'webale': 'thank you',
        'nsaba': 'please',
        'ye': 'yes',
        'nedda': 'no',
        'kirungi': 'good',
        'oli otya': 'how are you',
        'tukusanyuse': 'welcome',
        'mukwano': 'friend',
        'famire': 'family',
        'okwagala': 'love',
        'emirembe': 'peace',
        'amazzi': 'water',
        'emmere': 'food'
    },
    // Bambara translations (Mali)
    'english_to_bambara': {
        'hello': 'i ni ce',
        'goodbye': 'kan ben',
        'thank you': 'i ni ce kosebe',
        'please': 'sabali',
        'yes': 'awon',
        'no': 'ayi',
        'good': 'ka nyi',
        'how are you': 'i ka kene wa',
        'welcome': 'bisimila',
        'friend': 'teri',
        'family': 'somogo',
        'love': 'kanu',
        'peace': 'heri',
        'water': 'ji',
        'food': 'dumuni'
    },
    'bambara_to_english': {
        'i ni ce': 'hello',
        'kan ben': 'goodbye',
        'i ni ce kosebe': 'thank you',
        'sabali': 'please',
        'awon': 'yes',
        'ayi': 'no',
        'ka nyi': 'good',
        'i ka kene wa': 'how are you',
        'bisimila': 'welcome',
        'teri': 'friend',
        'somogo': 'family',
        'kanu': 'love',
        'heri': 'peace',
        'ji': 'water',
        'dumuni': 'food'
    },
    // Yoruba translations (Nigeria) - COMPREHENSIVE
    'english_to_yoruba': {
        'hello': 'kaabo',
        'hi': 'bawo',
        'goodbye': 'o dabo',
        'bye': 'o dabo',
        'thank you': 'e se',
        'thanks': 'e se',
        'please': 'je ka lo',
        'yes': 'beni',
        'no': 'rara',
        'good': 'o dara',
        'bad': 'buburu',
        'how are you': 'bawo ni',
        'where': 'nibo',
        'when': 'nigbawo',
        'why': 'kilode',
        'what': 'kini',
        'who': 'tani',
        'how': 'bawo',
        'go': 'lo',
        'come': 'wa',
        'stop': 'duro',
        'wait': 'duro',
        'help': 'ran mi lowo',
        'sorry': 'pele',
        'excuse me': 'e ma binu',
        'welcome': 'kaabo',
        'friend': 'ore',
        'family': 'ebi',
        'mother': 'mama',
        'father': 'baba',
        'child': 'omo',
        'love': 'ife',
        'like': 'feran',
        'want': 'fe',
        'need': 'nilo',
        'have': 'ni',
        'get': 'gba',
        'give': 'fun',
        'take': 'gba',
        'see': 'ri',
        'look': 'wo',
        'hear': 'gbo',
        'speak': 'so',
        'eat': 'je',
        'drink': 'mu',
        'sleep': 'sun',
        'work': 'ise',
        'play': 'sere',
        'read': 'ka',
        'write': 'ko',
        'buy': 'ra',
        'sell': 'ta',
        'money': 'owo',
        'time': 'akoko',
        'day': 'ojo',
        'night': 'ale',
        'morning': 'owuro',
        'afternoon': 'osan',
        'evening': 'ale',
        'today': 'oni',
        'tomorrow': 'ola',
        'yesterday': 'ana',
        'now': 'bayi',
        'later': 'nigbamii',
        'here': 'nibi',
        'there': 'nibe',
        'home': 'ile',
        'house': 'ile',
        'school': 'ile iwe',
        'hospital': 'ile iwosan',
        'market': 'oja',
        'church': 'ile ijoba',
        'mosque': 'moti',
        'peace': 'alaafia',
        'water': 'omi',
        'food': 'onje',
        'rice': 'iresi',
        'bread': 'buredi',
        'meat': 'eran',
        'fish': 'eja',
        'car': 'oko',
        'bus': 'oko ero',
        'phone': 'foonu',
        'book': 'iwe',
        'pen': 'kalam',
        'big': 'nla',
        'small': 'kekere',
        'hot': 'gbona',
        'cold': 'tutu',
        'fast': 'yara',
        'slow': 'lafiaji',
        'happy': 'dun',
        'sad': 'banuje',
        'angry': 'binu',
        'tired': 'are',
        'hungry': 'ebi',
        'thirsty': 'ongbe',
        'sick': 'aisun',
        'fine': 'dada',
        'beautiful': 'lewa',
        'ugly': 'egan',
        'new': 'tuntun',
        'old': 'atijo',
        'young': 'odo',
        'man': 'okunrin',
        'woman': 'obinrin',
        'boy': 'omokunrin',
        'girl': 'omobinrin'
    },
    'yoruba_to_english': {
        'kaabo': 'hello',
        'bawo': 'hi',
        'o dabo': 'goodbye',
        'e se': 'thank you',
        'je ka lo': 'please',
        'beni': 'yes',
        'rara': 'no',
        'o dara': 'good',
        'buburu': 'bad',
        'bawo ni': 'how are you',
        'nibo': 'where',
        'nigbawo': 'when',
        'kilode': 'why',
        'kini': 'what',
        'tani': 'who',
        'lo': 'go',
        'wa': 'come',
        'duro': 'stop',
        'ran mi lowo': 'help',
        'pele': 'sorry',
        'e ma binu': 'excuse me',
        'ore': 'friend',
        'ebi': 'family',
        'mama': 'mother',
        'baba': 'father',
        'omo': 'child',
        'ife': 'love',
        'feran': 'like',
        'fe': 'want',
        'nilo': 'need',
        'ni': 'have',
        'gba': 'get',
        'fun': 'give',
        'ri': 'see',
        'wo': 'look',
        'gbo': 'hear',
        'so': 'speak',
        'je': 'eat',
        'mu': 'drink',
        'sun': 'sleep',
        'ise': 'work',
        'sere': 'play',
        'ka': 'read',
        'ko': 'write',
        'ra': 'buy',
        'ta': 'sell',
        'owo': 'money',
        'akoko': 'time',
        'ojo': 'day',
        'ale': 'night',
        'owuro': 'morning',
        'osan': 'afternoon',
        'oni': 'today',
        'ola': 'tomorrow',
        'ana': 'yesterday',
        'bayi': 'now',
        'nigbamii': 'later',
        'nibi': 'here',
        'nibe': 'there',
        'ile': 'home',
        'ile iwe': 'school',
        'ile iwosan': 'hospital',
        'oja': 'market',
        'ile ijoba': 'church',
        'moti': 'mosque',
        'alaafia': 'peace',
        'omi': 'water',
        'onje': 'food',
        'iresi': 'rice',
        'buredi': 'bread',
        'eran': 'meat',
        'eja': 'fish',
        'oko': 'car',
        'oko ero': 'bus',
        'foonu': 'phone',
        'iwe': 'book',
        'kalam': 'pen',
        'nla': 'big',
        'kekere': 'small',
        'gbona': 'hot',
        'tutu': 'cold',
        'yara': 'fast',
        'lafiaji': 'slow',
        'dun': 'happy',
        'banuje': 'sad',
        'binu': 'angry',
        'are': 'tired',
        'ongbe': 'thirsty',
        'aisun': 'sick',
        'dada': 'fine',
        'lewa': 'beautiful',
        'egan': 'ugly',
        'tuntun': 'new',
        'atijo': 'old',
        'odo': 'young',
        'okunrin': 'man',
        'obinrin': 'woman',
        'omokunrin': 'boy',
        'omobinrin': 'girl'
    },
    // Twi/Akan translations (Ghana)
    'english_to_twi': {
        'hello': 'akwaaba',
        'goodbye': 'nante yiye',
        'thank you': 'medaase',
        'please': 'mepaakyɛw',
        'yes': 'aane',
        'no': 'daabi',
        'good': 'ɛyɛ',
        'how are you': 'wo ho te sen',
        'where': 'ɛhe',
        'when': 'bere ben',
        'why': 'adɛn',
        'what': 'dɛn',
        'who': 'hena',
        'how': 'sɛn',
        'welcome': 'akwaaba',
        'friend': 'adamfo',
        'family': 'abusua',
        'love': 'ɔdɔ',
        'peace': 'asomdwoe',
        'water': 'nsuo',
        'food': 'aduan'
    },
    'twi_to_english': {
        'akwaaba': 'hello',
        'nante yiye': 'goodbye',
        'medaase': 'thank you',
        'mepaakyɛw': 'please',
        'aane': 'yes',
        'daabi': 'no',
        'ɛyɛ': 'good',
        'wo ho te sen': 'how are you',
        'ɛhe': 'where',
        'bere ben': 'when',
        'adɛn': 'why',
        'dɛn': 'what',
        'hena': 'who',
        'sɛn': 'how',
        'adamfo': 'friend',
        'abusua': 'family',
        'ɔdɔ': 'love',
        'asomdwoe': 'peace',
        'nsuo': 'water',
        'aduan': 'food'
    },
    // Hausa translations (Nigeria, Niger)
    'english_to_hausa': {
        'hello': 'sannu',
        'goodbye': 'sai anjima',
        'thank you': 'na gode',
        'please': 'don Allah',
        'yes': 'eh',
        'no': 'a\'a',
        'good': 'mai kyau',
        'how are you': 'yaya kake',
        'where': 'ina',
        'when': 'yaushe',
        'why': 'me yasa',
        'what': 'me',
        'who': 'wa',
        'how': 'yaya',
        'welcome': 'maraba',
        'friend': 'aboki',
        'family': 'iyali',
        'love': 'kauna',
        'peace': 'zaman lafiya',
        'water': 'ruwa',
        'food': 'abinci'
    },
    'hausa_to_english': {
        'sannu': 'hello',
        'sai anjima': 'goodbye',
        'na gode': 'thank you',
        'don Allah': 'please',
        'eh': 'yes',
        'a\'a': 'no',
        'mai kyau': 'good',
        'yaya kake': 'how are you',
        'ina': 'where',
        'yaushe': 'when',
        'me yasa': 'why',
        'me': 'what',
        'wa': 'who',
        'yaya': 'how',
        'maraba': 'welcome',
        'aboki': 'friend',
        'iyali': 'family',
        'kauna': 'love',
        'zaman lafiya': 'peace',
        'ruwa': 'water',
        'abinci': 'food'
    },
    // Igbo translations (Nigeria)
    'english_to_igbo': {
        'hello': 'ndewo',
        'goodbye': 'ka omesia',
        'thank you': 'dalu',
        'please': 'biko',
        'yes': 'ee',
        'no': 'mba',
        'good': 'oma',
        'how are you': 'kedu ka i mere',
        'where': 'ebee',
        'when': 'mgbe',
        'why': 'gini mere',
        'what': 'gini',
        'who': 'onye',
        'how': 'kedu',
        'welcome': 'nnoo',
        'friend': 'enyi',
        'family': 'ezina ulo',
        'love': 'ihunanya',
        'peace': 'udo',
        'water': 'mmiri',
        'food': 'nri'
    },
    'igbo_to_english': {
        'ndewo': 'hello',
        'ka omesia': 'goodbye',
        'dalu': 'thank you',
        'biko': 'please',
        'ee': 'yes',
        'mba': 'no',
        'oma': 'good',
        'kedu ka i mere': 'how are you',
        'ebee': 'where',
        'mgbe': 'when',
        'gini mere': 'why',
        'gini': 'what',
        'onye': 'who',
        'kedu': 'how',
        'nnoo': 'welcome',
        'enyi': 'friend',
        'ezina ulo': 'family',
        'ihunanya': 'love',
        'udo': 'peace',
        'mmiri': 'water',
        'nri': 'food'
    }
};

// Translation endpoint
router.post('/', async (req, res) => {
    try {
        const { text, from, to } = req.body;

        if (!text || !from || !to) {
            return res.status(400).json({
                error: 'Missing required fields: text, from, to'
            });
        }

        // Check custom translations first (exact matches)
        const customKey = `${from}_to_${to}`;
        if (CUSTOM_TRANSLATIONS[customKey]) {
            const customTranslation = CUSTOM_TRANSLATIONS[customKey][text.toLowerCase()];
            if (customTranslation) {
                return res.json({
                    translatedText: customTranslation,
                    sourceLanguage: from,
                    targetLanguage: to,
                    confidence: 0.95,
                    method: 'custom_dictionary'
                });
            }
        }
        
        // Try enhanced translation functions for English pairs
        if (from === 'english') {
            const enhancedTranslation = translateFromEnglish(text, to);
            if (enhancedTranslation !== text) {
                return res.json({
                    translatedText: enhancedTranslation,
                    sourceLanguage: from,
                    targetLanguage: to,
                    confidence: 0.85,
                    method: 'enhanced_dictionary'
                });
            }
        }
        
        if (to === 'english') {
            const enhancedTranslation = translateToEnglish(text, from);
            if (enhancedTranslation !== text) {
                return res.json({
                    translatedText: enhancedTranslation,
                    sourceLanguage: from,
                    targetLanguage: to,
                    confidence: 0.85,
                    method: 'enhanced_dictionary'
                });
            }
        }

        // Try multiple translation services
        let translatedText = text;
        let confidence = 0.5;
        let method = 'fallback';
        
        try {
            // Try Google Translate API (if available)
            if (process.env.GOOGLE_TRANSLATE_API_KEY) {
                const googleResponse = await translateWithGoogle(text, from, to);
                if (googleResponse) {
                    translatedText = googleResponse.text;
                    confidence = googleResponse.confidence || 0.8;
                    method = 'google_translate';
                }
            }
        } catch (error) {
            // Silently fall back to custom translation
        }

        // If no translation service available, provide basic word-by-word translation
        if (method === 'fallback') {
            translatedText = await basicTranslation(text, from, to);
            confidence = translatedText !== text ? 0.8 : 0.3; // Higher confidence if translation occurred
        }

        res.json({
            translatedText,
            sourceLanguage: from,
            targetLanguage: to,
            confidence,
            method,
            originalText: text
        });

    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({
            error: 'Translation failed',
            message: error.message
        });
    }
});

// Basic word-by-word translation using custom dictionary
async function basicTranslation(text, from, to) {
    const words = text.toLowerCase().split(' ');
    const customKey = `${from}_to_${to}`;
    
    // If translating to/from English, provide basic translations
    if (to === 'english') {
        return translateToEnglish(text, from);
    }
    
    if (from === 'english') {
        return translateFromEnglish(text, to);
    }
    
    if (!CUSTOM_TRANSLATIONS[customKey]) {
        // Try reverse translation if direct translation not available
        const reverseKey = `${to}_to_${from}`;
        if (CUSTOM_TRANSLATIONS[reverseKey]) {
            // Find reverse matches
            const reverseDict = CUSTOM_TRANSLATIONS[reverseKey];
            const translatedWords = words.map(word => {
                // Find the key that has this word as value
                for (const [key, value] of Object.entries(reverseDict)) {
                    if (value === word) {
                        return key;
                    }
                }
                return word;
            });
            return translatedWords.join(' ');
        }
        return text; // Return original if no translation available
    }

    const translatedWords = words.map(word => {
        return CUSTOM_TRANSLATIONS[customKey][word] || word;
    });

    return translatedWords.join(' ');
}

// Translate to English from African languages
function translateToEnglish(text, from) {
    // Use the main CUSTOM_TRANSLATIONS dictionary
    const translationKey = `${from}_to_english`;
    const dict = CUSTOM_TRANSLATIONS[translationKey];
    
    if (!dict) {
        // Fallback to original method for languages not in main dictionary
        const englishTranslations = {
            'twi': {
                'akwaaba': 'welcome',
                'medaase': 'thank you',
                'aane': 'yes',
                'daabi': 'no',
                'wo ho te sen': 'how are you',
                'ɛyɛ': 'good',
                'mepaakyɛw': 'please',
                'nante yiye': 'goodbye'
            },
            'yoruba': {
                'kaabo': 'welcome',
                'e se': 'thank you',
                'beni': 'yes',
                'rara': 'no',
                'bawo ni': 'how are you',
                'o dara': 'good',
                'je ka lo': 'please',
                'o dabo': 'goodbye'
            },
            'hausa': {
                'sannu': 'hello',
                'na gode': 'thank you',
                'eh': 'yes',
                'a\'a': 'no',
                'yaya kake': 'how are you',
                'yana da kyau': 'good',
                'don allah': 'please',
                'sai an jima': 'goodbye'
            },
            'igbo': {
                'ndewo': 'hello',
                'dalu': 'thank you',
                'ee': 'yes',
                'mba': 'no',
                'kedu ka i mere': 'how are you',
                'o di mma': 'good',
                'biko': 'please',
                'ka o di': 'goodbye'
            }
        };
        
        const fallbackDict = englishTranslations[from] || {};
        const words = text.toLowerCase().split(' ');
        
        const translatedWords = words.map(word => {
            return fallbackDict[word] || word;
        });
        
        return translatedWords.join(' ');
    }
    
    const lowerText = text.toLowerCase();
    
    // Check for exact phrase matches first
    for (const [original, translation] of Object.entries(dict)) {
        if (lowerText.includes(original)) {
            return lowerText.replace(original, translation);
        }
    }
    
    // Word by word translation
    const words = lowerText.split(' ');
    const translatedWords = words.map(word => {
        return dict[word] || word;
    });
    
    return translatedWords.join(' ');
}

// Translate from English to African languages
function translateFromEnglish(text, to) {
    // Use the main CUSTOM_TRANSLATIONS dictionary
    const translationKey = `english_to_${to}`;
    const dict = CUSTOM_TRANSLATIONS[translationKey];
    
    if (!dict) {
        // Fallback to original method for languages not in main dictionary
        const fromEnglishTranslations = {
            'twi': {
                'welcome': 'akwaaba',
                'hello': 'akwaaba',
                'thank you': 'medaase',
                'yes': 'aane',
                'no': 'daabi',
                'how are you': 'wo ho te sen',
                'good': 'ɛyɛ',
                'please': 'mepaakyɛw',
                'goodbye': 'nante yiye'
            },
            'yoruba': {
                'welcome': 'kaabo',
                'hello': 'kaabo',
                'thank you': 'e se',
                'yes': 'beni',
                'no': 'rara',
                'how are you': 'bawo ni',
                'good': 'o dara',
                'please': 'je ka lo',
                'goodbye': 'o dabo'
            },
            'hausa': {
                'welcome': 'sannu',
                'hello': 'sannu',
                'thank you': 'na gode',
                'yes': 'eh',
                'no': 'a\'a',
                'how are you': 'yaya kake',
                'good': 'yana da kyau',
                'please': 'don allah',
                'goodbye': 'sai an jima'
            },
            'igbo': {
                'welcome': 'ndewo',
                'hello': 'ndewo',
                'thank you': 'dalu',
                'yes': 'ee',
                'no': 'mba',
                'how are you': 'kedu ka i mere',
                'good': 'o di mma',
                'please': 'biko',
                'goodbye': 'ka o di'
            }
        };
        
        const fallbackDict = fromEnglishTranslations[to] || {};
        const lowerText = text.toLowerCase();
        
        // Check for exact phrase matches first
        for (const [english, translation] of Object.entries(fallbackDict)) {
            if (lowerText.includes(english)) {
                return lowerText.replace(english, translation);
            }
        }
        
        // Word by word translation
        const words = lowerText.split(' ');
        const translatedWords = words.map(word => {
            return fallbackDict[word] || word;
        });
        
        return translatedWords.join(' ');
    }
    
    const lowerText = text.toLowerCase();
    
    // Check for exact phrase matches first (longest phrases first)
    const sortedPhrases = Object.entries(dict).sort((a, b) => b[0].length - a[0].length);
    for (const [english, translation] of sortedPhrases) {
        if (lowerText.includes(english)) {
            return lowerText.replace(new RegExp(english, 'gi'), translation);
        }
    }
    
    // Word by word translation
    const words = lowerText.split(' ');
    const translatedWords = words.map(word => {
        return dict[word] || word;
    });
    
    return translatedWords.join(' ');
}

// Google Translate integration (if API key is provided)
async function translateWithGoogle(text, from, to) {
    if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
        return null;
    }

    try {
        const response = await axios.post(
            `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
            {
                q: text,
                source: LANGUAGE_CODES[from] || from,
                target: LANGUAGE_CODES[to] || to,
                format: 'text'
            }
        );

        return {
            text: response.data.data.translations[0].translatedText,
            confidence: 0.9
        };
    } catch (error) {
        console.error('Google Translate error:', error);
        return null;
    }
}

// Language detection endpoint
router.post('/detect', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                error: 'Text is required for language detection'
            });
        }

        // Simple language detection based on common words
        const detectedLanguage = detectLanguage(text);

        res.json({
            detectedLanguage,
            confidence: 0.7,
            text
        });

    } catch (error) {
        console.error('Language detection error:', error);
        res.status(500).json({
            error: 'Language detection failed',
            message: error.message
        });
    }
});

// Simple language detection
function detectLanguage(text) {
    const lowerText = text.toLowerCase();
    
    // Twi/Akan detection
    const twiWords = ['akwaaba', 'medaase', 'aane', 'daabi', 'ɛyɛ', 'wo ho te sen'];
    if (twiWords.some(word => lowerText.includes(word))) {
        return 'twi';
    }
    
    // Yoruba detection
    const yorubaWords = ['kaabo', 'e se', 'beni', 'rara', 'bawo ni', 'o dara'];
    if (yorubaWords.some(word => lowerText.includes(word))) {
        return 'yoruba';
    }
    
    // Hausa detection
    const hausaWords = ['sannu', 'na gode', 'eh', 'a\'a', 'yaya kake'];
    if (hausaWords.some(word => lowerText.includes(word))) {
        return 'hausa';
    }
    
    // Igbo detection
    const igboWords = ['ndewo', 'dalu', 'ee', 'mba', 'kedu ka i mere'];
    if (igboWords.some(word => lowerText.includes(word))) {
        return 'igbo';
    }
    
    // Default to English
    return 'english';
}

module.exports = router;
