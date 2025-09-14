/**
 * AdSense Configuration and Management
 * Easy setup for Google AdSense integration
 */

class AdSenseManager {
    constructor() {
        this.config = {
            // ==========================================
            // CONFIGURATION SECTION - EDIT HERE
            // ==========================================
            
            // Set to true to enable ads, false to disable all ads
            enabled: false,
            
            // Your Google AdSense Client ID (starts with ca-pub-)
            clientId: 'ca-pub-XXXXXXXXXXXXXXXXX', // Replace with your actual client ID
            
            // Ad Units Configuration
            adUnits: {
                topBanner: {
                    enabled: true,
                    slotId: '1234567890', // Replace with your ad unit ID
                    size: 'responsive', // Options: 'responsive', 'fixed', 'custom'
                    format: 'horizontal', // Options: 'horizontal', 'vertical', 'rectangle'
                },
                leftSidebar: {
                    enabled: true,
                    slotId: '1234567891',
                    size: 'responsive',
                    format: 'vertical',
                },
                rightSidebar: {
                    enabled: true,
                    slotId: '1234567892',
                    size: 'responsive',
                    format: 'vertical',
                },
                aboveForm: {
                    enabled: true,
                    slotId: '1234567893',
                    size: 'responsive',
                    format: 'rectangle',
                },
                middleContent: {
                    enabled: true,
                    slotId: '1234567894',
                    size: 'responsive',
                    format: 'rectangle',
                },
                bottomContent: {
                    enabled: true,
                    slotId: '1234567895',
                    size: 'responsive',
                    format: 'rectangle',
                },
                bottomBanner: {
                    enabled: true,
                    slotId: '1234567896',
                    size: 'responsive',
                    format: 'horizontal',
                }
            },
            
            // Mobile settings
            mobile: {
                hideSidebar: true, // Hide sidebar ads on mobile
                reduceInContent: false // Show fewer in-content ads on mobile
            },
            
            // Development mode (set to false for production)
            testMode: true // Shows placeholder ads for testing
        };

        this.isInitialized = false;
        this.isMobile = window.innerWidth <= 768;
        
        this.init();
    }

    init() {
        if (!this.config.enabled) {
            console.log('AdSense: Ads are disabled in configuration');
            return;
        }

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.loadAds());
        } else {
            this.loadAds();
        }
    }

    loadAds() {
        this.loadAdSenseScript();
        this.createAdUnits();
        this.setupResponsiveHandling();
    }

    loadAdSenseScript() {
        if (this.config.testMode) {
            console.log('AdSense: Running in test mode - using placeholder ads');
            return;
        }

        // Load Google AdSense script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.config.clientId}`;
        script.crossOrigin = 'anonymous';
        
        script.onerror = () => {
            console.error('AdSense: Failed to load AdSense script');
        };

        document.head.appendChild(script);

        // Initialize AdSense
        window.adsbygoogle = window.adsbygoogle || [];
        this.isInitialized = true;
    }

    createAdUnits() {
        Object.entries(this.config.adUnits).forEach(([unitName, config]) => {
            if (!config.enabled) return;

            // Skip sidebar ads on mobile if configured
            if (this.isMobile && this.config.mobile.hideSidebar && 
                (unitName.includes('Sidebar'))) {
                return;
            }

            const containerId = this.getContainerIdFromUnitName(unitName);
            const container = document.getElementById(containerId);
            
            if (!container) {
                console.warn(`AdSense: Container ${containerId} not found for ${unitName}`);
                return;
            }

            if (this.config.testMode) {
                this.createTestAd(container, config, unitName);
            } else {
                this.createRealAd(container, config);
            }
        });
    }

    createTestAd(container, config, unitName) {
        const testAd = document.createElement('div');
        testAd.className = 'test-ad';
        testAd.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <div style="font-size: 14px; opacity: 0.8; margin-bottom: 8px;">
                    AdSense Test Mode
                </div>
                <div style="font-weight: 600; margin-bottom: 4px;">
                    ${unitName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} Ad Unit
                </div>
                <div style="font-size: 12px; opacity: 0.7;">
                    Format: ${config.format} | Size: ${config.size}
                </div>
                <div style="font-size: 11px; opacity: 0.6; margin-top: 8px;">
                    Replace with real ads by setting testMode: false
                </div>
            </div>
        `;
        
        container.appendChild(testAd);
        container.style.display = 'block';
    }

    createRealAd(container, config) {
        const adElement = document.createElement('ins');
        adElement.className = 'adsbygoogle';
        adElement.style.display = 'block';
        adElement.setAttribute('data-ad-client', this.config.clientId);
        adElement.setAttribute('data-ad-slot', config.slotId);
        
        // Set ad format based on configuration
        if (config.size === 'responsive') {
            adElement.setAttribute('data-ad-format', 'auto');
            adElement.setAttribute('data-full-width-responsive', 'true');
        }

        container.appendChild(adElement);
        container.style.display = 'block';

        // Push to AdSense queue
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error('AdSense: Error initializing ad unit', e);
        }
    }

    getContainerIdFromUnitName(unitName) {
        const mapping = {
            'topBanner': 'top-banner-ad',
            'leftSidebar': 'left-sidebar-ad',
            'rightSidebar': 'right-sidebar-ad',
            'aboveForm': 'above-form-ad',
            'middleContent': 'middle-content-ad',
            'bottomContent': 'bottom-content-ad',
            'bottomBanner': 'bottom-banner-ad'
        };
        return mapping[unitName];
    }

    setupResponsiveHandling() {
        // Handle window resize for responsive ads
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const wasMobile = this.isMobile;
                this.isMobile = window.innerWidth <= 768;
                
                // Reload ads if mobile state changed
                if (wasMobile !== this.isMobile && this.config.mobile.hideSidebar) {
                    this.refreshAds();
                }
            }, 250);
        });
    }

    refreshAds() {
        // Clear existing ads
        const adContainers = document.querySelectorAll('.ad-container');
        adContainers.forEach(container => {
            container.innerHTML = '';
            container.style.display = 'none';
        });

        // Recreate ads
        this.createAdUnits();
    }

    // Public methods for dynamic ad management
    enableAd(unitName) {
        if (this.config.adUnits[unitName]) {
            this.config.adUnits[unitName].enabled = true;
            this.refreshAds();
        }
    }

    disableAd(unitName) {
        if (this.config.adUnits[unitName]) {
            this.config.adUnits[unitName].enabled = false;
            const containerId = this.getContainerIdFromUnitName(unitName);
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '';
                container.style.display = 'none';
            }
        }
    }

    enableAllAds() {
        this.config.enabled = true;
        Object.keys(this.config.adUnits).forEach(unitName => {
            this.config.adUnits[unitName].enabled = true;
        });
        this.loadAds();
    }

    disableAllAds() {
        this.config.enabled = false;
        const adContainers = document.querySelectorAll('.ad-container');
        adContainers.forEach(container => {
            container.innerHTML = '';
            container.style.display = 'none';
        });
    }

    // Get configuration for debugging
    getConfig() {
        return this.config;
    }
}

// Initialize AdSense Manager
const adSenseManager = new AdSenseManager();

// Make it globally available for debugging and dynamic control
window.AdSenseManager = adSenseManager;

// Export for module use if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdSenseManager;
}