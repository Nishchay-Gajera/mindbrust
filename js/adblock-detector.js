/**
 * Ad Blocker Detection Script
 * Detects if user has an ad blocker enabled and shows appropriate message
 */

class AdBlockDetector {
    constructor() {
        this.isAdBlockActive = false;
        this.overlay = null;
        this.hasUserInteracted = false;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.detect());
        } else {
            this.detect();
        }
    }

    detect() {
        // Multiple detection methods for better accuracy
        this.detectByElement();
        this.detectByFetch();
        this.detectByCSS();
        
        // Give some time for ad blockers to work
        setTimeout(() => {
            this.checkResults();
        }, 1000);
    }

    detectByElement() {
        // Method 1: Check if test ad element is hidden/removed
        const testAd = document.querySelector('.ad-test');
        if (testAd) {
            const rect = testAd.getBoundingClientRect();
            if (rect.height === 0 || window.getComputedStyle(testAd).display === 'none') {
                this.isAdBlockActive = true;
            }
        }

        // Method 2: Create and test a fake ad element
        const fakeAd = document.createElement('div');
        fakeAd.innerHTML = '&nbsp;';
        fakeAd.className = 'adsbox adsbygoogle ads ad-unit';
        fakeAd.style.cssText = 'position: absolute; left: -1000px; width: 1px; height: 1px;';
        
        document.body.appendChild(fakeAd);
        
        setTimeout(() => {
            const rect = fakeAd.getBoundingClientRect();
            if (rect.height === 0 || window.getComputedStyle(fakeAd).display === 'none') {
                this.isAdBlockActive = true;
            }
            document.body.removeChild(fakeAd);
        }, 100);
    }

    detectByFetch() {
        // Method 3: Try to fetch a common ad script
        const testUrls = [
            '/ads.js',
            '/adsystem/ads.js',
            '/advertisement.js'
        ];

        testUrls.forEach(url => {
            fetch(url, { mode: 'no-cors' })
                .catch(() => {
                    // If fetch fails, might indicate ad blocker
                    this.isAdBlockActive = true;
                });
        });
    }

    detectByCSS() {
        // Method 4: Check for CSS-based blocking
        const testElement = document.createElement('div');
        testElement.className = 'ads advertising advertisement';
        testElement.style.cssText = 'position: absolute; left: -1000px; width: 1px; height: 1px;';
        
        document.body.appendChild(testElement);
        
        setTimeout(() => {
            if (window.getComputedStyle(testElement).display === 'none') {
                this.isAdBlockActive = true;
            }
            document.body.removeChild(testElement);
        }, 100);
    }

    checkResults() {
        if (this.isAdBlockActive && !this.hasUserInteracted) {
            this.showAdBlockMessage();
        }
    }

    showAdBlockMessage() {
        this.overlay = document.getElementById('adblock-overlay');
        if (this.overlay) {
            this.overlay.classList.remove('hidden');
            this.setupEventListeners();
            
            // Disable main functionality
            this.disableMainFeatures();
        }
    }

    setupEventListeners() {
        const refreshBtn = document.getElementById('adblock-refresh');
        const continueBtn = document.getElementById('adblock-continue');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.hasUserInteracted = true;
                window.location.reload();
            });
        }

        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.hasUserInteracted = true;
                this.hideAdBlockMessage();
                this.enableMainFeatures();
            });
        }

        // Close on overlay click (outside modal)
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                // Don't allow closing by clicking outside
                // User must make a choice
            }
        });
    }

    hideAdBlockMessage() {
        if (this.overlay) {
            this.overlay.classList.add('hidden');
        }
    }

    disableMainFeatures() {
        // Disable file input and conversion features
        const fileInput = document.getElementById('file-input');
        const convertButton = document.getElementById('convert-button');
        const clearButton = document.getElementById('clear-button');
        
        if (fileInput) fileInput.disabled = true;
        if (convertButton) convertButton.disabled = true;
        if (clearButton) clearButton.disabled = true;

        // Add overlay to main content
        const main = document.querySelector('main');
        if (main) {
            main.style.pointerEvents = 'none';
            main.style.opacity = '0.5';
        }
    }

    enableMainFeatures() {
        // Re-enable file input and conversion features
        const fileInput = document.getElementById('file-input');
        const convertButton = document.getElementById('convert-button');
        const clearButton = document.getElementById('clear-button');
        
        if (fileInput) fileInput.disabled = false;
        if (convertButton) convertButton.disabled = false;
        if (clearButton) clearButton.disabled = false;

        // Remove overlay from main content
        const main = document.querySelector('main');
        if (main) {
            main.style.pointerEvents = 'auto';
            main.style.opacity = '1';
        }
    }

    // Public method to check if ad blocker is detected
    isDetected() {
        return this.isAdBlockActive;
    }
}

// Initialize ad block detector when script loads
const adBlockDetector = new AdBlockDetector();

// Export for use in other scripts if needed
window.AdBlockDetector = AdBlockDetector;