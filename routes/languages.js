const express = require('express');
const router = express.Router();

// Comprehensive language list with focus on African languages
const SUPPORTED_LANGUAGES = [
    // West African Languages
    { code: 'twi', name: 'Twi (Akan)', nativeName: 'Twi', region: 'Ghana', family: 'Niger-Congo' },
    { code: 'yoruba', name: 'Yoruba', nativeName: 'Yorùbá', region: 'Nigeria', family: 'Niger-Congo' },
    { code: 'hausa', name: 'Hausa', nativeName: 'Harshen Hausa', region: 'Nigeria/Niger', family: 'Afro-Asiatic' },
    { code: 'igbo', name: 'Igbo', nativeName: 'Asụsụ Igbo', region: 'Nigeria', family: 'Niger-Congo' },
    { code: 'fulani', name: 'Fulani (Fulfulde)', nativeName: 'Fulfulde', region: 'West Africa', family: 'Niger-Congo' },
    { code: 'wolof', name: 'Wolof', nativeName: 'Wolof', region: 'Senegal', family: 'Niger-Congo' },
    { code: 'mandinka', name: 'Mandinka', nativeName: 'Mandinka', region: 'Gambia/Mali', family: 'Niger-Congo' },
    { code: 'ewe', name: 'Ewe', nativeName: 'Eʋegbe', region: 'Ghana/Togo', family: 'Niger-Congo' },
    { code: 'ga', name: 'Ga', nativeName: 'Gã', region: 'Ghana', family: 'Niger-Congo' },
    { code: 'dagbani', name: 'Dagbani', nativeName: 'Dagbanli', region: 'Ghana', family: 'Niger-Congo' },
    
    // Nigerian Languages
    { code: 'edo', name: 'Edo (Bini)', nativeName: 'Ẹ̀dó', region: 'Nigeria', family: 'Niger-Congo' },
    { code: 'efik', name: 'Efik', nativeName: 'Efik', region: 'Nigeria', family: 'Niger-Congo' },
    { code: 'tiv', name: 'Tiv', nativeName: 'Tiv', region: 'Nigeria', family: 'Niger-Congo' },
    { code: 'kanuri', name: 'Kanuri', nativeName: 'Kanuri', region: 'Nigeria', family: 'Nilo-Saharan' },
    { code: 'ibibio', name: 'Ibibio', nativeName: 'Ibibio', region: 'Nigeria', family: 'Niger-Congo' },
    { code: 'ijaw', name: 'Ijaw', nativeName: 'Ijaw', region: 'Nigeria', family: 'Niger-Congo' },
    
    // East African Languages
    { code: 'swahili', name: 'Swahili', nativeName: 'Kiswahili', region: 'East Africa', family: 'Niger-Congo' },
    { code: 'amharic', name: 'Amharic', nativeName: 'አማርኛ', region: 'Ethiopia', family: 'Afro-Asiatic' },
    { code: 'oromo', name: 'Oromo', nativeName: 'Afaan Oromoo', region: 'Ethiopia', family: 'Afro-Asiatic' },
    { code: 'tigrinya', name: 'Tigrinya', nativeName: 'ትግርኛ', region: 'Ethiopia/Eritrea', family: 'Afro-Asiatic' },
    { code: 'kikuyu', name: 'Kikuyu', nativeName: 'Gĩkũyũ', region: 'Kenya', family: 'Niger-Congo' },
    { code: 'luo', name: 'Luo', nativeName: 'Dholuo', region: 'Kenya', family: 'Nilo-Saharan' },
    { code: 'luganda', name: 'Luganda', nativeName: 'Luganda', region: 'Uganda', family: 'Niger-Congo' },
    { code: 'kinyarwanda', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', region: 'Rwanda', family: 'Niger-Congo' },
    { code: 'kirundi', name: 'Kirundi', nativeName: 'Ikirundi', region: 'Burundi', family: 'Niger-Congo' },
    { code: 'somali', name: 'Somali', nativeName: 'Af-Soomaali', region: 'Somalia', family: 'Afro-Asiatic' },
    { code: 'maasai', name: 'Maasai', nativeName: 'ɔl Maa', region: 'Kenya/Tanzania', family: 'Nilo-Saharan' },
    
    // Southern African Languages
    { code: 'zulu', name: 'Zulu', nativeName: 'isiZulu', region: 'South Africa', family: 'Niger-Congo' },
    { code: 'xhosa', name: 'Xhosa', nativeName: 'isiXhosa', region: 'South Africa', family: 'Niger-Congo' },
    { code: 'afrikaans', name: 'Afrikaans', nativeName: 'Afrikaans', region: 'South Africa', family: 'Indo-European' },
    { code: 'sotho', name: 'Sotho', nativeName: 'Sesotho', region: 'South Africa', family: 'Niger-Congo' },
    { code: 'tswana', name: 'Tswana', nativeName: 'Setswana', region: 'Botswana', family: 'Niger-Congo' },
    { code: 'shona', name: 'Shona', nativeName: 'chiShona', region: 'Zimbabwe', family: 'Niger-Congo' },
    { code: 'ndebele', name: 'Ndebele', nativeName: 'isiNdebele', region: 'Zimbabwe', family: 'Niger-Congo' },
    { code: 'venda', name: 'Venda', nativeName: 'Tshivenda', region: 'South Africa', family: 'Niger-Congo' },
    { code: 'tsonga', name: 'Tsonga', nativeName: 'Xitsonga', region: 'South Africa', family: 'Niger-Congo' },
    { code: 'swati', name: 'Swati', nativeName: 'siSwati', region: 'Eswatini', family: 'Niger-Congo' },
    { code: 'chewa', name: 'Chewa', nativeName: 'Chichewa', region: 'Malawi', family: 'Niger-Congo' },
    { code: 'bemba', name: 'Bemba', nativeName: 'Ichibemba', region: 'Zambia', family: 'Niger-Congo' },
    
    // Central African Languages
    { code: 'lingala', name: 'Lingala', nativeName: 'Lingála', region: 'Congo', family: 'Niger-Congo' },
    { code: 'sango', name: 'Sango', nativeName: 'Sängö', region: 'Central African Republic', family: 'Niger-Congo' },
    { code: 'fang', name: 'Fang', nativeName: 'Fang', region: 'Equatorial Guinea', family: 'Niger-Congo' },
    { code: 'kikongo', name: 'Kikongo', nativeName: 'Kikongo', region: 'Angola/Congo', family: 'Niger-Congo' },
    
    // Additional West African Languages
    { code: 'bambara', name: 'Bambara', nativeName: 'Bamanankan', region: 'Mali', family: 'Niger-Congo' },
    { code: 'moore', name: 'Mooré', nativeName: 'Mooré', region: 'Burkina Faso', family: 'Niger-Congo' },
    { code: 'dioula', name: 'Dioula', nativeName: 'Dioula', region: 'Côte d\'Ivoire', family: 'Niger-Congo' },
    { code: 'fon', name: 'Fon', nativeName: 'Fon', region: 'Benin', family: 'Niger-Congo' },
    { code: 'temne', name: 'Temne', nativeName: 'Temne', region: 'Sierra Leone', family: 'Niger-Congo' },
    { code: 'krio', name: 'Krio', nativeName: 'Krio', region: 'Sierra Leone', family: 'Indo-European' },
    { code: 'mende', name: 'Mende', nativeName: 'Mende', region: 'Sierra Leone', family: 'Niger-Congo' },
    { code: 'susu', name: 'Susu', nativeName: 'Susu', region: 'Guinea', family: 'Niger-Congo' },
    
    // North African Languages
    { code: 'arabic', name: 'Arabic', nativeName: 'العربية', region: 'North Africa', family: 'Afro-Asiatic' },
    { code: 'berber', name: 'Berber (Tamazight)', nativeName: 'Tamaziɣt', region: 'North Africa', family: 'Afro-Asiatic' },
    
    // Major International Languages
    { code: 'english', name: 'English', nativeName: 'English', region: 'Global', family: 'Indo-European' },
    { code: 'french', name: 'French', nativeName: 'Français', region: 'Global', family: 'Indo-European' },
    { code: 'spanish', name: 'Spanish', nativeName: 'Español', region: 'Global', family: 'Indo-European' },
    { code: 'portuguese', name: 'Portuguese', nativeName: 'Português', region: 'Global', family: 'Indo-European' },
    { code: 'german', name: 'German', nativeName: 'Deutsch', region: 'Europe', family: 'Indo-European' },
    { code: 'italian', name: 'Italian', nativeName: 'Italiano', region: 'Europe', family: 'Indo-European' },
    { code: 'russian', name: 'Russian', nativeName: 'Русский', region: 'Europe/Asia', family: 'Indo-European' },
    { code: 'mandarin', name: 'Mandarin Chinese', nativeName: '中文', region: 'China', family: 'Sino-Tibetan' },
    { code: 'japanese', name: 'Japanese', nativeName: '日本語', region: 'Japan', family: 'Japonic' },
    { code: 'korean', name: 'Korean', nativeName: '한국어', region: 'Korea', family: 'Koreanic' },
    { code: 'hindi', name: 'Hindi', nativeName: 'हिन्दी', region: 'India', family: 'Indo-European' },
    { code: 'urdu', name: 'Urdu', nativeName: 'اردو', region: 'Pakistan', family: 'Indo-European' },
    { code: 'bengali', name: 'Bengali', nativeName: 'বাংলা', region: 'Bangladesh', family: 'Indo-European' },
    { code: 'turkish', name: 'Turkish', nativeName: 'Türkçe', region: 'Turkey', family: 'Turkic' },
    { code: 'persian', name: 'Persian', nativeName: 'فارسی', region: 'Iran', family: 'Indo-European' },
    { code: 'hebrew', name: 'Hebrew', nativeName: 'עברית', region: 'Israel', family: 'Afro-Asiatic' }
];

// Get all supported languages
router.get('/', (req, res) => {
    try {
        const { region, family } = req.query;
        
        let filteredLanguages = SUPPORTED_LANGUAGES;
        
        if (region) {
            filteredLanguages = filteredLanguages.filter(lang => 
                lang.region.toLowerCase().includes(region.toLowerCase())
            );
        }
        
        if (family) {
            filteredLanguages = filteredLanguages.filter(lang => 
                lang.family.toLowerCase().includes(family.toLowerCase())
            );
        }
        
        res.json({
            languages: filteredLanguages,
            total: filteredLanguages.length,
            regions: [...new Set(SUPPORTED_LANGUAGES.map(lang => lang.region))],
            families: [...new Set(SUPPORTED_LANGUAGES.map(lang => lang.family))]
        });
    } catch (error) {
        console.error('Error fetching languages:', error);
        res.status(500).json({
            error: 'Failed to fetch languages',
            message: error.message
        });
    }
});

// Get popular language pairs
router.get('/popular-pairs', (req, res) => {
    try {
        const popularPairs = [
            { from: 'twi', to: 'yoruba', usage: 'high' },
            { from: 'yoruba', to: 'twi', usage: 'high' },
            { from: 'twi', to: 'english', usage: 'very_high' },
            { from: 'yoruba', to: 'english', usage: 'very_high' },
            { from: 'hausa', to: 'english', usage: 'high' },
            { from: 'igbo', to: 'english', usage: 'high' },
            { from: 'english', to: 'twi', usage: 'high' },
            { from: 'english', to: 'yoruba', usage: 'high' },
            { from: 'english', to: 'hausa', usage: 'medium' },
            { from: 'english', to: 'igbo', usage: 'medium' },
            { from: 'french', to: 'wolof', usage: 'medium' },
            { from: 'arabic', to: 'hausa', usage: 'medium' },
            { from: 'swahili', to: 'english', usage: 'high' },
            { from: 'amharic', to: 'english', usage: 'medium' }
        ];
        
        res.json({
            popularPairs,
            total: popularPairs.length
        });
    } catch (error) {
        console.error('Error fetching popular pairs:', error);
        res.status(500).json({
            error: 'Failed to fetch popular pairs',
            message: error.message
        });
    }
});

// Get language statistics
router.get('/stats', (req, res) => {
    try {
        const stats = {
            totalLanguages: SUPPORTED_LANGUAGES.length,
            africanLanguages: SUPPORTED_LANGUAGES.filter(lang => 
                ['West Africa', 'East Africa', 'South Africa', 'North Africa', 'Ghana', 'Nigeria', 'Senegal', 'Kenya', 'Ethiopia', 'Botswana', 'Zimbabwe'].some(region => 
                    lang.region.includes(region)
                )
            ).length,
            languageFamilies: [...new Set(SUPPORTED_LANGUAGES.map(lang => lang.family))].length,
            regions: [...new Set(SUPPORTED_LANGUAGES.map(lang => lang.region))].length,
            nigerianLanguages: SUPPORTED_LANGUAGES.filter(lang => lang.region.includes('Nigeria')).length,
            ghanaianLanguages: SUPPORTED_LANGUAGES.filter(lang => lang.region.includes('Ghana')).length
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Error fetching language stats:', error);
        res.status(500).json({
            error: 'Failed to fetch language statistics',
            message: error.message
        });
    }
});

// Get language by code
router.get('/:code', (req, res) => {
    try {
        const { code } = req.params;
        const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code.toLowerCase());
        
        if (!language) {
            return res.status(404).json({
                error: 'Language not found',
                code
            });
        }
        
        res.json(language);
    } catch (error) {
        console.error('Error fetching language:', error);
        res.status(500).json({
            error: 'Failed to fetch language',
            message: error.message
        });
    }
});

module.exports = router;
