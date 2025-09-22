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

        console.log('ImageCompressor initialized'); // Debug log
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
        console.log('Getting DOM elements...'); // Debug log
        
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
        
        // Debug logs to check if elements are found
        console.log('Upload area found:', !!this.uploadArea);
        console.log('File input found:', !!this.fileInput);
        console.log('Compress button found:', !!this.compressAllBtn);
        console.log('Settings section found:', !!this.settingsSection);
        
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            console.log('Canvas context created:', !!this.ctx);
        } else {
            console.error('Canvas not found!');
        }
    }

    setupEventListeners() {
        // File input change
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => {
                console.log('File input change event triggered'); // Debug log
                if (e.target.files && e.target.files.length > 0) {
                    this.handleFiles(e.target.files);
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
                this.uploadArea.classList.remove('dragover');
                console.log('Drop event triggered'); // Debug log
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    this.handleFiles(e.dataTransfer.files);
                }
            });

            // Click to upload
            this.uploadArea.addEventListener('click', (e) => {
                console.log('Upload area clicked'); // Debug log
                if (this.fileInput) {
                    this.fileInput.click();
                }
            });
        }

        // Buttons
        if (this.compressAllBtn) {
            this.compressAllBtn.addEventListener('click', () => {
                console.log('Compress button clicked, files count:', this.files.length); // Debug log
                this.compressAllFiles();
            });
        }

        if (this.downloadAllBtn) {
            this.downloadAllBtn.addEventListener('click', () => this.downloadAllFiles());
        }

        // File list delegation for dynamic content
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
        console.log('handleFiles called with:', files.length, 'files'); // Debug log
        
        const fileArray = Array.from(files);
        const validFiles = fileArray.filter(file => {
            console.log('Checking file:', file.name, 'Type:', file.type); // Debug log
            return this.supportedFormats.includes(file.type);
        });
        const invalidFiles = fileArray.filter(file => !this.supportedFormats.includes(file.type));

        console.log('Valid files:', validFiles.length, 'Invalid files:', invalidFiles.length); // Debug log

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
            compressionRatio: 0
        }));

        this.files = [...this.files, ...newFiles];
        console.log('Total files after adding:', this.files.length); // Debug log
        
        this.updateUI();
        this.showMessage(`${validFiles.length} file(s) added successfully.`, 'success');
    }

    updateUI() {
        // Settings section is always visible now
        this.settingsSection.classList.remove('hidden');
        
        if (this.files.length > 0) {
            this.fileListSection.classList.remove('hidden');
            this.renderFileList();
            this.updateRecommendedSize();
            // Enable compress button when files are uploaded
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
            // Disable compress button when no files
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
        
        // Calculate recommended compression size based on uploaded files
        let totalOriginalSize = 0;
        let averageSize = 0;
        
        this.files.forEach(file => {
            totalOriginalSize += file.originalSize;
        });
        
        averageSize = totalOriginalSize / this.files.length;
        
        // Calculate recommended size (compress to 60-70% of average for quality preservation)
        let recommendedSize = Math.round((averageSize * 0.65) / 1024); // Convert to KB
        
        // Set minimum recommended size based on image complexity
        if (recommendedSize < 20) recommendedSize = 20;
        if (recommendedSize > 500) recommendedSize = Math.round(averageSize * 0.8 / 1024);
        
        // Update the input with recommended value
        this.targetSizeInput.value = recommendedSize;
        this.targetSizeInput.placeholder = `Recommended: ${recommendedSize}KB`;
        
        // Show recommendation message
        this.showRecommendation(recommendedSize, Math.round(averageSize / 1024));
    }

    showRecommendation(recommendedKB, averageKB) {
        // Create or update recommendation message
        let recommendationDiv = document.getElementById('size-recommendation');
        
        if (!recommendationDiv) {
            recommendationDiv = document.createElement('div');
            recommendationDiv.id = 'size-recommendation';
            recommendationDiv.className = 'size-recommendation';
            
            // Insert after the target size input group
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
                    <div class="file-name" title="${fileData.file.name}">${fileData.file.name}</div>
                    <div class="file-details">
                        ${this.formatBytes(fileData.originalSize)} 
                        ${fileData.compressedSize > 0 ? `→ ${this.formatBytes(fileData.compressedSize)}` : ''}
                        ${compressionRatio > 0 ? `<span class="quality-indicator ${qualityClass}">${compressionRatio}% reduction</span>` : ''}
                    </div>
                </div>
                <div class="file-actions">
                    <button class="remove-file-btn" data-action="remove" data-file-id="${fileData.id}" title="Remove file">
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

        const targetSize = parseInt(this.targetSizeInput.value) * 1024; // Convert KB to bytes
        if (targetSize <= 0) {
            this.showMessage('Please enter a valid target size.', 'error');
            return;
        }

        // Validate logical compression for each file
        const invalidFiles = [];
        this.files.forEach(file => {
            const compressionRatio = targetSize / file.originalSize;
            // If trying to compress to more than 98% of original size, it's not very logical
            if (compressionRatio > 0.98) {
                invalidFiles.push({
                    name: file.file.name,
                    originalKB: Math.round(file.originalSize / 1024),
                    targetKB: Math.round(targetSize / 1024),
                    issue: 'too_large'
                });
            }
            // If trying to compress to less than 5% of original size, warn about potential quality issues
            else if (compressionRatio < 0.05) {
                invalidFiles.push({
                    name: file.file.name,
                    originalKB: Math.round(file.originalSize / 1024),
                    targetKB: Math.round(targetSize / 1024),
                    issue: 'very_aggressive'
                });
            }
        });

        if (invalidFiles.length > 0) {
            const tooLarge = invalidFiles.filter(f => f.issue === 'too_large');
            const veryAggressive = invalidFiles.filter(f => f.issue === 'very_aggressive');
            
            let errorMessage = '';
            if (tooLarge.length > 0) {
                errorMessage += `⚠️ Target size too close to original for: ${tooLarge.map(f => `${f.name} (${f.originalKB}KB)`).join(', ')}.\n`;
            }
            if (veryAggressive.length > 0) {
                errorMessage += `⚠️ Very aggressive compression requested for: ${veryAggressive.map(f => `${f.name} (${f.originalKB}KB→${f.targetKB}KB)`).join(', ')}.\n`;
                errorMessage += 'This may significantly affect image quality. Continue anyway?\n';
                
                // For very aggressive compression, ask for confirmation but don't block
                const confirmed = confirm(errorMessage + '\nClick OK to proceed or Cancel to adjust the target size.');
                if (!confirmed) {
                    return;
                }
            } else if (tooLarge.length > 0) {
                this.showMessage(errorMessage + 'Please set a smaller target size for meaningful compression.', 'error');
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
        console.log(`Starting compression for ${file.name}: ${Math.round(file.size/1024)}KB → ${Math.round(targetSize/1024)}KB`);
        
        try {
            // First try with the professional library
            let result = await this.tryProfessionalCompression(file, targetSize);
            
            // If the result is not close enough to target, use iterative approach
            if (Math.abs(result.blob.size - targetSize) > targetSize * 0.1) { // If more than 10% off
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
        // Convert target size from bytes to MB for the library
        const targetSizeMB = targetSize / (1024 * 1024);
        const outputFormat = this.getOptimalFormat(file.type, targetSize, file.size);
        
        // Configure compression options
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
        
        // Use canvas-based iterative approach for precise control
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
        // Set up canvas
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        const mimeType = this.getOptimalFormat(originalFile.type, targetSize, originalFile.size);
        const tolerance = targetSize * 0.05; // 5% tolerance

        // Binary search approach for quality
        let minQuality = 0.05;
        let maxQuality = 0.95;
        let bestBlob = null;
        let bestDifference = Infinity;
        let iterations = 0;
        const maxIterations = 15;

        console.log(`Targeting ${Math.round(targetSize/1024)}KB with ${tolerance} bytes tolerance`);

        while (iterations < maxIterations && Math.abs(maxQuality - minQuality) > 0.02) {
            const currentQuality = (minQuality + maxQuality) / 2;
            
            // Clear and draw
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            
            // Create blob
            const dataURL = this.canvas.toDataURL(mimeType, currentQuality);
            const blob = this.dataURLToBlob(dataURL);
            
            const difference = Math.abs(blob.size - targetSize);
            
            console.log(`Iteration ${iterations + 1}: Quality ${Math.round(currentQuality*100)}% = ${Math.round(blob.size/1024)}KB (diff: ${Math.round(difference/1024)}KB)`);
            
            // Keep track of best result so far
            if (difference < bestDifference) {
                bestDifference = difference;
                bestBlob = blob;
            }
            
            // Check if we're within tolerance
            if (difference <= tolerance) {
                console.log(`✓ Hit target within tolerance! ${Math.round(blob.size/1024)}KB`);
                return { blob: blob };
            }
            
            // Adjust search range
            if (blob.size > targetSize) {
                maxQuality = currentQuality; // Need lower quality
            } else {
                minQuality = currentQuality; // Can use higher quality
            }
            
            iterations++;
        }

        // If binary search on quality didn't work well enough, try resizing
        if (bestDifference > targetSize * 0.15) { // If still more than 15% off
            console.log('Quality adjustment insufficient, trying resize approach...');
            const resizeResult = await this.preciseResizeCompression(img, originalFile, targetSize, mimeType);
            if (resizeResult && Math.abs(resizeResult.blob.size - targetSize) < bestDifference) {
                return resizeResult;
            }
        }

        console.log(`Best result: ${Math.round(bestBlob.size/1024)}KB (${Math.round(bestDifference/1024)}KB from target)`);
        return { blob: bestBlob };
    }

    async preciseResizeCompression(img, originalFile, targetSize, mimeType) {
        const tolerance = targetSize * 0.05;
        
        // Calculate approximate scale needed
        const compressionRatio = targetSize / originalFile.size;
        let currentScale = Math.sqrt(compressionRatio);
        currentScale = Math.max(0.2, Math.min(1.0, currentScale));
        
        console.log(`Trying resize approach, starting scale: ${Math.round(currentScale*100)}%`);
        
        let bestBlob = null;
        let bestDifference = Infinity;
        
        // Try different scales
        const scaleVariations = [-0.1, 0, 0.05, 0.1, 0.15, 0.2, -0.05, -0.15];
        
        for (const variation of scaleVariations) {
            const scale = Math.max(0.2, Math.min(1.0, currentScale + variation));
            const newWidth = Math.floor(img.width * scale);
            const newHeight = Math.floor(img.height * scale);
            
            // Create resize canvas
            const resizeCanvas = document.createElement('canvas');
            const resizeCtx = resizeCanvas.getContext('2d');
            resizeCanvas.width = newWidth;
            resizeCanvas.height = newHeight;
            resizeCtx.imageSmoothingEnabled = true;
            resizeCtx.imageSmoothingQuality = 'high';
            resizeCtx.drawImage(img, 0, 0, newWidth, newHeight);
            
            // Try different qualities for this size
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
        
        if (bestBlob) {
            console.log(`Best resize result: ${Math.round(bestBlob.size/1024)}KB`);
            return { blob: bestBlob };
        }
        
        return null;
    }

    getOptimalFormat(originalType, targetSize, originalSize) {
        const compressionRatio = targetSize / originalSize;
        const outputFormat = this.outputFormatSelect ? this.outputFormatSelect.value : 'same';
        
        if (outputFormat !== 'same') {
            return outputFormat === 'jpeg' ? 'image/jpeg' : `image/${outputFormat}`;
        }
        
        // Auto-select best format for compression
        if (originalType === 'image/png' && compressionRatio < 0.8) {
            return 'image/jpeg'; // Convert PNG to JPEG for better compression
        }
        
        if (originalType === 'image/jpeg' || originalType === 'image/jpg') {
            return 'image/jpeg';
        }
        
        if (originalType === 'image/webp') {
            return 'image/webp'; // WebP is already efficient
        }
        
        // Default to JPEG for best compression
        return 'image/jpeg';
    }

    getInitialQuality(targetSize, originalSize) {
        const compressionRatio = targetSize / originalSize;
        
        if (compressionRatio > 0.8) return 0.9;        // Light compression
        if (compressionRatio > 0.6) return 0.8;        // Moderate compression
        if (compressionRatio > 0.4) return 0.7;        // Medium compression  
        if (compressionRatio > 0.2) return 0.6;        // Heavy compression
        return 0.4;                                     // Very heavy compression
    }

    async fallbackCanvasCompression(file, targetSize) {
        console.log('Using fallback canvas compression...');
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    try {
                        // Set canvas dimensions
                        this.canvas.width = img.width;
                        this.canvas.height = img.height;

                        // Determine output format
                        const mimeType = this.getOptimalFormat(file.type, targetSize, file.size);

                        // Enable high-quality rendering
                        this.ctx.imageSmoothingEnabled = true;
                        this.ctx.imageSmoothingQuality = 'high';

                        // Try different quality levels
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

                        // If quality reduction didn't work, try resizing
                        const scales = [0.9, 0.8, 0.7, 0.6, 0.5];
                        for (const scale of scales) {
                            const newWidth = Math.floor(img.width * scale);
                            const newHeight = Math.floor(img.height * scale);
                            
                            this.canvas.width = newWidth;
                            this.canvas.height = newHeight;
                            this.ctx.clearRect(0, 0, newWidth, newHeight);
                            this.ctx.drawImage(img, 0, 0, newWidth, newHeight);
                            
                            const dataURL = this.canvas.toDataURL(mimeType, 0.8);
                            const blob = this.dataURLToBlob(dataURL);

                            if (blob.size <= targetSize) {
                                console.log(`Fallback success with scale ${Math.round(scale*100)}%: ${Math.round(blob.size/1024)}KB`);
                                resolve({ blob: blob });
                                return;
                            }
                        }

                        // Last resort
                        this.canvas.width = img.width;
                        this.canvas.height = img.height;
                        this.ctx.clearRect(0, 0, img.width, img.height);
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

    compressToTargetSize(img, originalFile, targetSize) {
        // Set canvas dimensions
        this.canvas.width = img.width;
        this.canvas.height = img.height;

        // Determine output format
        const outputFormat = this.getOutputFormat(originalFile.type);
        const mimeType = this.getMimeType(outputFormat);

        // Enable high-quality rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        // Check if compression ratio is reasonable
        const compressionRatio = targetSize / originalFile.size;
        
        console.log(`Compressing ${originalFile.name}: ${Math.round(originalFile.size/1024)}KB → ${Math.round(targetSize/1024)}KB (${Math.round(compressionRatio*100)}%)`);

        // If target is larger than 90% of original, just apply minimal compression
        if (compressionRatio > 0.9) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            const dataURL = this.canvas.toDataURL(mimeType, 0.85);
            return { blob: this.dataURLToBlob(dataURL) };
        }

        let bestBlob = null;
        let bestQuality = 1.0;

        // Start with different quality levels based on desired compression
        let qualityLevels;
        if (compressionRatio >= 0.7) {
            qualityLevels = [0.9, 0.85, 0.8, 0.75, 0.7];
        } else if (compressionRatio >= 0.4) {
            qualityLevels = [0.8, 0.7, 0.6, 0.55, 0.5, 0.45, 0.4];
        } else {
            qualityLevels = [0.6, 0.5, 0.4, 0.35, 0.3, 0.25, 0.2];
        }

        // Try different quality levels
        for (const quality of qualityLevels) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);

            const dataURL = this.canvas.toDataURL(mimeType, quality);
            const blob = this.dataURLToBlob(dataURL);

            console.log(`Quality ${Math.round(quality*100)}%: ${Math.round(blob.size/1024)}KB`);

            if (blob.size <= targetSize) {
                bestBlob = blob;
                bestQuality = quality;
                console.log(`✓ Found suitable quality: ${Math.round(quality*100)}%`);
                break;
            }
        }

        // If quality reduction alone didn't work, try resizing
        if (!bestBlob) {
            console.log('Quality reduction failed, trying resize...');
            return this.compressWithSmartResize(img, originalFile, targetSize, mimeType, compressionRatio);
        }

        return { blob: bestBlob };
    }

    createFallbackBlob(img, mimeType) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(img, 0, 0);
        const dataURL = this.canvas.toDataURL(mimeType, 0.3);
        return this.dataURLToBlob(dataURL);
    }

    compressWithSmartResize(img, originalFile, targetSize, mimeType, compressionRatio = null) {
        console.log('Using smart resize compression...');
        
        let bestBlob = null;
        
        // If no compression ratio provided, calculate it
        if (!compressionRatio) {
            compressionRatio = targetSize / originalFile.size;
        }

        // Try quality reduction first, even for resize scenarios
        const qualities = [0.7, 0.6, 0.5, 0.4, 0.35, 0.3, 0.25, 0.2, 0.15, 0.1];
        
        for (const quality of qualities) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            
            const dataURL = this.canvas.toDataURL(mimeType, quality);
            const blob = this.dataURLToBlob(dataURL);

            console.log(`Resize quality ${Math.round(quality*100)}%: ${Math.round(blob.size/1024)}KB`);

            if (blob.size <= targetSize) {
                bestBlob = blob;
                console.log(`✓ Found suitable quality: ${Math.round(quality*100)}%`);
                break;
            }
        }

        // If quality reduction still didn't work, try resizing
        if (!bestBlob) {
            console.log('Trying dimension reduction...');
            
            // Calculate scale based on compression ratio
            let scale = Math.sqrt(compressionRatio);
            scale = Math.max(scale, 0.3); // Don't go below 30% of original size
            
            const scaleSteps = [scale, scale * 0.95, scale * 0.9, scale * 0.85, scale * 0.8, scale * 0.75];
            
            for (const currentScale of scaleSteps) {
                const newWidth = Math.floor(img.width * currentScale);
                const newHeight = Math.floor(img.height * currentScale);

                // Ensure reasonable minimum dimensions
                if (newWidth < 100 || newHeight < 100) continue;

                console.log(`Trying resize: ${newWidth}x${newHeight} (${Math.round(currentScale*100)}%)`);

                // Create a temporary canvas for resizing
                const resizeCanvas = document.createElement('canvas');
                const resizeCtx = resizeCanvas.getContext('2d');
                
                resizeCanvas.width = newWidth;
                resizeCanvas.height = newHeight;
                
                // Enable high-quality resizing
                resizeCtx.imageSmoothingEnabled = true;
                resizeCtx.imageSmoothingQuality = 'high';
                resizeCtx.drawImage(img, 0, 0, newWidth, newHeight);

                // Try different qualities with the resized image
                const resizeQualities = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2];
                
                for (const quality of resizeQualities) {
                    const dataURL = resizeCanvas.toDataURL(mimeType, quality);
                    const blob = this.dataURLToBlob(dataURL);

                    console.log(`Resize ${Math.round(currentScale*100)}% + Quality ${Math.round(quality*100)}%: ${Math.round(blob.size/1024)}KB`);

                    if (blob.size <= targetSize) {
                        bestBlob = blob;
                        console.log(`✓ Found suitable combination: ${Math.round(currentScale*100)}% scale + ${Math.round(quality*100)}% quality`);
                        break;
                    }
                }
                
                if (bestBlob) break;
            }
        }

        // Absolute fallback
        if (!bestBlob) {
            console.log('Using fallback compression...');
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            
            const dataURL = this.canvas.toDataURL(mimeType, 0.1);
            bestBlob = this.dataURLToBlob(dataURL);
            console.log(`Fallback result: ${Math.round(bestBlob.size/1024)}KB`);
        }

        return { blob: bestBlob };
    }

    stepDownResize(img, targetCanvas, targetCtx, targetWidth, targetHeight) {
        // Step-down resizing for better quality
        let currentCanvas = document.createElement('canvas');
        let currentCtx = currentCanvas.getContext('2d');
        
        currentCanvas.width = img.width;
        currentCanvas.height = img.height;
        currentCtx.drawImage(img, 0, 0);

        // Calculate steps
        const widthRatio = targetWidth / img.width;
        const heightRatio = targetHeight / img.height;
        const steps = Math.max(1, Math.ceil(Math.log(Math.min(widthRatio, heightRatio)) / Math.log(0.5)));

        for (let i = 0; i < steps; i++) {
            const stepRatio = Math.pow(Math.min(widthRatio, heightRatio), (i + 1) / steps);
            const stepWidth = Math.floor(img.width * stepRatio);
            const stepHeight = Math.floor(img.height * stepRatio);

            const stepCanvas = document.createElement('canvas');
            const stepCtx = stepCanvas.getContext('2d');
            
            stepCanvas.width = stepWidth;
            stepCanvas.height = stepHeight;
            
            stepCtx.imageSmoothingEnabled = true;
            stepCtx.imageSmoothingQuality = 'high';
            stepCtx.drawImage(currentCanvas, 0, 0, stepWidth, stepHeight);

            currentCanvas = stepCanvas;
            currentCtx = stepCtx;
        }

        // Final draw to target
        targetCtx.drawImage(currentCanvas, 0, 0, targetWidth, targetHeight);
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
        // Find the button that was clicked
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