// Dark Mode Toggle Functionality
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }
    
    init() {
        this.applyTheme(this.currentTheme);
        this.createToggleButton();
    }
    
    createToggleButton() {
        const header = document.querySelector('.header-content');
        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = this.currentTheme === 'dark' ? '☀️' : '🌙';
        themeToggle.title = `Switch to ${this.currentTheme === 'dark' ? 'light' : 'dark'} mode`;
        themeToggle.addEventListener('click', () => this.toggleTheme());
        
        header.appendChild(themeToggle);
    }
    
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        
        // Update button
        const button = document.querySelector('.theme-toggle');
        button.innerHTML = this.currentTheme === 'dark' ? '☀️' : '🌙';
        button.title = `Switch to ${this.currentTheme === 'dark' ? 'light' : 'dark'} mode`;
    }
    
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        if (theme === 'dark') {
            document.body.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';
        } else {
            document.body.style.background = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)';
        }
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
});
