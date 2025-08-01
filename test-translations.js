#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Test cases to demonstrate translation capabilities
const testCases = [
    // Simple phrases (should work with custom dictionaries)
    { text: "Hello", from: "english", to: "swahili", expected: "hujambo" },
    { text: "I love you", from: "english", to: "swahili", expected: "nakupenda" },
    { text: "How are you today", from: "english", to: "swahili", expected: "habari yako leo" },
    
    // Complex sentences (will benefit from Google Translate)
    { text: "The weather is beautiful today", from: "english", to: "swahili" },
    { text: "I would like to learn more about your culture", from: "english", to: "swahili" },
    { text: "Can you help me find the nearest hospital?", from: "english", to: "yoruba" },
    
    // Reverse translations
    { text: "nakupenda", from: "swahili", to: "english", expected: "i love you" },
    { text: "habari yako", from: "swahili", to: "english", expected: "how are you" },
    
    // Other African languages
    { text: "Hello friend", from: "english", to: "zulu" },
    { text: "Thank you very much", from: "english", to: "amharic" },
    { text: "Peace be with you", from: "english", to: "luganda" }
];

async function runTests() {
    console.log('🌍 Universal Translator Test Suite');
    console.log('=====================================\n');
    
    // Check if Google Translate is configured
    const hasGoogleAPI = process.env.GOOGLE_TRANSLATE_API_KEY ? true : false;
    console.log(`📡 Google Translate API: ${hasGoogleAPI ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`📚 Custom Dictionaries: ✅ Active\n`);
    
    let passed = 0;
    let total = 0;
    
    for (const testCase of testCases) {
        total++;
        try {
            const response = await axios.post(`${API_BASE}/translate`, {
                text: testCase.text,
                from: testCase.from,
                to: testCase.to
            });
            
            const result = response.data;
            const isExpected = testCase.expected ? 
                result.translatedText.toLowerCase() === testCase.expected.toLowerCase() : 
                result.translatedText !== testCase.text;
            
            if (isExpected) passed++;
            
            console.log(`${isExpected ? '✅' : '⚠️'} "${testCase.text}" (${testCase.from} → ${testCase.to})`);
            console.log(`   → "${result.translatedText}"`);
            console.log(`   📊 Confidence: ${Math.round(result.confidence * 100)}% | Method: ${result.method}\n`);
            
        } catch (error) {
            console.log(`❌ "${testCase.text}" (${testCase.from} → ${testCase.to})`);
            console.log(`   Error: ${error.message}\n`);
        }
    }
    
    console.log('=====================================');
    console.log(`📈 Results: ${passed}/${total} tests successful`);
    
    if (!hasGoogleAPI) {
        console.log('\n💡 To improve complex sentence translations:');
        console.log('   1. Get a Google Translate API key');
        console.log('   2. Add it to your .env file');
        console.log('   3. Restart the server');
        console.log('   4. Run this test again');
        console.log('\n📖 See GOOGLE_TRANSLATE_SETUP.md for detailed instructions');
    }
}

// Run tests if called directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };
