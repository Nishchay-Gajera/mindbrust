/**
 * Advanced Image Compressor with Multiple Compression Modes
 * Version 1.0.1 - Fixed recompression and bulk compression issues
 */

class ImageCompressor {
    constructor() {
        // DOM Elements
        this.uploadArea = null;
        this.fileInput = null;
        this.settingsSection = null;
        this.fileListSection = null;
        this.fileList = null;
        this.targetSizeInput = null;
        this.outputFormatSelect = null;
        this.compressAllBtn = null;
        this.downloadAllBtn = null;
        this.messageBox = null;
        this.canvas = null;
        this.ctx = null;
        this.compressionModeSelect = null;
        this.reductionPercentageInput = null;

        // State
        this.files = [];
        this.processedFiles = [];
        this.supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
        this.isProcessing = false;
        this.compressionMode = 'uniform'; // 'uniform' or 'proportional' or 'individual'

        console.log('ImageCompressor v1.0.1 initialized');
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

            // Initialize mobile menu
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
        console.log('Getting DOM elements...');
        
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('file-input');
        this.settingsSection = document.getElementById('settings-section');
        this.fileListSection = document.getElementById('file-list-section');
        this.fileList = document.getElementById('file-list');
        this.targetSizeInput = document.getElementById('target-size');
        this.outputFormatSelect = document.getElementById('output-format');
        this.compressAllBtn = document.getElementById('compress-all-btn');
        this.downloadAllBtn = document.getElementById('download-all-btn');
        this.messageBox = document.getElementById('message-box');
        this.canvas = document.getElementById('compression-canvas');
        this.compressionModeSelect = document.getElementById('compression-mode');
        this.reductionPercentageInput = document.getElementById('reduction-percentage');
        
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            console.log('Canvas context created:', !!this.ctx);
        } else {
            console.error('Canvas not found!');
        }
    }

    setupEventListeners() {
        // Compression mode change
        if (this.compressionModeSelect) {
            this.compressionModeSelect.addEventListener('change', (e) => {
                this.compressionMode = e.target.value;
                const targetSetting = document.getElementById('target-size-setting');
                const percentageSetting = document.getElementById('percentage-setting');
                const modeInfo = document.getElementById('mode-info');
                
                if (this.compressionMode === 'proportional') {
                    targetSetting.classList.add('hidden');
                    percentageSetting.classList.remove('hidden');
                    this.updateProportionalInfo();
                } else if (this.compressionMode === 'individual') {
                    targetSetting.classList.add('hidden');
                    percentageSetting.classList.add('hidden');
                    this.showIndividualModeInfo();
                } else {
                    targetSetting.classList.remove('hidden');
                    percentageSetting.classList.add('hidden');
                    modeInfo.classList.add('hidden');
                    this.updateRecommendedSize();
                }

                // Reset all file statuses to allow recompression
                this.resetFileStatuses();
            });
        }

        // Target size change - reset file statuses
        if (this.targetSizeInput) {
            this.targetSizeInput.addEventListener('change', () => {
                this.resetFileStatuses();
            });
        }

        // Percentage change - reset file statuses
        if (this.reductionPercentageInput) {
            this.reductionPercentageInput.addEventListener('change', () => {
                this.resetFileStatuses();
                if (this.compressionMode === 'proportional') {
                    this.updateProportionalInfo();
                }
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
        if (this.compressAllBtn) {
            this.compressAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Compress button clicked, files count:', this.files.length);
                this.compressAllFiles();
            });
        }

        if (this.downloadAllBtn) {
            this.downloadAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.downloadAllFiles();
            });
        }

        // File list delegation for dynamic content
        if (this.fileList) {
            this.fileList.addEventListener('click', (e) => this.handleFileAction(e));
        }
    }

    resetFileStatuses() {
        // Reset all file statuses to allow recompression
        this.files.forEach(file => {
            if (file.status === 'completed') {
                file.status = 'pending';
                file.progress = 0;
            }
        });
        
        // Update UI to reflect reset
        if (this.files.length > 0) {
            this.renderFileList();
            this.compressAllBtn.disabled = false;
            this.compressAllBtn.innerHTML = `
                <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="16,12 12,8 8,12"></polyline>
                    <line x1="12" y1="16" x2="12" y2="8"></line>
                </svg>
                Compress All Images
            `;
        }
    }

    showIndividualModeInfo() {
        const modeInfo = document.getElementById('mode-info');
        if (!modeInfo) return;
        
        modeInfo.classList.remove('hidden');
        modeInfo.innerHTML = `
            <div class="mode-info-content">
                <svg class="mode-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                </svg>
                <div class="mode-info-text">
                    <strong>Smart Individual Compression</strong>
                    <br><small>Each image will be compressed to an optimal size based on its original dimensions and file size.</small>
                </div>
            </div>
        `;
    }

    updateProportionalInfo() {
        const modeInfo = document.getElementById('mode-info');
        if (!modeInfo || this.files.length === 0) return;

        const percentage = parseInt(this.reductionPercentageInput.value);
        let totalOriginalSize = 0;
        this.files.forEach(file => {
            totalOriginalSize += file.originalSize;
        });
        
        const avgSize = Math.round(totalOriginalSize / this.files.length / 1024);
        const expectedSize = Math.round(avgSize * (1 - percentage / 100));

        modeInfo.classList.remove('hidden');
        modeInfo.innerHTML = `
            <div class="mode-info-content">
                <svg class="mode-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <point cx="12" cy="17" rx="0.01" ry="0.01"></point>
                </svg>
                <div class="mode-info-text">
                    <strong>Proportional Reduction:</strong> ${percentage}% smaller
                    <br><small>Average: ${avgSize}KB → ~${expectedSize}KB per image</small>
                </div>
            </div>
        `;
    }

    setupFAQ() {
        const faqItems = document.querySelectorAll('.faq-item');
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            
            if (question && answer) {
                question.addEventListener('click', () => {
                    const isOpen = item.classList.contains('open');
                    
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
    }

    handleFiles(files) {
        console.log('handleFiles called with:', files.length, 'files');
        
        const fileArray = Array.from(files);
        const validFiles = fileArray.filter(file => {
            console.log('Checking file:', file.name, 'Type:', file.type);
            return this.supportedFormats.includes(file.type);
        });
        const invalidFiles = fileArray.filter(file => !this.supportedFormats.includes(file.type));

        console.log('Valid files:', validFiles.length, 'Invalid files:', invalidFiles.length);

        if (invalidFiles.length > 0) {
            const invalidNames = invalidFiles.map(f => f.name).join(', ');
            this.showMessage(`${invalidFiles.length} file(s) skipped (${invalidNames}). Only JPG, PNG, WEBP, and AVIF formats are supported.`, 'warning');
        }

        if (validFiles.length === 0) {
            this.showMessage('No valid image files selected.', 'error');
            return;
        }

        // Add new files to existing ones
        const newFiles = validFiles.map(file => ({
            id: Date.now() + Math.random(),
            file: file,
            originalSize: file.size,
            status: 'pending',
            progress: 0,
            compressedBlob: null,
            compressedSize: 0,
            compressionRatio: 0,
            individualTargetSize: null
        }));

        this.files = [...this.files, ...newFiles];
        console.log('Total files after adding:', this.files.length);
        
        this.updateUI();
        this.showMessage(`${validFiles.length} file(s) added successfully.`, 'success');
    }

    updateUI() {
        this.settingsSection.classList.remove('hidden');
        
        if (this.files.length > 0) {
            this.fileListSection.classList.remove('hidden');
            this.renderFileList();
            
            // Update info based on mode
            if (this.compressionMode === 'proportional') {
                this.updateProportionalInfo();
            } else if (this.compressionMode === 'individual') {
                this.showIndividualModeInfo();
            } else {
                this.updateRecommendedSize();
            }
            
            // Enable compress button
            this.compressAllBtn.disabled = false;
            this.compressAllBtn.innerHTML = `
                <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="16,12 12,8 8,12"></polyline>
                    <line x1="12" y1="16" x2="12" y2="8"></line>
                </svg>
                Compress All Images
            `;
        } else {
            this.fileListSection.classList.add('hidden');
            this.compressAllBtn.disabled = true;
            this.compressAllBtn.innerHTML = `
                <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="16,12 12,8 8,12"></polyline>
                    <line x1="12" y1="16" x2="12" y2="8"></line>
                </svg>
                Select Images to Enable Compression
            `;
        }
    }

    updateRecommendedSize() {
        if (this.files.length === 0) return;
        
        let totalOriginalSize = 0;
        this.files.forEach(file => {
            totalOriginalSize += file.originalSize;
        });
        
        const averageSize = totalOriginalSize / this.files.length;
        let recommendedSize = Math.round((averageSize * 0.65) / 1024);
        
        if (recommendedSize < 20) recommendedSize = 20;
        if (recommendedSize > 500) recommendedSize = Math.round(averageSize * 0.8 / 1024);
        
        this.targetSizeInput.value = recommendedSize;
        this.targetSizeInput.placeholder = `Recommended: ${recommendedSize}KB`;
        
        this.showRecommendation(recommendedSize, Math.round(averageSize / 1024));
    }

    showRecommendation(recommendedKB, averageKB) {
        let recommendationDiv = document.querySelector('#target-size-setting .size-recommendation');
        
        if (!recommendationDiv) {
            recommendationDiv = document.createElement('div');
            recommendationDiv.className = 'size-recommendation';
            const inputGroup = this.targetSizeInput.closest('.setting-item');
            inputGroup.appendChild(recommendationDiv);
        }
        
        recommendationDiv.innerHTML = `
            <div class="recommendation-content">
                <svg class="recommendation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <point cx="12" cy="17" rx="0.01" ry="0.01"></point>
                </svg>
                <div class="recommendation-text">
                    <strong>Recommended:</strong> ${recommendedKB}KB (Average original: ${averageKB}KB)
                    <br><small>This size preserves quality while reducing file size significantly.</small>
                </div>
            </div>
        `;
    }

    calculateIndividualTargetSize(file) {
        const originalSizeKB = file.originalSize / 1024;
        let targetSizeKB;

        if (originalSizeKB < 50) {
            targetSizeKB = Math.round(originalSizeKB * 0.85);
        } else if (originalSizeKB < 200) {
            targetSizeKB = Math.round(originalSizeKB * 0.65);
        } else if (originalSizeKB < 500) {
            targetSizeKB = Math.round(originalSizeKB * 0.55);
        } else if (originalSizeKB < 1000) {
            targetSizeKB = Math.round(originalSizeKB * 0.45);
        } else if (originalSizeKB < 3000) {
            targetSizeKB = Math.round(originalSizeKB * 0.35);
        } else {
            targetSizeKB = Math.round(originalSizeKB * 0.25);
            targetSizeKB = Math.max(targetSizeKB, 500);
        }

        targetSizeKB = Math.max(targetSizeKB, 10);
        return targetSizeKB * 1024;
    }

    renderFileList() {
        if (!this.fileList) return;

        this.fileList.innerHTML = '';
        
        this.files.forEach(fileData => {
            const fileCard = this.createFileCard(fileData);
            this.fileList.appendChild(fileCard);
        });
    }

    createFileCard(fileData) {
        const card = document.createElement('div');
        card.className = `file-card ${fileData.status}`;
        card.dataset.fileId = fileData.id;

        const statusText = this.getStatusText(fileData);
        const progressWidth = fileData.progress || 0;

        let targetSizeDisplay = '';
        if (this.compressionMode === 'individual' && fileData.individualTargetSize) {
            targetSizeDisplay = `<span class="target-size-badge">Target: ${this.formatBytes(fileData.individualTargetSize)}</span>`;
        }

        card.innerHTML = `
            <div class="file-header">
                <div class="file-info">
                    <div class="file-name" title="${fileData.file.name}">${fileData.file.name}</div>
                    <div class="file-details">
                        ${this.formatBytes(fileData.originalSize)} ${targetSizeDisplay}
                    </div>
                </div>
                <div class="file-actions">
                    <button class="remove-file-btn" data-action="remove" data-file-id="${fileData.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
                          <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="progress-section">
                <div class="progress-label">
                    <span class="progress-status">${statusText}</span>
                    <span class="progress-percentage">${progressWidth}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressWidth}%"></div>
                </div>
            </div>
            ${fileData.status === 'completed' ? `
                <div class="compression-results">
                    <div class="result-item">
                        <div class="result-label">Original Size</div>
                        <div class="result-value">${this.formatBytes(fileData.originalSize)}</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Compressed Size</div>
                        <div class="result-value success">${this.formatBytes(fileData.compressedSize)}</div>
                    </div>
                </div>
                <button class="download-button" data-action="download" data-file-id="${fileData.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7,10 12,15 17,10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download
                </button>
            ` : ''}
        `;

        return card;
    }

    getStatusText(fileData) {
        switch (fileData.status) {
            case 'pending': return 'Ready to compress';
            case 'processing': return 'Compressing...';
            case 'completed': return 'Completed';
            case 'error': return 'Error occurred';
            default: return 'Unknown';
        }
    }

    getQualityClass(ratio) {
        if (ratio >= 50) return 'excellent';
        if (ratio >= 25) return 'good';
        return 'fair';
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async compressAllFiles() {
        if (this.files.length === 0) {
            this.showMessage('Please select files first.', 'error');
            return;
        }

        if (this.isProcessing) {
            this.showMessage('Compression is already in progress.', 'warning');
            return;
        }

        let targetSize = null;
        let reductionPercentage = null;

        // Get compression parameters based on mode
        if (this.compressionMode === 'uniform') {
            targetSize = parseInt(this.targetSizeInput.value) * 1024;
            if (targetSize <= 0) {
                this.showMessage('Please enter a valid target size.', 'error');
                return;
            }

            // Check for mixed file sizes
            const sizes = this.files.map(f => f.originalSize);
            const maxSize = Math.max(...sizes);
            const minSize = Math.min(...sizes);
            const sizeRatio = maxSize / minSize;

            if (sizeRatio > 10 && this.files.length > 1) {
                const message = `Your files have very different sizes (${this.formatBytes(minSize)} to ${this.formatBytes(maxSize)}). Individual mode is recommended for better results.`;
                this.showMessage(message, 'warning');
                
                if (confirm('Would you like to switch to Individual compression mode for better results?')) {
                    this.compressionModeSelect.value = 'individual';
                    this.compressionMode = 'individual';
                    document.getElementById('target-size-setting').classList.add('hidden');
                    document.getElementById('percentage-setting').classList.add('hidden');
                    this.showIndividualModeInfo();
                    return;
                }
            }
        } else if (this.compressionMode === 'proportional') {
            reductionPercentage = parseInt(this.reductionPercentageInput.value);
            if (reductionPercentage <= 0 || reductionPercentage > 90) {
                this.showMessage('Please enter a valid reduction percentage (10-90%).', 'error');
                return;
            }
        }

        this.isProcessing = true;
        this.compressAllBtn.disabled = true;
        this.compressAllBtn.innerHTML = `
            <div class="loading-spinner"></div>
            Processing...
        `;

        let completedCount = 0;
        const totalFiles = this.files.length;

        try {
            for (const fileData of this.files) {
                // Calculate target size based on mode
                let fileTargetSize;
                if (this.compressionMode === 'uniform') {
                    fileTargetSize = targetSize;
                } else if (this.compressionMode === 'proportional') {
                    fileTargetSize = Math.round(fileData.originalSize * (1 - reductionPercentage / 100));
                } else if (this.compressionMode === 'individual') {
                    fileTargetSize = this.calculateIndividualTargetSize(fileData);
                    fileData.individualTargetSize = fileTargetSize;
                }

                await this.compressFile(fileData, fileTargetSize);
                completedCount++;
                this.updateProgress(completedCount, totalFiles);
            }

            const successCount = this.files.filter(f => f.status === 'completed').length;
            this.showMessage(`Compression complete! ${successCount}/${totalFiles} files processed successfully.`, 'success');
            
            if (successCount > 0) {
                this.downloadAllBtn.classList.remove('hidden');
            }

        } catch (error) {
            console.error('Compression failed:', error);
            this.showMessage('An error occurred during compression.', 'error');
        } finally {
            this.isProcessing = false;
            this.compressAllBtn.disabled = false;
            this.compressAllBtn.innerHTML = `
                <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="16,12 12,8 8,12"></polyline>
                    <line x1="12" y1="16" x2="12" y2="8"></line>
                </svg>
                Compress All Images
            `;
        }
    }

    async compressFile(fileData, targetSize) {
        // Reset status for recompression
        fileData.status = 'processing';
        fileData.progress = 0;
        fileData.compressedBlob = null;
        fileData.compressedSize = 0;
        fileData.compressionRatio = 0;
        
        this.renderFileList();

        try {
            const modeInfo = this.compressionMode === 'individual' 
                ? `Individual: ${Math.round(targetSize/1024)}KB`
                : this.compressionMode === 'proportional'
                ? `Proportional: ${Math.round((1 - targetSize/fileData.originalSize)*100)}% reduction`
                : `Uniform: ${Math.round(targetSize/1024)}KB`;
            
            console.log(`Compressing ${fileData.file.name} - ${modeInfo}`);
            
            const result = await this.performCompression(fileData.file, targetSize);
            
            fileData.compressedBlob = result.blob;
            fileData.compressedSize = result.blob.size;
            fileData.compressionRatio = Math.round(((fileData.originalSize - fileData.compressedSize) / fileData.originalSize) * 100);
            fileData.status = 'completed';
            fileData.progress = 100;

        } catch (error) {
            console.error('File compression failed:', error);
            fileData.status = 'error';
            fileData.progress = 0;
        }

        this.renderFileList();
    }

    async performCompression(file, targetSize) {
        console.log(`Starting compression for ${file.name}: ${Math.round(file.size/1024)}KB → ${Math.round(targetSize/1024)}KB`);
        
        try {
            // First try with the professional library
            let result = await this.tryProfessionalCompression(file, targetSize);
            
            // If the result is not close enough to target, use iterative approach
            if (Math.abs(result.blob.size - targetSize) > targetSize * 0.1) {
                console.log(`Professional library result (${Math.round(result.blob.size/1024)}KB) too far from target, using iterative approach...`);
                result = await this.iterativeCompression(file, targetSize);
            }
            
            return result;
            
        } catch (error) {
            console.error('Compression failed, using fallback:', error);
            return this.fallbackCanvasCompression(file, targetSize);
        }
    }

    async tryProfessionalCompression(file, targetSize) {
        const targetSizeMB = targetSize / (1024 * 1024);
        const outputFormat = this.getOptimalFormat(file.type, targetSize, file.size);
        
        const options = {
            maxSizeMB: targetSizeMB,
            maxWidthOrHeight: 4096,
            useWebWorker: false,
            fileType: outputFormat,
            initialQuality: this.getInitialQuality(targetSize, file.size),
            alwaysKeepResolution: false,
            preserveExif: false
        };

        const compressedFile = await imageCompression(file, options);
        console.log(`Professional compression result: ${Math.round(compressedFile.size/1024)}KB`);
        
        return { blob: compressedFile };
    }

    async iterativeCompression(file, targetSize) {
        console.log('Using iterative compression for precise targeting...');
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = async () => {
                    try {
                        const result = await this.preciseTargetCompression(img, file, targetSize);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    async preciseTargetCompression(img, originalFile, targetSize) {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        const mimeType = this.getOptimalFormat(originalFile.type, targetSize, originalFile.size);
        const tolerance = targetSize * 0.05;

        let minQuality = 0.05;
        let maxQuality = 0.95;
        let bestBlob = null;
        let bestDifference = Infinity;
        let iterations = 0;
        const maxIterations = 15;

        console.log(`Targeting ${Math.round(targetSize/1024)}KB with ${Math.round(tolerance/1024)}KB tolerance`);

        while (iterations < maxIterations && Math.abs(maxQuality - minQuality) > 0.02) {
            const currentQuality = (minQuality + maxQuality) / 2;
            
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            
            const dataURL = this.canvas.toDataURL(mimeType, currentQuality);
            const blob = this.dataURLToBlob(dataURL);
            
            const difference = Math.abs(blob.size - targetSize);
            
            if (difference < bestDifference) {
                bestDifference = difference;
                bestBlob = blob;
            }
            
            if (difference <= tolerance) {
                console.log(`✓ Hit target within tolerance! ${Math.round(blob.size/1024)}KB`);
                return { blob: blob };
            }
            
            if (blob.size > targetSize) {
                maxQuality = currentQuality;
            } else {
                minQuality = currentQuality;
            }
            
            iterations++;
        }

        if (bestDifference > targetSize * 0.15) {
            console.log('Quality adjustment insufficient, trying resize approach...');
            const resizeResult = await this.preciseResizeCompression(img, originalFile, targetSize, mimeType);
            if (resizeResult && Math.abs(resizeResult.blob.size - targetSize) < bestDifference) {
                return resizeResult;
            }
        }

        console.log(`Best result: ${Math.round(bestBlob.size/1024)}KB`);
        return { blob: bestBlob };
    }

    async preciseResizeCompression(img, originalFile, targetSize, mimeType) {
        const tolerance = targetSize * 0.05;
        const compressionRatio = targetSize / originalFile.size;
        let currentScale = Math.sqrt(compressionRatio);
        currentScale = Math.max(0.2, Math.min(1.0, currentScale));
        
        let bestBlob = null;
        let bestDifference = Infinity;
        
        const scaleVariations = [-0.1, 0, 0.05, 0.1, 0.15, 0.2, -0.05, -0.15];
        
        for (const variation of scaleVariations) {
            const scale = Math.max(0.2, Math.min(1.0, currentScale + variation));
            const newWidth = Math.floor(img.width * scale);
            const newHeight = Math.floor(img.height * scale);
            
            if (newWidth < 100 || newHeight < 100) continue;
            
            const resizeCanvas = document.createElement('canvas');
            const resizeCtx = resizeCanvas.getContext('2d');
            resizeCanvas.width = newWidth;
            resizeCanvas.height = newHeight;
            resizeCtx.imageSmoothingEnabled = true;
            resizeCtx.imageSmoothingQuality = 'high';
            resizeCtx.drawImage(img, 0, 0, newWidth, newHeight);
            
            const qualities = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4];
            
            for (const quality of qualities) {
                const dataURL = resizeCanvas.toDataURL(mimeType, quality);
                const blob = this.dataURLToBlob(dataURL);
                const difference = Math.abs(blob.size - targetSize);
                
                if (difference < bestDifference) {
                    bestDifference = difference;
                    bestBlob = blob;
                }
                
                if (difference <= tolerance) {
                    console.log(`✓ Resize hit target! Scale: ${Math.round(scale*100)}%, Quality: ${Math.round(quality*100)}% = ${Math.round(blob.size/1024)}KB`);
                    return { blob: blob };
                }
            }
        }
        
        return bestBlob ? { blob: bestBlob } : null;
    }

    async fallbackCanvasCompression(file, targetSize) {
        console.log('Using fallback canvas compression...');
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    try {
                        this.canvas.width = img.width;
                        this.canvas.height = img.height;

                        const mimeType = this.getOptimalFormat(file.type, targetSize, file.size);
                        this.ctx.imageSmoothingEnabled = true;
                        this.ctx.imageSmoothingQuality = 'high';

                        const qualities = [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
                        
                        for (const quality of qualities) {
                            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                            this.ctx.drawImage(img, 0, 0);
                            
                            const dataURL = this.canvas.toDataURL(mimeType, quality);
                            const blob = this.dataURLToBlob(dataURL);

                            if (blob.size <= targetSize) {
                                console.log(`Fallback success with quality ${Math.round(quality*100)}%: ${Math.round(blob.size/1024)}KB`);
                                resolve({ blob: blob });
                                return;
                            }
                        }

                        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                        this.ctx.drawImage(img, 0, 0);
                        const dataURL = this.canvas.toDataURL(mimeType, 0.1);
                        resolve({ blob: this.dataURLToBlob(dataURL) });
                        
                    } catch (error) {
                        reject(error);
                    }
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    getOptimalFormat(originalType, targetSize, originalSize) {
        const compressionRatio = targetSize / originalSize;
        const outputFormat = this.outputFormatSelect ? this.outputFormatSelect.value : 'same';
        
        if (outputFormat !== 'same') {
            return outputFormat === 'jpeg' ? 'image/jpeg' : `image/${outputFormat}`;
        }
        
        if (originalType === 'image/png' && compressionRatio < 0.8) {
            return 'image/jpeg';
        }
        
        if (originalType === 'image/jpeg' || originalType === 'image/jpg') {
            return 'image/jpeg';
        }
        
        if (originalType === 'image/webp') {
            return 'image/webp';
        }
        
        return 'image/jpeg';
    }

    getInitialQuality(targetSize, originalSize) {
        const compressionRatio = targetSize / originalSize;
        
        if (compressionRatio > 0.8) return 0.9;
        if (compressionRatio > 0.6) return 0.8;
        if (compressionRatio > 0.4) return 0.7;
        if (compressionRatio > 0.2) return 0.6;
        return 0.4;
    }

    dataURLToBlob(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        return new Blob([u8arr], { type: mime });
    }

    updateProgress(completed, total) {
        const percentage = Math.round((completed / total) * 100);
        // Global progress can be added here if needed
    }

    handleFileAction(e) {
        const button = e.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const fileId = parseFloat(button.dataset.fileId);
        const fileData = this.files.find(f => f.id === fileId);

        if (!fileData) {
            console.error('File not found:', fileId);
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        switch (action) {
            case 'remove':
                this.removeFile(fileId);
                break;
            case 'download':
                this.downloadFile(fileData);
                break;
        }
    }

    removeFile(fileId) {
        this.files = this.files.filter(f => f.id !== fileId);
        this.updateUI();
        this.showMessage('File removed.', 'info');
        
        if (this.files.length === 0) {
            this.downloadAllBtn.classList.add('hidden');
        }
    }

    downloadFile(fileData) {
        if (!fileData.compressedBlob) {
            this.showMessage('File is not ready for download.', 'error');
            return;
        }

        const url = URL.createObjectURL(fileData.compressedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.getDownloadFileName(fileData);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showMessage(`Downloaded: ${fileData.file.name}`, 'success');
    }

    getDownloadFileName(fileData) {
        const originalName = fileData.file.name;
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
        const outputFormat = this.outputFormatSelect.value;
        const extension = outputFormat === 'same' 
            ? originalName.substring(originalName.lastIndexOf('.') + 1)
            : outputFormat;
        return `${nameWithoutExt}_compressed.${extension}`;
    }

    async downloadAllFiles() {
        const completedFiles = this.files.filter(f => f.status === 'completed' && f.compressedBlob);
        
        if (completedFiles.length === 0) {
            this.showMessage('No files ready for download.', 'error');
            return;
        }

        if (completedFiles.length === 1) {
            this.downloadFile(completedFiles[0]);
            return;
        }

        try {
            const zip = new JSZip();
            
            completedFiles.forEach(fileData => {
                const fileName = this.getDownloadFileName(fileData);
                zip.file(fileName, fileData.compressedBlob);
            });

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'compressed_images.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showMessage(`Downloaded ${completedFiles.length} files as ZIP.`, 'success');

        } catch (error) {
            console.error('ZIP creation failed:', error);
            this.showMessage('Failed to create ZIP file.', 'error');
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
}

// Initialize the compressor
const imageCompressor = new ImageCompressor();

// Make it globally available for debugging
window.ImageCompressor = imageCompressor;