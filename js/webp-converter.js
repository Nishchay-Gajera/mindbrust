/**
 * WebP Converter Script
 * Handles WebP conversion functionality with proper error handling
 */

class WebPConverter {
    constructor() {
        // DOM Elements
        this.uploadArea = null;
        this.fileInput = null;
        this.settingsSection = null;
        this.fileListSection = null;
        this.fileList = null;
        this.qualitySlider = null;
        this.qualityValueSpan = null;
        this.convertAllBtn = null;
        this.downloadAllBtn = null;
        this.messageBox = null;
        this.conversionCanvas = null;
        this.ctx = null;
        
        // State
        this.filesToConvert = [];
        this.convertedBlobs = [];
        this.allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml'];
        this.isProcessing = false;
        
        console.log('WebPConverter initialized');
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
        this.setupFAQ();
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
        }
    }

    getElements() {
        console.log('Getting DOM elements...');
        
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('file-input');
        this.settingsSection = document.getElementById('settings-section');
        this.fileListSection = document.getElementById('file-list-section');
        this.fileList = document.getElementById('file-list');
        this.qualitySlider = document.getElementById('quality-slider');
        this.qualityValueSpan = document.getElementById('quality-value');
        this.convertAllBtn = document.getElementById('convert-all-btn');
        this.downloadAllBtn = document.getElementById('download-all-btn');
        this.messageBox = document.getElementById('message-box');
        this.conversionCanvas = document.getElementById('conversion-canvas');
        
        // Debug logs
        console.log('Upload area found:', !!this.uploadArea);
        console.log('File input found:', !!this.fileInput);
        console.log('Convert button found:', !!this.convertAllBtn);
        console.log('Quality slider found:', !!this.qualitySlider);
        
        if (this.conversionCanvas) {
            this.ctx = this.conversionCanvas.getContext('2d');
            console.log('Canvas context created:', !!this.ctx);
        } else {
            console.error('Canvas not found!');
        }
    }

    setupEventListeners() {
        // Quality slider
        if (this.qualitySlider && this.qualityValueSpan) {
            this.qualitySlider.addEventListener('input', () => {
                this.qualityValueSpan.textContent = this.qualitySlider.value + '%';
            });
        }

        // File input change
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => {
                console.log('File input change event triggered');
                if (e.target.files && e.target.files.length > 0) {
                    this.handleFiles(e.target.files);
                    e.target.value = '';
                }
            });
        }

        // Drag and drop
        if (this.uploadArea) {
            this.uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.uploadArea.classList.add('dragover');
            });

            this.uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                this.uploadArea.classList.remove('dragover');
            });

            this.uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.uploadArea.classList.remove('dragover');
                console.log('Drop event triggered');
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    this.handleFiles(e.dataTransfer.files);
                }
            });

            // Click to upload
            this.uploadArea.addEventListener('click', (e) => {
                if (e.target === this.fileInput) {
                    return;
                }
                
                console.log('Upload area clicked');
                e.preventDefault();
                e.stopPropagation();
                
                if (this.fileInput) {
                    this.fileInput.click();
                }
            });
        }

        // Buttons
        if (this.convertAllBtn) {
            this.convertAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Convert button clicked, files count:', this.filesToConvert.length);
                this.convertFiles();
            });
        }

        if (this.downloadAllBtn) {
            this.downloadAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.downloadAllAsZip();
            });
        }

        // File list event delegation
        if (this.fileList) {
            this.fileList.addEventListener('click', (e) => this.handleFileListClick(e));
        }
    }

    setupFAQ() {
        setTimeout(() => {
            const faqItems = document.querySelectorAll('.faq-item');
            faqItems.forEach(item => {
                const question = item.querySelector('.faq-question');
                
                if (question) {
                    question.addEventListener('click', () => {
                        // Close all other items
                        faqItems.forEach(otherItem => {
                            if (otherItem !== item) {
                                otherItem.classList.remove('open');
                            }
                        });
                        
                        // Toggle current item
                        item.classList.toggle('open');
                    });
                }
            });
        }, 100);
    }

    handleFiles(files) {
        console.log('handleFiles called with:', files.length, 'files');
        
        const selectedFiles = Array.from(files);
        const invalidFiles = selectedFiles.filter(file => {
            console.log('Checking file:', file.name, 'Type:', file.type);
            return !this.allowedFileTypes.includes(file.type);
        });
        const validFiles = selectedFiles.filter(file => this.allowedFileTypes.includes(file.type));
        
        console.log('Valid files:', validFiles.length, 'Invalid files:', invalidFiles.length);
        
        if (invalidFiles.length > 0) {
            const invalidNames = invalidFiles.map(f => f.name).join(', ');
            this.showMessage(`The following file(s) were ignored: ${invalidNames}. Please upload JPG, PNG, GIF, BMP, or SVG files.`, 'warning');
        }

        if (validFiles.length > 0) {
            this.filesToConvert = [...this.filesToConvert, ...validFiles];
            console.log('Total files after adding:', this.filesToConvert.length);
            this.updateUI();
            this.showMessage(`${validFiles.length} file(s) selected. Ready to convert.`, 'success');
        } else if (selectedFiles.length > 0) {
            this.showMessage('No valid image files selected.', 'error');
        }
    }

    updateUI() {
        if (this.filesToConvert.length > 0) {
            this.fileListSection.classList.remove('hidden');
            this.updateFileList();
            
            // Enable convert button
            this.convertAllBtn.disabled = false;
            this.convertAllBtn.innerHTML = `
                <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7,10 12,15 17,10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Convert All to WebP
            `;
        } else {
            this.fileListSection.classList.add('hidden');
            
            // Disable convert button
            this.convertAllBtn.disabled = true;
            this.convertAllBtn.innerHTML = `
                <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7,10 12,15 17,10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Select Images to Enable Conversion
            `;
        }
    }

    updateFileList() {
        if (!this.fileList) return;
        
        this.fileList.innerHTML = '';
        this.filesToConvert.forEach((file, index) => {
            const fileCard = document.createElement('div');
            fileCard.className = 'file-card';
            fileCard.innerHTML = `
                <div class="file-header">
                    <div class="file-info">
                        <div class="file-name" title="${file.name}">${file.name}</div>
                        <div class="file-details">${this.formatBytes(file.size)} • ${file.type.split('/')[1].toUpperCase()}</div>
                    </div>
                    <div class="file-actions">
                        <button class="remove-file-btn" data-index="${index}" title="Remove file">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="progress-section">
                    <div class="progress-label">
                        <span class="progress-status" id="status-${index}">Ready to convert</span>
                        <span class="progress-percentage" id="percentage-${index}">0%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-${index}" style="width: 0%;"></div>
                    </div>
                </div>
                
                <div class="conversion-results" id="results-${index}" style="display: none;">
                    <div class="result-item">
                        <div class="result-label">Original Size</div>
                        <div class="result-value" id="original-size-${index}">${this.formatBytes(file.size)}</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">WebP Size</div>
                        <div class="result-value success" id="new-size-${index}">--</div>
                    </div>
                </div>
                
                <button class="download-button" id="download-${index}" data-index="${index}" disabled>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7,10 12,15 17,10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download WebP
                </button>
            `;
            this.fileList.appendChild(fileCard);
        });
    }

    async convertFiles() {
        if (this.filesToConvert.length === 0) {
            this.showMessage('Please select at least one file to convert.', 'error');
            return;
        }

        if (this.isProcessing) {
            this.showMessage('Conversion is already in progress.', 'warning');
            return;
        }

        this.isProcessing = true;
        this.convertAllBtn.disabled = true;
        this.downloadAllBtn.disabled = true;
        this.downloadAllBtn.classList.add('hidden');
        
        this.showMessage('Converting images to WebP... Please wait.', 'info');
        
        this.convertedBlobs = [];
        const quality = parseInt(this.qualitySlider.value) / 100;

        try {
            for (let i = 0; i < this.filesToConvert.length; i++) {
                await this.convertSingleFile(i, quality);
            }

            const successCount = this.convertedBlobs.length;
            this.showMessage(`Conversion complete! ${successCount} file(s) converted to WebP successfully.`, 'success');
            
            if (successCount > 0) {
                this.downloadAllBtn.classList.remove('hidden');
                this.downloadAllBtn.disabled = false;
            }
            
        } catch (error) {
            console.error('Conversion process failed:', error);
            this.showMessage(`Conversion failed: ${error.message}`, 'error');
        } finally {
            this.isProcessing = false;
            this.convertAllBtn.disabled = false;
        }
    }

    convertSingleFile(index, quality) {
        return new Promise((resolve, reject) => {
            const file = this.filesToConvert[index];
            const originalName = file.name.split('.').slice(0, -1).join('.');
            
            const progressBar = document.getElementById(`progress-${index}`);
            const statusText = document.getElementById(`status-${index}`);
            const percentageText = document.getElementById(`percentage-${index}`);
            const downloadButton = document.getElementById(`download-${index}`);
            const resultsSection = document.getElementById(`results-${index}`);
            const newSizeText = document.getElementById(`new-size-${index}`);

            if (!progressBar || !statusText || !downloadButton) {
                console.error('UI elements not found for index:', index);
                resolve();
                return;
            }

            statusText.textContent = "Converting to WebP...";
            progressBar.style.width = '50%';
            percentageText.textContent = '50%';

            const img = new Image();
            const reader = new FileReader();
            const originalSize = file.size;
            
            reader.onload = (e) => {
                img.onload = () => {
                    try {
                        // Set canvas dimensions
                        this.conversionCanvas.width = img.width;
                        this.conversionCanvas.height = img.height;
                        
                        // Enable high-quality rendering
                        this.ctx.imageSmoothingEnabled = true;
                        this.ctx.imageSmoothingQuality = 'high';
                        
                        // Draw image
                        this.ctx.drawImage(img, 0, 0);

                        // Always convert to WebP
                        const mimeType = 'image/webp';
                        const fileExtension = 'webp';

                        // Convert to blob
                        this.conversionCanvas.toBlob((blob) => {
                            if (blob) {
                                const convertedFileName = `${originalName}.${fileExtension}`;
                                const newSize = blob.size;
                                const sizeDifference = originalSize - newSize;
                                const percentageReduction = ((sizeDifference / originalSize) * 100).toFixed(1);

                                this.convertedBlobs.push({ 
                                    name: convertedFileName, 
                                    blob: blob, 
                                    originalIndex: index,
                                    originalSize: originalSize,
                                    newSize: newSize,
                                    reduction: percentageReduction
                                });
                                
                                progressBar.style.width = '100%';
                                percentageText.textContent = '100%';
                                statusText.textContent = `Complete`;
                                
                                // Show results
                                resultsSection.style.display = 'grid';
                                newSizeText.textContent = this.formatBytes(newSize);
                                
                                // Add size reduction indicator
                                const reduction = Math.abs(parseFloat(percentageReduction));
                                let reductionClass = 'moderate';
                                if (reduction > 50) reductionClass = 'excellent';
                                else if (reduction > 25) reductionClass = 'good';
                                
                                if (sizeDifference > 0) {
                                    newSizeText.innerHTML += ` <span class="size-reduction ${reductionClass}">-${percentageReduction}%</span>`;
                                } else {
                                    newSizeText.innerHTML += ` <span class="size-reduction moderate">+${Math.abs(percentageReduction)}%</span>`;
                                }
                                
                                downloadButton.disabled = false;
                                
                                resolve();
                            } else {
                                console.error('Canvas toBlob failed:', file.name);
                                statusText.textContent = `Error: Conversion failed.`;
                                reject(new Error(`Failed to convert ${file.name}.`));
                            }
                        }, mimeType, quality);
                    } catch (error) {
                        console.error('Canvas error:', error);
                        statusText.textContent = `Error: ${error.message}`;
                        reject(error);
                    }
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
        if (button.classList.contains('remove-file-btn')) {
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
        
        this.updateUI();
        
        if (this.filesToConvert.length === 0) {
            this.downloadAllBtn.classList.add('hidden');
            this.downloadAllBtn.disabled = true;
        } else {
            this.showMessage(`${this.filesToConvert.length} file(s) remaining.`, 'info');
        }
    }

    downloadFile(file) {
        try {
            const downloadUrl = URL.createObjectURL(file.blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
            this.showMessage(`Downloaded: ${file.name}`, 'success');
        } catch (error) {
            console.error('Download failed:', error);
            this.showMessage('Download failed. Please try again.', 'error');
        }
    }

    async downloadAllAsZip() {
        if (this.convertedBlobs.length === 0) {
            this.showMessage('No files ready for download.', 'error');
            return;
        }
        
        if (this.convertedBlobs.length === 1) {
            this.downloadFile(this.convertedBlobs[0]);
            return;
        }

        this.downloadAllBtn.disabled = true;
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
            a.download = 'webp_converted_images.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

            this.showMessage(`Downloaded ${this.convertedBlobs.length} WebP files as ZIP.`, 'success');
            
        } catch (error) {
            console.error('Zip generation failed:', error);
            this.showMessage('Zip generation failed. Please try again.', 'error');
        } finally {
            this.downloadAllBtn.disabled = false;
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showMessage(message, type = 'info') {
        if (!this.messageBox) return;
        
        this.messageBox.textContent = message;
        this.messageBox.className = `message-box show ${type}`;
        
        setTimeout(() => {
            this.messageBox.className = 'message-box';
        }, 4000);
    }
}

// Initialize the application
const webpConverter = new WebPConverter();

// Make it globally available for debugging
window.WebPConverter = webpConverter;