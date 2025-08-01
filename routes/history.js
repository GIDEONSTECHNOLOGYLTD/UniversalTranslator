const express = require('express');
const router = express.Router();

// In-memory storage for translation history (in production, use a database)
let translationHistory = [];
let historyIdCounter = 1;

// Get translation history
router.get('/', (req, res) => {
    try {
        const { limit = 50, offset = 0, from, to } = req.query;
        
        let filteredHistory = translationHistory;
        
        // Filter by source language
        if (from) {
            filteredHistory = filteredHistory.filter(item => 
                item.sourceLanguage.toLowerCase() === from.toLowerCase()
            );
        }
        
        // Filter by target language
        if (to) {
            filteredHistory = filteredHistory.filter(item => 
                item.targetLanguage.toLowerCase() === to.toLowerCase()
            );
        }
        
        // Sort by timestamp (newest first)
        filteredHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Apply pagination
        const paginatedHistory = filteredHistory.slice(
            parseInt(offset), 
            parseInt(offset) + parseInt(limit)
        );
        
        res.json({
            history: paginatedHistory,
            total: filteredHistory.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({
            error: 'Failed to fetch translation history',
            message: error.message
        });
    }
});

// Add translation to history
router.post('/', (req, res) => {
    try {
        const { 
            originalText, 
            translatedText, 
            sourceLanguage, 
            targetLanguage, 
            confidence,
            method 
        } = req.body;
        
        if (!originalText || !translatedText || !sourceLanguage || !targetLanguage) {
            return res.status(400).json({
                error: 'Missing required fields: originalText, translatedText, sourceLanguage, targetLanguage'
            });
        }
        
        const historyItem = {
            id: historyIdCounter++,
            originalText,
            translatedText,
            sourceLanguage,
            targetLanguage,
            confidence: confidence || 0.5,
            method: method || 'unknown',
            timestamp: new Date().toISOString(),
            favorite: false
        };
        
        translationHistory.push(historyItem);
        
        // Keep only last 1000 translations to prevent memory issues
        if (translationHistory.length > 1000) {
            translationHistory = translationHistory.slice(-1000);
        }
        
        res.status(201).json({
            message: 'Translation added to history',
            item: historyItem
        });
    } catch (error) {
        console.error('Error adding to history:', error);
        res.status(500).json({
            error: 'Failed to add translation to history',
            message: error.message
        });
    }
});

// Toggle favorite status
router.patch('/:id/favorite', (req, res) => {
    try {
        const { id } = req.params;
        const historyItem = translationHistory.find(item => item.id === parseInt(id));
        
        if (!historyItem) {
            return res.status(404).json({
                error: 'Translation not found in history'
            });
        }
        
        historyItem.favorite = !historyItem.favorite;
        
        res.json({
            message: `Translation ${historyItem.favorite ? 'added to' : 'removed from'} favorites`,
            item: historyItem
        });
    } catch (error) {
        console.error('Error toggling favorite:', error);
        res.status(500).json({
            error: 'Failed to toggle favorite status',
            message: error.message
        });
    }
});

// Delete translation from history
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const index = translationHistory.findIndex(item => item.id === parseInt(id));
        
        if (index === -1) {
            return res.status(404).json({
                error: 'Translation not found in history'
            });
        }
        
        const deletedItem = translationHistory.splice(index, 1)[0];
        
        res.json({
            message: 'Translation deleted from history',
            item: deletedItem
        });
    } catch (error) {
        console.error('Error deleting from history:', error);
        res.status(500).json({
            error: 'Failed to delete translation from history',
            message: error.message
        });
    }
});

// Clear all history
router.delete('/', (req, res) => {
    try {
        const count = translationHistory.length;
        translationHistory = [];
        historyIdCounter = 1;
        
        res.json({
            message: `Cleared ${count} translations from history`
        });
    } catch (error) {
        console.error('Error clearing history:', error);
        res.status(500).json({
            error: 'Failed to clear translation history',
            message: error.message
        });
    }
});

// Get favorites only
router.get('/favorites', (req, res) => {
    try {
        const favorites = translationHistory
            .filter(item => item.favorite)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.json({
            favorites,
            total: favorites.length
        });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({
            error: 'Failed to fetch favorite translations',
            message: error.message
        });
    }
});

// Search history
router.get('/search', (req, res) => {
    try {
        const { q, limit = 20 } = req.query;
        
        if (!q) {
            return res.status(400).json({
                error: 'Search query is required'
            });
        }
        
        const searchResults = translationHistory
            .filter(item => 
                item.originalText.toLowerCase().includes(q.toLowerCase()) ||
                item.translatedText.toLowerCase().includes(q.toLowerCase())
            )
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, parseInt(limit));
        
        res.json({
            results: searchResults,
            total: searchResults.length,
            query: q
        });
    } catch (error) {
        console.error('Error searching history:', error);
        res.status(500).json({
            error: 'Failed to search translation history',
            message: error.message
        });
    }
});

// Get history statistics
router.get('/stats', (req, res) => {
    try {
        const stats = {
            totalTranslations: translationHistory.length,
            favorites: translationHistory.filter(item => item.favorite).length,
            languagePairs: [...new Set(translationHistory.map(item => 
                `${item.sourceLanguage}-${item.targetLanguage}`
            ))].length,
            mostUsedSourceLanguage: getMostUsedLanguage('sourceLanguage'),
            mostUsedTargetLanguage: getMostUsedLanguage('targetLanguage'),
            averageConfidence: translationHistory.length > 0 
                ? (translationHistory.reduce((sum, item) => sum + item.confidence, 0) / translationHistory.length).toFixed(2)
                : 0,
            translationMethods: [...new Set(translationHistory.map(item => item.method))]
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Error fetching history stats:', error);
        res.status(500).json({
            error: 'Failed to fetch history statistics',
            message: error.message
        });
    }
});

// Helper function to get most used language
function getMostUsedLanguage(type) {
    if (translationHistory.length === 0) return null;
    
    const languageCounts = {};
    translationHistory.forEach(item => {
        const lang = item[type];
        languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    });
    
    return Object.entries(languageCounts)
        .sort(([,a], [,b]) => b - a)[0][0];
}

module.exports = router;
