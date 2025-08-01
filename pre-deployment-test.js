#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function runPreDeploymentTests() {
    console.log('🧪 Pre-Deployment Test Suite');
    console.log('============================');
    console.log(`Testing: ${BASE_URL}\n`);
    
    let passed = 0;
    let total = 0;
    
    const tests = [
        {
            name: 'Health Check',
            test: async () => {
                const response = await axios.get(`${BASE_URL}/health`);
                return response.status === 200 && response.data.status === 'healthy';
            }
        },
        {
            name: 'Homepage Load',
            test: async () => {
                const response = await axios.get(`${BASE_URL}/`);
                return response.status === 200 && response.data.includes('Universal Translator');
            }
        },
        {
            name: 'Languages API',
            test: async () => {
                const response = await axios.get(`${BASE_URL}/api/languages`);
                // Check if response has the expected structure
                return response.status === 200 && 
                       response.data && 
                       (Array.isArray(response.data) ? response.data.length >= 69 : 
                        Object.keys(response.data).length > 0);
            }
        },
        {
            name: 'Language Stats API',
            test: async () => {
                const response = await axios.get(`${BASE_URL}/api/languages/stats`);
                return response.status === 200 && response.data.totalLanguages >= 69;
            }
        },
        {
            name: 'Basic Translation (Swahili)',
            test: async () => {
                const response = await axios.post(`${BASE_URL}/api/translate`, {
                    text: 'hello',
                    from: 'english',
                    to: 'swahili'
                });
                return response.status === 200 && 
                       response.data.translatedText === 'hujambo' &&
                       response.data.confidence >= 0.9;
            }
        },
        {
            name: 'Phrase Translation (Swahili)',
            test: async () => {
                const response = await axios.post(`${BASE_URL}/api/translate`, {
                    text: 'I love you',
                    from: 'english',
                    to: 'swahili'
                });
                return response.status === 200 && 
                       response.data.translatedText === 'nakupenda' &&
                       response.data.method === 'custom_dictionary';
            }
        },
        {
            name: 'Reverse Translation (Swahili to English)',
            test: async () => {
                const response = await axios.post(`${BASE_URL}/api/translate`, {
                    text: 'hujambo',
                    from: 'swahili',
                    to: 'english'
                });
                return response.status === 200 && 
                       response.data.translatedText === 'hello';
            }
        },
        {
            name: 'Other African Language (Zulu)',
            test: async () => {
                const response = await axios.post(`${BASE_URL}/api/translate`, {
                    text: 'hello',
                    from: 'english',
                    to: 'zulu'
                });
                return response.status === 200 && 
                       response.data.translatedText === 'sawubona';
            }
        },
        {
            name: 'New Language (Luganda)',
            test: async () => {
                const response = await axios.post(`${BASE_URL}/api/translate`, {
                    text: 'hello',
                    from: 'english',
                    to: 'luganda'
                });
                return response.status === 200 && 
                       response.data.translatedText === 'ki kati';
            }
        },
        {
            name: 'Error Handling (Invalid Language)',
            test: async () => {
                try {
                    const response = await axios.post(`${BASE_URL}/api/translate`, {
                        text: 'hello',
                        from: 'english',
                        to: 'invalid_language'
                    });
                    // Should still return something, not crash
                    return response.status === 200;
                } catch (error) {
                    return error.response && error.response.status < 500;
                }
            }
        }
    ];
    
    for (const testCase of tests) {
        total++;
        try {
            const result = await testCase.test();
            if (result) {
                console.log(`✅ ${testCase.name}`);
                passed++;
            } else {
                console.log(`❌ ${testCase.name} - Test failed`);
            }
        } catch (error) {
            console.log(`❌ ${testCase.name} - Error: ${error.message}`);
        }
    }
    
    console.log('\n============================');
    console.log(`📊 Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All tests passed! Ready for deployment!');
        console.log('\n🚀 Next steps:');
        console.log('1. Commit all changes to Git');
        console.log('2. Push to GitHub');
        console.log('3. Deploy to Render using render.yaml');
        console.log('4. Run this test again with deployed URL');
        return true;
    } else {
        console.log('⚠️  Some tests failed. Please fix issues before deployment.');
        return false;
    }
}

// Run tests if called directly
if (require.main === module) {
    runPreDeploymentTests()
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
            console.error('Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = { runPreDeploymentTests };
