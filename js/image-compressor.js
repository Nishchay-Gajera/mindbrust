/**
 * Advanced Image Compressor
 * Handles client-side image compression to target file sizes
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

        // State
        this.files = [];
        this.processedFiles = [];
        this.supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
        this.isProcessing = false;

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
        
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
        }
    }

    setupEventListeners() {
        // File input change
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        }

        // Drag and drop
        if (this.uploadArea) {
            this.uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.uploadArea.classList.add('dragover');
            });

            this.uploadArea.addEventListener('dragleave', () => {
                this.uploadArea.classList.remove('dragover');
            });

            this.uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                this.uploadArea.classList.remove('dragover');
                this.handleFiles(e.dataTransfer.files);
            });
        }

        // Buttons
        if (this.compressAllBtn) {
            this.compressAllBtn.addEventListener('click', () => this.compressAllFiles());
        }

        if (this.downloadAllBtn) {
            this.downloadAllBtn.addEventListener('click', () => this.downloadAllFiles());
        }

        // File list delegation
        if (this.fileList) {
            this.fileList.addEventListener('click', (e) => this.handleFileAction(e));
        }
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
        const fileArray = Array.from(files);
        const validFiles = fileArray.filter(file => this.supportedFormats.includes(file.type));
        const invalidFiles = fileArray.filter(file => !this.supportedFormats.includes(file.type));

        if (invalidFiles.length > 0) {
            this.showMessage(`${invalidFiles.length} file(s) skipped. Only JPG, PNG, WEBP, and AVIF formats are supported.`, 'warning');
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
            compressionRatio: 0
        }));

        this.files = [...this.files, ...newFiles];
        this.updateUI();
        this.showMessage(`${validFiles.length} file(s) added successfully.`, 'success');
    }

    updateUI() {
        if (this.files.length > 0) {
            this.settingsSection.classList.remove('hidden');
            this.fileListSection.classList.remove('hidden');
            this.renderFileList();
        } else {
            this.settingsSection.classList.add('hidden');
            this.fileListSection.classList.add('hidden');
        }
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
        const compressionRatio = fileData.compressionRatio || 0;
        const qualityClass = this.getQualityClass(compressionRatio);

        card.innerHTML = `
            <div class="file-header">
                <div class="file-info">
                    <div class="file-name">${fileData.file.name}</div>
                    <div class="file-details">
                        ${this.formatBytes(fileData.originalSize)} 
                        ${fileData.compressedSize > 0 ? `→ ${this.formatBytes(fileData.compressedSize)}` : ''}
                        ${compressionRatio > 0 ? `<span class="quality-indicator ${qualityClass}">${compressionRatio}% reduction</span>` : ''}
                    </div>
                </div>
                <div class="file-actions">
                    <button class="remove-file-btn" data-action="remove">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="progress-section">
                <div class="progress-label">
                    <span class="progress-status">${statusText}</span>
                    <span class="progress-percentage">${Math.round(progressWidth)}%</span>
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
                <button class="download-button" data-action="download">
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

        const targetSize = parseInt(this.targetSizeInput.value) * 1024; // Convert KB to bytes
        if (targetSize <= 0) {
            this.showMessage('Please enter a valid target size.', 'error');
            return;
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
                if (fileData.status !== 'completed') {
                    await this.compressFile(fileData, targetSize);
                }
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
        fileData.status = 'processing';
        fileData.progress = 0;
        this.renderFileList();

        try {
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
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    try {
                        const result = this.compressToTargetSize(img, file, targetSize);
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

    compressToTargetSize(img, originalFile, targetSize) {
        // Set canvas dimensions
        this.canvas.width = img.width;
        this.canvas.height = img.height;

        // Determine output format
        const outputFormat = this.getOutputFormat(originalFile.type);
        const mimeType = this.getMimeType(outputFormat);

        // Binary search for optimal quality
        let minQuality = 0.1;
        let maxQuality = 1.0;
        let bestBlob = null;
        let iterations = 0;
        const maxIterations = 15;

        while (iterations < maxIterations && Math.abs(maxQuality - minQuality) > 0.01) {
            const quality = (minQuality + maxQuality) / 2;
            
            // Draw image
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);

            // Convert to blob synchronously for size check
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.canvas.width;
            tempCanvas.height = this.canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.putImageData(imageData, 0, 0);

            // Create blob with current quality
            const dataURL = tempCanvas.toDataURL(mimeType, quality);
            const blob = this.dataURLToBlob(dataURL);

            if (blob.size <= targetSize || quality <= minQuality + 0.01) {
                bestBlob = blob;
                if (blob.size <= targetSize) {
                    minQuality = quality;
                } else {
                    break;
                }
            } else {
                maxQuality = quality;
            }

            iterations++;
        }

        // If we couldn't get small enough, try resizing
        if (!bestBlob || bestBlob.size > targetSize) {
            return this.compressWithResize(img, originalFile, targetSize, mimeType);
        }

        return { blob: bestBlob };
    }

    compressWithResize(img, originalFile, targetSize, mimeType) {
        let scale = 1.0;
        const minScale = 0.1;
        let bestBlob = null;

        while (scale >= minScale) {
            const newWidth = Math.floor(img.width * scale);
            const newHeight = Math.floor(img.height * scale);

            this.canvas.width = newWidth;
            this.canvas.height = newHeight;
            this.ctx.clearRect(0, 0, newWidth, newHeight);
            this.ctx.drawImage(img, 0, 0, newWidth, newHeight);

            // Try different qualities for this size
            const qualities = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
            
            for (const quality of qualities) {
                const dataURL = this.canvas.toDataURL(mimeType, quality);
                const blob = this.dataURLToBlob(dataURL);

                if (blob.size <= targetSize) {
                    bestBlob = blob;
                    break;
                }
            }

            if (bestBlob) break;
            scale -= 0.1;
        }

        // If still too large, return the smallest we could achieve
        if (!bestBlob) {
            const dataURL = this.canvas.toDataURL(mimeType, 0.1);
            bestBlob = this.dataURLToBlob(dataURL);
        }

        return { blob: bestBlob };
    }

    getOutputFormat(originalType) {
        const format = this.outputFormatSelect.value;
        if (format === 'same') {
            return originalType.split('/')[1];
        }
        return format;
    }

    getMimeType(format) {
        const mimeTypes = {
            'jpeg': 'image/jpeg',
            'jpg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp'
        };
        return mimeTypes[format] || 'image/jpeg';
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
        // You can add a global progress indicator here if needed
    }

    handleFileAction(e) {
        const button = e.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        const fileCard = button.closest('.file-card');
        const fileId = parseInt(fileCard.dataset.fileId);
        const fileData = this.files.find(f => f.id === fileId);

        if (!fileData) return;

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
        const outputFormat = this.getOutputFormat(fileData.file.type);
        return `${nameWithoutExt}_compressed.${outputFormat}`;
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