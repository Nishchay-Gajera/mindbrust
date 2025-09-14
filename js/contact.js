class ContactPage {
    constructor() {
        this.contactForm = null;
        this.submitButton = null;
        this.messageBox = null;
        this.faqContainer = null;

        this.faqs = [
            {
                question: "What image formats can I convert?",
                answer: "Our WebP converter supports JPG, PNG, GIF, BMP, and SVG formats. We are continuously working to support more formats in the future."
            },
            {
                question: "Is there a limit to the number of files I can convert?",
                answer: "No, you can convert as many files as you like, free of charge. Our tool supports bulk conversions to save you time."
            },
            {
                question: "Are my uploaded files secure?",
                answer: "Absolutely. We prioritize your privacy. All uploaded files are processed securely and are automatically deleted from our servers after a short period."
            },
            {
                question: "Do I need to create an account to use the tools?",
                answer: "No registration is required. All our tools are available for immediate use without the need for an account, ensuring a fast and hassle-free experience."
            }
        ];

        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    async setup() {
        await this.loadComponents();
        this.getElements();
        this.renderFAQs();
        this.setupEventListeners();
    }

    async loadComponents() {
        try {
            const headerResponse = await fetch('components/header.html');
            const headerHTML = await headerResponse.text();
            document.getElementById('header-container').innerHTML = headerHTML;

            const footerResponse = await fetch('components/footer.html');
            const footerHTML = await footerResponse.text();
            document.getElementById('footer-container').innerHTML = footerHTML;

            this.initializeMobileMenu();

        } catch (error) {
            console.error('Error loading components:', error);
            this.showMessage('Error loading page components', 'error');
        }
    }

    initializeMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        const hamburgerIcon = document.getElementById('hamburger-icon');
        const closeIcon = document.getElementById('close-icon');

        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.addEventListener('click', function() {
                mobileMenu.classList.toggle('hidden');
                hamburgerIcon.classList.toggle('hidden');
                closeIcon.classList.toggle('hidden');
                const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
                mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
            });
        }
    }

    getElements() {
        this.contactForm = document.getElementById('contact-form');
        this.submitButton = document.getElementById('submit-button');
        this.messageBox = document.getElementById('message-box');
        this.faqContainer = document.getElementById('faq-container');
    }

    renderFAQs() {
        if (!this.faqContainer) return;
        let faqHTML = '';
        this.faqs.forEach((faq, index) => {
            faqHTML += `
                <div class="faq-item">
                    <button class="faq-question" aria-expanded="false" aria-controls="faq-answer-${index}">
                        <span>${faq.question}</span>
                        <svg class="faq-icon h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <div id="faq-answer-${index}" class="faq-answer">
                        <p>${faq.answer}</p>
                    </div>
                </div>
            `;
        });
        this.faqContainer.innerHTML = faqHTML;
    }

    setupEventListeners() {
        if (this.contactForm) {
            this.contactForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        if(this.faqContainer){
            this.faqContainer.addEventListener('click', (e) => {
                const questionButton = e.target.closest('.faq-question');
                if (questionButton) {
                    const faqItem = questionButton.parentElement;
                    const answer = faqItem.querySelector('.faq-answer');
                    const isOpening = !faqItem.classList.contains('open');

                    // Close all other items
                    this.faqContainer.querySelectorAll('.faq-item.open').forEach(openItem => {
                        if (openItem !== faqItem) {
                            openItem.classList.remove('open');
                            const otherAnswer = openItem.querySelector('.faq-answer');
                            otherAnswer.style.maxHeight = null;
                            openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                        }
                    });
                    
                    // Toggle current item
                    faqItem.classList.toggle('open');
                    questionButton.setAttribute('aria-expanded', isOpening);
                    if (isOpening) {
                        answer.style.maxHeight = answer.scrollHeight + 'px';
                    } else {
                        answer.style.maxHeight = null;
                    }
                }
            });
        }
    }

    showMessage(message, type = 'info') {
        if (!this.messageBox) return;
        this.messageBox.textContent = message;
        this.messageBox.className = `message-box show ${type}`;
        setTimeout(() => {
            this.messageBox.className = 'message-box';
        }, 4000);
    }

    validateForm() {
        const name = this.contactForm.elements['name'].value.trim();
        const email = this.contactForm.elements['email'].value.trim();
        const subject = this.contactForm.elements['subject'].value.trim();
        const message = this.contactForm.elements['message'].value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!name || !email || !subject || !message) {
            this.showMessage('Please fill out all required fields.', 'error');
            return false;
        }

        if (!emailRegex.test(email)) {
            this.showMessage('Please enter a valid email address.', 'error');
            return false;
        }

        return true;
    }

    handleSubmit(e) {
        e.preventDefault();
        if (!this.submitButton) return;
        
        // Validate form before submitting
        if (!this.validateForm()) {
            return;
        }

        this.submitButton.disabled = true;
        this.submitButton.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending...
        `;

        // Simulate form submission
        setTimeout(() => {
            this.showMessage('Your message has been sent successfully!', 'success');
            if (this.contactForm) {
                this.contactForm.reset();
            }
            this.submitButton.disabled = false;
            this.submitButton.textContent = 'Send Message';
        }, 2000);
    }
}

const contactPage = new ContactPage();


