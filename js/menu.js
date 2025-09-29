/**
 * Universal Menu Handler for All Pages
 * Add this to js/main.js or create a new js/menu.js file
 */

document.addEventListener('DOMContentLoaded', () => {
    const loadComponents = async () => {
        try {
            // Load header
            const headerResponse = await fetch('components/header.html');
            const headerHTML = await headerResponse.text();
            document.getElementById('header-container').innerHTML = headerHTML;

            // Load footer
            const footerResponse = await fetch('components/footer.html');
            const footerHTML = await footerResponse.text();
            document.getElementById('footer-container').innerHTML = footerHTML;

            // Initialize mobile menu after header is loaded
            initializeMobileMenu();

        } catch (error) {
            console.error('Error loading components:', error);
        }
    };

    const initializeMobileMenu = () => {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        const hamburgerIcon = document.getElementById('hamburger-icon');
        const closeIcon = document.getElementById('close-icon');

        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.addEventListener('click', function() {
                const isMenuOpen = mobileMenu.classList.contains('show');
                
                if (isMenuOpen) {
                    // Close menu
                    mobileMenu.classList.remove('show');
                    hamburgerIcon.classList.remove('hidden');
                    closeIcon.classList.add('hidden');
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                } else {
                    // Open menu
                    mobileMenu.classList.add('show');
                    hamburgerIcon.classList.add('hidden');
                    closeIcon.classList.remove('hidden');
                    mobileMenuToggle.setAttribute('aria-expanded', 'true');
                }
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', function(event) {
                const isClickInsideNav = event.target.closest('nav');
                if (!isClickInsideNav && mobileMenu.classList.contains('show')) {
                    mobileMenu.classList.remove('show');
                    hamburgerIcon.classList.remove('hidden');
                    closeIcon.classList.add('hidden');
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                }
            });

            // Close mobile menu on window resize if it gets too wide
            window.addEventListener('resize', function() {
                if (window.innerWidth >= 768 && mobileMenu.classList.contains('show')) {
                    mobileMenu.classList.remove('show');
                    hamburgerIcon.classList.remove('hidden');
                    closeIcon.classList.add('hidden');
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                }
            });
        }

        console.log('Universal menu initialized successfully');
    };

    loadComponents();
});