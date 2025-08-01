// Universal Translator App
class UniversalTranslator {
    constructor() {
        this.currentTab = 'translator';
        this.translationHistory = [];
        this.languages = [];
        this.isTranslating = false;
        this.speechRecognition = null;
        this.speechSynthesis = window.speechSynthesis;
        
        this.init();
    }
    
    init() {
        this.showInitialLoading();
        this.setupEventListeners();
        this.loadLanguages();
        this.loadQuickPhrases();
        this.setupSpeechRecognition();
        this.loadHistory();
        this.hideInitialLoading();
    }
    
    showInitialLoading() {
        document.body.style.overflow = 'hidden';
        const loadingHtml = `
            <div id="initial-loading" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                color: white;
                flex-direction: column;
                gap: 1rem;
            ">
                <div style="font-size: 3rem;">🌍</div>
                <div style="font-size: 1.5rem; font-weight: 600;">Universal Translator</div>
                <div class="typing-indicator"><span style="background: white;"></span><span style="background: white;"></span><span style="background: white;"></span></div>
                <div style="font-size: 0.875rem; opacity: 0.8;">Loading languages...</div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', loadingHtml);
    }
    
    hideInitialLoading() {
        setTimeout(() => {
            const loading = document.getElementById('initial-loading');
            if (loading) {
                loading.style.opacity = '0';
                loading.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    loading.remove();
                    document.body.style.overflow = 'auto';
                    // Show ready message
                    this.showToast('🌍 Universal Translator ready!', 'success');
                }, 500);
            }
        }, 1500);
    }
    
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Translation interface
        document.getElementById('input-text').addEventListener('input', this.debounce(this.handleInputChange.bind(this), 500));
        document.getElementById('swap-languages').addEventListener('click', this.swapLanguages.bind(this));
        document.getElementById('clear-input').addEventListener('click', this.clearInput.bind(this));
        document.getElementById('voice-input').addEventListener('click', this.toggleVoiceInput.bind(this));
        document.getElementById('speak-output').addEventListener('click', this.speakOutput.bind(this));
        document.getElementById('copy-output').addEventListener('click', this.copyOutput.bind(this));
        document.getElementById('save-translation').addEventListener('click', this.saveTranslation.bind(this));
        
        // Language change listeners
        document.getElementById('source-lang').addEventListener('change', this.loadQuickPhrases.bind(this));
        document.getElementById('target-lang').addEventListener('change', this.loadQuickPhrases.bind(this));
        
        // History
        document.getElementById('clear-history').addEventListener('click', this.clearHistory.bind(this));
        document.getElementById('history-search').addEventListener('input', this.debounce(this.searchHistory.bind(this), 300));
        
        // Language filters
        document.getElementById('region-filter').addEventListener('change', this.filterLanguages.bind(this));
        document.getElementById('family-filter').addEventListener('change', this.filterLanguages.bind(this));
        
        // Character count
        document.getElementById('input-text').addEventListener('input', this.updateCharCount.bind(this));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
        
        // Focus management
        document.getElementById('input-text').focus();
    }
    
    switchTab(tabName) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
        
        this.currentTab = tabName;
        
        // Load tab-specific content
        if (tabName === 'history') {
            this.loadHistory();
        } else if (tabName === 'languages') {
            this.loadLanguageStats();
        }
    }
    
    async handleInputChange() {
        const inputText = document.getElementById('input-text').value.trim();
        
        if (!inputText) {
            document.getElementById('output-text').textContent = 'Translation will appear here...';
            document.getElementById('confidence-badge').textContent = '';
            document.getElementById('detected-lang').textContent = '';
            return;
        }
        
        // Show typing indicator with animation
        const outputElement = document.getElementById('output-text');
        outputElement.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        
        try {
            // Auto-detect language if set to auto
            const sourceLang = document.getElementById('source-lang').value;
            if (sourceLang === 'auto') {
                await this.detectLanguage(inputText);
            }
            
            // Translate
            await this.translateText(inputText);
        } catch (error) {
            console.error('Translation error:', error);
            document.getElementById('output-text').textContent = 'Translation failed. Please try again.';
            this.showToast('Translation failed', 'error');
        }
    }
    
    async detectLanguage(text) {
        try {
            const response = await fetch('/api/translate/detect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });
            
            const data = await response.json();
            
            if (data.detectedLanguage) {
                document.getElementById('detected-lang').textContent = `Detected: ${this.getLanguageName(data.detectedLanguage)}`;
                // Update source language select
                document.getElementById('source-lang').value = data.detectedLanguage;
            }
        } catch (error) {
            console.error('Language detection failed:', error);
        }
    }
    
    async translateText(text) {
        if (this.isTranslating) return;
        
        this.isTranslating = true;
        
        try {
            const sourceLang = document.getElementById('source-lang').value;
            const targetLang = document.getElementById('target-lang').value;
            
            // Handle same language case
            if (sourceLang === targetLang && sourceLang !== 'auto') {
                document.getElementById('output-text').textContent = text;
                this.updateConfidenceBadge(1.0);
                return;
            }
            
            // Check offline cache first
            if (window.offlineCache) {
                const cached = window.offlineCache.getCachedTranslation(text, sourceLang === 'auto' ? 'english' : sourceLang, targetLang);
                if (cached) {
                    document.getElementById('output-text').textContent = cached.translatedText;
                    this.updateConfidenceBadge(cached.confidence);
                    this.addToHistory(cached);
                    this.showToast('💾 Used cached translation', 'info');
                    return;
                }
            }
            
            console.log('Translating:', { text, from: sourceLang, to: targetLang });
            
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    from: sourceLang === 'auto' ? 'english' : sourceLang,
                    to: targetLang
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Translation response:', data);
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            if (data.translatedText) {
                document.getElementById('output-text').textContent = data.translatedText;
                this.updateConfidenceBadge(data.confidence || 0.5);
                
                // Cache the translation for offline use
                if (window.offlineCache) {
                    window.offlineCache.cacheTranslation(
                        text,
                        data.sourceLanguage || sourceLang,
                        data.targetLanguage || targetLang,
                        data.translatedText,
                        data.confidence || 0.5,
                        data.method || 'unknown'
                    );
                }
                
                // Auto-save to history
                this.addToHistory({
                    originalText: text,
                    translatedText: data.translatedText,
                    sourceLanguage: data.sourceLanguage || sourceLang,
                    targetLanguage: data.targetLanguage || targetLang,
                    confidence: data.confidence || 0.5,
                    method: data.method || 'unknown'
                });
            } else {
                throw new Error('No translation received');
            }
        } catch (error) {
            console.error('Translation error:', error);
            document.getElementById('output-text').textContent = `Translation failed: ${error.message}`;
            this.showToast(`Translation failed: ${error.message}`, 'error');
        } finally {
            this.isTranslating = false;
        }
    }
    
    updateConfidenceBadge(confidence) {
        const badge = document.getElementById('confidence-badge');
        const percentage = Math.round(confidence * 100);
        
        badge.textContent = `${percentage}% confidence`;
        badge.className = 'confidence-badge';
        
        if (confidence >= 0.8) {
            badge.classList.add('confidence-high');
        } else if (confidence >= 0.6) {
            badge.classList.add('confidence-medium');
        } else {
            badge.classList.add('confidence-low');
        }
    }
    
    swapLanguages() {
        const sourceLang = document.getElementById('source-lang');
        const targetLang = document.getElementById('target-lang');
        
        if (sourceLang.value === 'auto') {
            this.showToast('Cannot swap with auto-detect', 'info');
            return;
        }
        
        const temp = sourceLang.value;
        sourceLang.value = targetLang.value;
        targetLang.value = temp;
        
        // Swap text content too
        const inputText = document.getElementById('input-text').value;
        const outputText = document.getElementById('output-text').textContent;
        
        if (outputText && outputText !== 'Translation will appear here...') {
            document.getElementById('input-text').value = outputText;
            document.getElementById('output-text').textContent = inputText;
        }
        
        this.updateCharCount();
    }
    
    clearInput() {
        document.getElementById('input-text').value = '';
        document.getElementById('output-text').textContent = 'Translation will appear here...';
        document.getElementById('confidence-badge').textContent = '';
        document.getElementById('detected-lang').textContent = '';
        this.updateCharCount();
    }
    
    updateCharCount() {
        const input = document.getElementById('input-text');
        const count = input.value.length;
        document.getElementById('char-count').textContent = count;
        
        if (count > 4500) {
            document.getElementById('char-count').style.color = '#e53e3e';
        } else {
            document.getElementById('char-count').style.color = '#718096';
        }
    }
    
    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.speechRecognition = new webkitSpeechRecognition();
            this.speechRecognition.continuous = false;
            this.speechRecognition.interimResults = true;
            
            this.speechRecognition.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                
                if (finalTranscript) {
                    document.getElementById('input-text').value = finalTranscript;
                    this.updateCharCount();
                    this.handleInputChange();
                }
            };
            
            this.speechRecognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.showToast('Speech recognition failed', 'error');
                this.stopVoiceInput();
            };
            
            this.speechRecognition.onend = () => {
                this.stopVoiceInput();
            };
        }
    }
    
    toggleVoiceInput() {
        if (!this.speechRecognition) {
            this.showToast('Speech recognition not supported', 'error');
            return;
        }
        
        const btn = document.getElementById('voice-input');
        
        if (btn.classList.contains('active')) {
            this.stopVoiceInput();
        } else {
            this.startVoiceInput();
        }
    }
    
    startVoiceInput() {
        const sourceLang = document.getElementById('source-lang').value;
        this.speechRecognition.lang = this.getLanguageCode(sourceLang);
        this.speechRecognition.start();
        
        document.getElementById('voice-input').classList.add('active');
        this.showToast('Listening...', 'info');
    }
    
    stopVoiceInput() {
        if (this.speechRecognition) {
            this.speechRecognition.stop();
        }
        document.getElementById('voice-input').classList.remove('active');
    }
    
    speakOutput() {
        const outputText = document.getElementById('output-text').textContent;
        
        if (!outputText || outputText === 'Translation will appear here...') {
            this.showToast('No translation to speak', 'info');
            return;
        }
        
        if (this.speechSynthesis.speaking) {
            this.speechSynthesis.cancel();
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(outputText);
        const targetLang = document.getElementById('target-lang').value;
        utterance.lang = this.getLanguageCode(targetLang);
        utterance.rate = 0.8;
        
        this.speechSynthesis.speak(utterance);
        this.showToast('Speaking translation...', 'info');
    }
    
    async copyOutput() {
        const outputText = document.getElementById('output-text').textContent;
        
        if (!outputText || outputText === 'Translation will appear here...') {
            this.showToast('No translation to copy', 'info');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(outputText);
            this.showToast('Translation copied!', 'success');
        } catch (error) {
            console.error('Copy failed:', error);
            this.showToast('Copy failed', 'error');
        }
    }
    
    async saveTranslation() {
        const inputText = document.getElementById('input-text').value.trim();
        const outputText = document.getElementById('output-text').textContent;
        
        if (!inputText || !outputText || outputText === 'Translation will appear here...') {
            this.showToast('No translation to save', 'info');
            return;
        }
        
        const translation = {
            originalText: inputText,
            translatedText: outputText,
            sourceLanguage: document.getElementById('source-lang').value,
            targetLanguage: document.getElementById('target-lang').value,
            confidence: 0.8,
            method: 'manual_save'
        };
        
        try {
            await this.addToHistory(translation);
            this.showToast('Translation saved!', 'success');
        } catch (error) {
            console.error('Save failed:', error);
            this.showToast('Save failed', 'error');
        }
    }
    
    async addToHistory(translation) {
        try {
            const response = await fetch('/api/history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(translation)
            });
            
            if (response.ok) {
                this.translationHistory.unshift(translation);
                if (this.currentTab === 'history') {
                    this.renderHistory();
                }
            }
        } catch (error) {
            console.error('Failed to add to history:', error);
        }
    }
    
    async loadHistory() {
        try {
            const response = await fetch('/api/history');
            const data = await response.json();
            
            this.translationHistory = data.history || [];
            this.renderHistory();
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }
    
    renderHistory() {
        const historyList = document.getElementById('history-list');
        
        if (this.translationHistory.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: #718096; padding: 2rem;">No translations yet. Start translating to build your history!</p>';
            return;
        }
        
        historyList.innerHTML = this.translationHistory.map(item => `
            <div class="history-item">
                <div class="history-header">
                    <span class="history-languages">
                        ${this.getLanguageName(item.sourceLanguage)} → ${this.getLanguageName(item.targetLanguage)}
                    </span>
                    <span class="history-timestamp">
                        ${new Date(item.timestamp).toLocaleDateString()}
                    </span>
                </div>
                <div class="history-content">
                    <div class="history-original">${item.originalText}</div>
                    <div class="history-translation">${item.translatedText}</div>
                </div>
            </div>
        `).join('');
    }
    
    async searchHistory() {
        const query = document.getElementById('history-search').value.trim();
        
        if (!query) {
            this.renderHistory();
            return;
        }
        
        try {
            const response = await fetch(`/api/history/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            this.translationHistory = data.results || [];
            this.renderHistory();
        } catch (error) {
            console.error('Search failed:', error);
        }
    }
    
    async clearHistory() {
        if (!confirm('Are you sure you want to clear all translation history?')) {
            return;
        }
        
        try {
            const response = await fetch('/api/history', {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.translationHistory = [];
                this.renderHistory();
                this.showToast('History cleared', 'success');
            }
        } catch (error) {
            console.error('Failed to clear history:', error);
            this.showToast('Failed to clear history', 'error');
        }
    }
    
    async loadLanguages() {
        try {
            const response = await fetch('/api/languages');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            this.languages = data.languages || [];
            this.populateLanguageSelects();
            this.renderLanguages();
            this.populateLanguageFilters(data.regions || [], data.families || []);
        } catch (error) {
            console.error('Failed to load languages:', error);
            // Use fallback languages if API fails
            this.languages = [];
            this.populateLanguageSelects();
            this.showToast('Using offline language support', 'info');
        }
    }
    
    populateLanguageSelects() {
        const sourceSelect = document.getElementById('source-lang');
        const targetSelect = document.getElementById('target-lang');
        
        // Store current values
        const currentSource = sourceSelect.value;
        const currentTarget = targetSelect.value;
        
        // Clear existing options (except auto-detect for source)
        sourceSelect.innerHTML = '<option value="auto">Auto-detect</option>';
        targetSelect.innerHTML = '';
        
        // Ensure we have basic languages even if API fails
        const basicLanguages = [
            { code: 'english', name: 'English' },
            { code: 'twi', name: 'Twi (Akan)' },
            { code: 'yoruba', name: 'Yoruba' },
            { code: 'hausa', name: 'Hausa' },
            { code: 'igbo', name: 'Igbo' },
            { code: 'french', name: 'French' },
            { code: 'spanish', name: 'Spanish' },
            { code: 'arabic', name: 'Arabic' },
            { code: 'swahili', name: 'Swahili' }
        ];
        
        const languagesToUse = this.languages.length > 0 ? this.languages : basicLanguages;
        
        // Add language options
        languagesToUse.forEach(lang => {
            const option = `<option value="${lang.code}">${lang.name}</option>`;
            sourceSelect.innerHTML += option;
            targetSelect.innerHTML += option;
        });
        
        // Restore previous values or set defaults
        sourceSelect.value = currentSource || 'twi';
        targetSelect.value = currentTarget || 'yoruba';
        
        // Reload quick phrases with new language selection
        this.loadQuickPhrases();
    }
    
    populateLanguageFilters(regions, families) {
        const regionFilter = document.getElementById('region-filter');
        const familyFilter = document.getElementById('family-filter');
        
        regionFilter.innerHTML = '<option value="">All regions</option>';
        familyFilter.innerHTML = '<option value="">All families</option>';
        
        regions.forEach(region => {
            regionFilter.innerHTML += `<option value="${region}">${region}</option>`;
        });
        
        families.forEach(family => {
            familyFilter.innerHTML += `<option value="${family}">${family}</option>`;
        });
    }
    
    async filterLanguages() {
        const region = document.getElementById('region-filter').value;
        const family = document.getElementById('family-filter').value;
        
        try {
            let url = '/api/languages';
            const params = new URLSearchParams();
            
            if (region) params.append('region', region);
            if (family) params.append('family', family);
            
            if (params.toString()) {
                url += '?' + params.toString();
            }
            
            const response = await fetch(url);
            const data = await response.json();
            
            this.languages = data.languages || [];
            this.renderLanguages();
        } catch (error) {
            console.error('Failed to filter languages:', error);
        }
    }
    
    async loadLanguageStats() {
        try {
            const response = await fetch('/api/languages/stats');
            const data = await response.json();
            
            document.getElementById('total-languages').textContent = data.totalLanguages;
            document.getElementById('african-languages').textContent = data.africanLanguages;
            document.getElementById('nigerian-languages').textContent = data.nigerianLanguages;
            document.getElementById('language-families').textContent = data.languageFamilies;
        } catch (error) {
            console.error('Failed to load language stats:', error);
        }
    }
    
    renderLanguages() {
        const languagesGrid = document.getElementById('languages-grid');
        
        if (!languagesGrid) return;
        
        languagesGrid.innerHTML = this.languages.map(lang => `
            <div class="language-card">
                <div class="language-name">${lang.name}</div>
                <div class="language-native">${lang.nativeName}</div>
                <div class="language-info">
                    <span>${lang.region}</span>
                    <span>${lang.family}</span>
                </div>
            </div>
        `).join('');
    }
    
    async loadQuickPhrases() {
        const phrases = [
            { original: 'Hello', twi: 'Akwaaba', yoruba: 'Kaabo', hausa: 'Sannu', igbo: 'Ndewo', english: 'Hello' },
            { original: 'Thank you', twi: 'Medaase', yoruba: 'E se', hausa: 'Na gode', igbo: 'Dalu', english: 'Thank you' },
            { original: 'Yes', twi: 'Aane', yoruba: 'Beni', hausa: 'Eh', igbo: 'Ee', english: 'Yes' },
            { original: 'No', twi: 'Daabi', yoruba: 'Rara', hausa: 'A\'a', igbo: 'Mba', english: 'No' },
            { original: 'How are you?', twi: 'Wo ho te sen?', yoruba: 'Bawo ni?', hausa: 'Yaya kake?', igbo: 'Kedu ka i mere?', english: 'How are you?' },
            { original: 'Good', twi: 'Ɛyɛ', yoruba: 'O dara', hausa: 'Yana da kyau', igbo: 'O di mma', english: 'Good' },
            { original: 'Please', twi: 'Mepaakyɛw', yoruba: 'Je ka lo', hausa: 'Don Allah', igbo: 'Biko', english: 'Please' },
            { original: 'Goodbye', twi: 'Nante yiye', yoruba: 'O dabo', hausa: 'Sai an jima', igbo: 'Ka o di', english: 'Goodbye' }
        ];
        
        const phrasesGrid = document.getElementById('phrases-grid');
        const sourceLang = document.getElementById('source-lang').value;
        const targetLang = document.getElementById('target-lang').value;
        
        phrasesGrid.innerHTML = phrases.map(phrase => {
            const original = phrase[sourceLang === 'auto' ? 'english' : sourceLang] || phrase.original;
            const translation = phrase[targetLang] || phrase.original;
            
            return `
                <div class="phrase-card" onclick="app.useQuickPhrase('${original.replace(/'/g, "\\'").replace(/"/g, '&quot;')}', '${translation.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')">
                    <div class="phrase-original">${original}</div>
                    <div class="phrase-translation">${translation}</div>
                </div>
            `;
        }).join('');
    }
    
    useQuickPhrase(original, translation) {
        document.getElementById('input-text').value = original;
        document.getElementById('output-text').textContent = translation;
        this.updateCharCount();
        this.updateConfidenceBadge(0.9);
        
        // Add to history
        this.addToHistory({
            originalText: original,
            translatedText: translation,
            sourceLanguage: document.getElementById('source-lang').value,
            targetLanguage: document.getElementById('target-lang').value,
            confidence: 0.9,
            method: 'quick_phrase'
        });
        
        // Switch to translator tab
        this.switchTab('translator');
        
        // Show success message
        this.showToast('Quick phrase loaded!', 'success');
    }
    
    getLanguageName(code) {
        const lang = this.languages.find(l => l.code === code);
        return lang ? lang.name : code.charAt(0).toUpperCase() + code.slice(1);
    }
    
    getLanguageCode(language) {
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
    
    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + Enter: Translate
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            const inputText = document.getElementById('input-text').value.trim();
            if (inputText) {
                this.handleInputChange();
            }
        }
        
        // Ctrl/Cmd + K: Focus input
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            document.getElementById('input-text').focus();
        }
        
        // Ctrl/Cmd + L: Clear input
        if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
            event.preventDefault();
            this.clearInput();
        }
        
        // Ctrl/Cmd + S: Save translation
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            this.saveTranslation();
        }
        
        // Ctrl/Cmd + Shift + S: Swap languages
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
            event.preventDefault();
            this.swapLanguages();
        }
        
        // Tab navigation (1-4)
        if (event.altKey && ['1', '2', '3', '4'].includes(event.key)) {
            event.preventDefault();
            const tabs = ['translator', 'history', 'languages', 'about'];
            this.switchTab(tabs[parseInt(event.key) - 1]);
        }
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize the app
const app = new UniversalTranslator();

// Make app globally available for quick phrases
window.app = app;
