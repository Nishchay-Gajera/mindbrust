/**
 * Main Application Script
 * Handles WebP conversion functionality and component loading
 */

class WebPConverter {
    constructor() {
        this.fileInput = null;
        this.fileLabel = null;
        this.fileListContainer = null;
        this.fileList = null;
        this.qualitySlider = null;
        this.qualityValueSpan = null;
        this.convertButton = null;
        this.downloadAllButton = null;
        this.clearButton = null;
        this.conversionCanvas = null;
        this.ctx = null;
        this.messageBox = null;
        
        this.filesToConvert = [];
        this.convertedBlobs = [];
        this.allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml'];
        
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
        this.setupEventListeners();
    }

    async loadComponents() {
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
                const isHidden = mobileMenu.classList.contains('hidden');
                
                if (isHidden) {
                    mobileMenu.classList.remove('hidden');
                    hamburgerIcon.classList.add('hidden');
                    closeIcon.classList.remove('hidden');
                    mobileMenuToggle.setAttribute('aria-expanded', 'true');
                } else {
                    mobileMenu.classList.add('hidden');
                    hamburgerIcon.classList.remove('hidden');
                    closeIcon.classList.add('hidden');
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                }
            });

            // Close mobile menu when clicking on a link
            const mobileMenuLinks = mobileMenu.querySelectorAll('a');
            mobileMenuLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.add('hidden');
                    hamburgerIcon.classList.remove('hidden');
                    closeIcon.classList.add('hidden');
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                });
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenuToggle.contains(e.target) && !mobileMenu.contains(e.target)) {
                    if (!mobileMenu.classList.contains('hidden')) {
                        mobileMenu.classList.add('hidden');
                        hamburgerIcon.classList.remove('hidden');
                        closeIcon.classList.add('hidden');
                        mobileMenuToggle.setAttribute('aria-expanded', 'false');
                    }
                }
            });
        }
    }

    getElements() {
        this.fileInput = document.getElementById('file-input');
        this.fileLabel = document.getElementById('file-label');
        this.fileListContainer = document.getElementById('file-list-container');
        this.fileList = document.getElementById('file-list');
        this.qualitySlider = document.getElementById('quality-slider');
        this.qualityValueSpan = document.getElementById('quality-value');
        this.convertButton = document.getElementById('convert-button');
        this.downloadAllButton = document.getElementById('download-all-button');
        this.clearButton = document.getElementById('clear-button');
        this.conversionCanvas = document.getElementById('conversion-canvas');
        this.messageBox = document.getElementById('message-box');
        
        if (this.conversionCanvas) {
            this.ctx = this.conversionCanvas.getContext('2d');
        }
    }

    setupEventListeners() {
        // Quality slider
        if (this.qualitySlider && this.qualityValueSpan) {
            this.qualitySlider.addEventListener('input', () => {
                this.qualityValueSpan.textContent = this.qualitySlider.value;
            });
        }

        // File input
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        }

        // Drag and drop
        if (this.fileLabel) {
            this.fileLabel.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.fileLabel.classList.add('dragover');
            });

            this.fileLabel.addEventListener('dragleave', (e) => {
                e.preventDefault();
                this.fileLabel.classList.remove('dragover');
            });

            this.fileLabel.addEventListener('drop', (e) => {
                e.preventDefault();
                this.fileLabel.classList.remove('dragover');
                if (e.dataTransfer.files.length > 0) {
                    this.handleFiles(e.dataTransfer.files);
                }
            });
        }

        // Buttons
        if (this.convertButton) {
            this.convertButton.addEventListener('click', () => this.convertFiles());
        }

        if (this.downloadAllButton) {
            this.downloadAllButton.addEventListener('click', () => this.downloadAllAsZip());
        }

        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => this.clearAll());
        }

        // File list event delegation
        if (this.fileList) {
            this.fileList.addEventListener('click', (e) => this.handleFileListClick(e));
        }
    }

    showMessage(message, type = 'info') {
        if (!this.messageBox) return;
        
        this.messageBox.textContent = message;
        this.messageBox.className = 'message-box show';
        
        // Set background color based on type
        const colors = {
            'error': '#dc2626',
            'success': '#16a34a',
            'info': '#233dff',
            'warning': '#d97706'
        };
        
        this.messageBox.style.backgroundColor = colors[type] || colors.info;
        
        // Auto hide after 4 seconds
        setTimeout(() => {
            this.messageBox.className = 'message-box';
        }, 4000);
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    handleFiles(files) {
        const selectedFiles = Array.from(files);
        const invalidFiles = selectedFiles.filter(file => !this.allowedFileTypes.includes(file.type));
        this.filesToConvert = selectedFiles.filter(file => this.allowedFileTypes.includes(file.type));
        
        if (invalidFiles.length > 0) {
            const invalidNames = invalidFiles.map(f => f.name).join(', ');
            this.showMessage(`The following file(s) were ignored: ${invalidNames}. Please upload JPG, PNG, GIF, BMP, or SVG files.`, 'error');
        }

        if (this.filesToConvert.length > 0) {
            this.fileListContainer.classList.remove('hidden');
            this.updateFileList();
            this.convertButton.disabled = false;
            this.showMessage(`${this.filesToConvert.length} file(s) selected. Ready to convert.`, 'info');
        } else {
            this.fileListContainer.classList.add('hidden');
            this.convertButton.disabled = true;
            if (selectedFiles.length > 0) {
                this.showMessage('No valid image files selected.', 'error');
            }
        }
    }

    updateFileList() {
        if (!this.fileList) return;
        
        this.fileList.innerHTML = '';
        this.filesToConvert.forEach((file, index) => {
            const fileCard = document.createElement('div');
            fileCard.className = 'file-card flex flex-col items-center space-y-2';
            fileCard.innerHTML = `
                <div class="flex items-center justify-between w-full px-2">
                    <div class="text-sm font-medium truncate w-5/6" title="${file.name}">${file.name}</div>
                    <button class="remove-button text-gray-500 hover:text-red-600 transition-colors" data-index="${index}" title="Remove file">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="w-full h-2 bg-gray-200 rounded-full">
                    <div id="progress-${index}" class="bg-indigo-600 h-2 rounded-full transition-all duration-300" style="width: 0%;"></div>
                </div>
                <span id="status-${index}" class="text-xs text-gray-500">Pending</span>
                <button id="download-${index}" data-index="${index}" class="w-full px-4 py-2 bg-green-500 text-white font-medium rounded-lg text-sm transition-colors hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed" disabled>
                    Download
                </button>
            `;
            this.fileList.appendChild(fileCard);
        });
    }

    handleFileListClick(e) {
        const button = e.target.closest('button');
        if (!button) return;
        
        const index = parseInt(button.dataset.index);

        // Handle single download
        if (button.id && button.id.startsWith('download-')) {
            const file = this.convertedBlobs.find(f => f.originalIndex === index);
            if (file) {
                this.downloadFile(file);
            }
        }
        
        // Handle remove
        if (button.classList.contains('remove-button')) {
            this.removeFile(index);
        }
    }

    removeFile(index) {
        this.filesToConvert.splice(index, 1);
        
        // Remove from convertedBlobs if it exists
        const convertedBlobIndex = this.convertedBlobs.findIndex(f => f.originalIndex === index);
        if (convertedBlobIndex > -1) {
            this.convertedBlobs.splice(convertedBlobIndex, 1);
        }
        
        this.updateFileList();
        
        if (this.filesToConvert.length === 0) {
            this.clearAll();
        } else {
            this.showMessage(`${this.filesToConvert.length} file(s) remaining.`, 'info');
        }
    }

    downloadFile(file) {
        const downloadUrl = URL.createObjectURL(file.blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        this.showMessage(`Download of "${file.name}" started.`, 'success');
    }

    clearAll() {
        if (this.fileInput) this.fileInput.value = '';
        this.filesToConvert = [];
        this.convertedBlobs = [];
        
        if (this.fileListContainer) this.fileListContainer.classList.add('hidden');
        if (this.fileList) this.fileList.innerHTML = '';
        if (this.convertButton) this.convertButton.disabled = true;
        if (this.downloadAllButton) {
            this.downloadAllButton.classList.add('hidden');
            this.downloadAllButton.disabled = true;
        }
        
        this.showMessage('All files cleared.', 'info');
    }

    async convertFiles() {
        if (this.filesToConvert.length === 0) {
            this.showMessage('Please select at least one file to convert.', 'error');
            return;
        }

        this.convertButton.disabled = true;
        this.downloadAllButton.disabled = true;
        this.downloadAllButton.classList.add('hidden');
        this.showMessage('Converting images... Please wait.', 'info');
        
        this.convertedBlobs = [];
        const quality = parseInt(this.qualitySlider.value) / 100;

        try {
            for (let i = 0; i < this.filesToConvert.length; i++) {
                await this.convertSingleFile(i, quality);
            }

            this.showMessage('All conversions complete!', 'success');
            this.downloadAllButton.classList.remove('hidden');
            this.downloadAllButton.disabled = false;
            
        } catch (error) {
            console.error('Conversion process failed:', error);
            this.showMessage(`Conversion failed: ${error.message}`, 'error');
        } finally {
            this.convertButton.disabled = false;
        }
    }

    convertSingleFile(index, quality) {
        return new Promise((resolve, reject) => {
            const file = this.filesToConvert[index];
            const originalName = file.name.split('.').slice(0, -1).join('.');
            
            const progressBar = document.getElementById(`progress-${index}`);
            const statusText = document.getElementById(`status-${index}`);
            const downloadButton = document.getElementById(`download-${index}`);

            if (!progressBar || !statusText || !downloadButton) {
                console.error('UI elements not found for index:', index);
                resolve();
                return;
            }

            statusText.textContent = "Converting...";
            progressBar.style.width = '50%';

            const img = new Image();
            const reader = new FileReader();
            const originalSize = file.size;
            
            reader.onload = (e) => {
                img.onload = () => {
                    this.conversionCanvas.width = img.width;
                    this.conversionCanvas.height = img.height;
                    this.ctx.drawImage(img, 0, 0);

                    this.conversionCanvas.toBlob((blob) => {
                        if (blob) {
                            const webpFileName = `${originalName}.webp`;
                            const newSize = blob.size;
                            const sizeDifference = originalSize - newSize;
                            const percentageReduction = ((sizeDifference / originalSize) * 100).toFixed(1);

                            this.convertedBlobs.push({ 
                                name: webpFileName, 
                                blob: blob, 
                                originalIndex: index 
                            });
                            
                            progressBar.style.width = '100%';
                            statusText.textContent = `Complete: ${this.formatBytes(newSize)} (-${percentageReduction}%)`;
                            downloadButton.disabled = false;
                            
                            resolve();
                        } else {
                            console.error('Canvas toBlob failed:', file.name);
                            statusText.textContent = `Error: Conversion failed.`;
                            reject(new Error(`Failed to convert ${file.name}.`));
                        }
                    }, 'image/webp', quality);
                };
                
                img.onerror = () => {
                    console.error('Image loading error:', file.name);
                    statusText.textContent = `Error: Loading failed.`;
                    reject(new Error(`Failed to load image: ${file.name}`));
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = () => {
                console.error('FileReader error:', file.name);
                statusText.textContent = `Error: Reading failed.`;
                reject(new Error(`Failed to read file: ${file.name}`));
            };
            
            reader.readAsDataURL(file);
        });
    }

    async downloadAllAsZip() {
        if (this.convertedBlobs.length === 0) return;
        
        this.downloadAllButton.disabled = true;
        this.showMessage('Generating zip file...', 'info');

        try {
            const zip = new JSZip();
            this.convertedBlobs.forEach(file => {
                zip.file(file.name, file.blob);
            });
            
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            const downloadUrl = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = 'converted_images.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

            this.showMessage('Download of "converted_images.zip" started.', 'success');
            
        } catch (error) {
            console.error('Zip generation failed:', error);
            this.showMessage(`Zip generation failed: ${error.message}`, 'error');
        } finally {
            this.downloadAllButton.disabled = false;
        }
    }
}

// Initialize the application
const webpConverter = new WebPConverter();

// Make it globally available for debugging
window.WebPConverter = webpConverter;