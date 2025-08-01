// Translation Analytics and Improvement Suggestions
class TranslationAnalytics {
    constructor() {
        this.stats = JSON.parse(localStorage.getItem('translationStats')) || {
            totalTranslations: 0,
            languagePairs: {},
            commonPhrases: {},
            userFeedback: {},
            accuracy: {}
        };
    }
    
    recordTranslation(from, to, originalText, translatedText, confidence) {
        this.stats.totalTranslations++;
        
        const pair = `${from}_to_${to}`;
        this.stats.languagePairs[pair] = (this.stats.languagePairs[pair] || 0) + 1;
        
        // Track common phrases
        const phrase = originalText.toLowerCase().trim();
        this.stats.commonPhrases[phrase] = (this.stats.commonPhrases[phrase] || 0) + 1;
        
        // Track accuracy by language pair
        if (!this.stats.accuracy[pair]) {
            this.stats.accuracy[pair] = { total: 0, sum: 0 };
        }
        this.stats.accuracy[pair].total++;
        this.stats.accuracy[pair].sum += confidence;
        
        this.saveStats();
        this.updateInsights();
    }
    
    recordFeedback(translationId, rating, suggestion) {
        this.stats.userFeedback[translationId] = {
            rating,
            suggestion,
            timestamp: Date.now()
        };
        this.saveStats();
    }
    
    getInsights() {
        const insights = [];
        
        // Most used language pairs
        const topPairs = Object.entries(this.stats.languagePairs)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
        
        if (topPairs.length > 0) {
            insights.push({
                type: 'usage',
                title: 'Your Most Used Translation',
                content: `${topPairs[0][0].replace('_to_', ' → ')} (${topPairs[0][1]} times)`
            });
        }
        
        // Accuracy insights
        const lowAccuracyPairs = Object.entries(this.stats.accuracy)
            .map(([pair, data]) => ({
                pair,
                accuracy: data.sum / data.total
            }))
            .filter(item => item.accuracy < 0.7)
            .sort((a, b) => a.accuracy - b.accuracy);
        
        if (lowAccuracyPairs.length > 0) {
            insights.push({
                type: 'improvement',
                title: 'Translation Accuracy Alert',
                content: `${lowAccuracyPairs[0].pair.replace('_to_', ' → ')} has low accuracy (${Math.round(lowAccuracyPairs[0].accuracy * 100)}%). Consider using alternative phrases.`
            });
        }
        
        // Common phrases suggestion
        const topPhrases = Object.entries(this.stats.commonPhrases)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
        
        if (topPhrases.length > 0) {
            insights.push({
                type: 'suggestion',
                title: 'Quick Phrase Suggestion',
                content: `You often translate "${topPhrases[0][0]}". Consider adding it to quick phrases!`
            });
        }
        
        return insights;
    }
    
    updateInsights() {
        const insightsContainer = document.getElementById('insights-container');
        if (!insightsContainer) return;
        
        const insights = this.getInsights();
        insightsContainer.innerHTML = insights.map(insight => `
            <div class="insight-card ${insight.type}">
                <h4>${insight.title}</h4>
                <p>${insight.content}</p>
            </div>
        `).join('');
    }
    
    saveStats() {
        localStorage.setItem('translationStats', JSON.stringify(this.stats));
    }
    
    exportData() {
        const data = {
            stats: this.stats,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'translation-data.json';
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Global analytics instance
window.translationAnalytics = new TranslationAnalytics();
