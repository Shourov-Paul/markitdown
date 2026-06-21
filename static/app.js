document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    
    const loaderSection = document.getElementById('loaderSection');
    const uploadingFileName = document.getElementById('uploadingFileName');
    const progressBar = document.getElementById('progressBar');
    
    const errorToast = document.getElementById('errorToast');
    const errorMsg = document.getElementById('errorMsg');
    const closeToastBtn = document.getElementById('closeToastBtn');
    
    const workspaceSection = document.getElementById('workspaceSection');
    const uploadSection = document.querySelector('.upload-section');
    
    const metaFileName = document.getElementById('metaFileName');
    const metaFileSize = document.getElementById('metaFileSize');
    const metaFileType = document.getElementById('metaFileType');
    const resetBtn = document.getElementById('resetBtn');
    
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabFormatted = document.getElementById('tabFormatted');
    const tabRaw = document.getElementById('tabRaw');
    const rawMarkdownCode = document.getElementById('rawMarkdownCode');
    
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    // State variables
    let convertedMarkdown = '';
    let currentFileName = '';

    // Configure Marked options for secure/clean rendering
    marked.setOptions({
        gfm: true,
        breaks: true,
        headerIds: false,
        mangle: false
    });

    // 1. Drag & Drop Event Listeners
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    // 2. Browse Button Event Listeners
    browseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleFileUpload(fileInput.files[0]);
        }
    });

    // 3. Main File Upload / Conversion Logic
    function handleFileUpload(file) {
        currentFileName = file.filename || file.name;
        
        // Hide upload view & show loader view
        uploadSection.classList.add('hidden');
        loaderSection.classList.remove('hidden');
        hideError();
        
        uploadingFileName.textContent = `Processing: ${currentFileName}`;
        
        // Setup Form Data
        const formData = new FormData();
        formData.append('file', file);

        // Fetch conversion response
        fetch('/convert', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || `HTTP error! Status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                convertedMarkdown = data.markdown;
                displayWorkspace(file, data.markdown);
            } else {
                throw new Error(data.error || 'Unknown conversion error occured.');
            }
        })
        .catch(err => {
            console.error('Error converting file:', err);
            showError(err.message || 'Failed to convert document.');
            // Revert back to upload view
            loaderSection.classList.add('hidden');
            uploadSection.classList.remove('hidden');
        });
    }

    // Display Workspace with converted content
    function displayWorkspace(file, markdown) {
        // Hide loader
        loaderSection.classList.add('hidden');
        
        // Populate metadata
        metaFileName.textContent = file.name;
        metaFileSize.textContent = formatBytes(file.size);
        metaFileType.textContent = getFriendlyFileType(file.name);
        
        // Render formatted Markdown
        tabFormatted.innerHTML = marked.parse(markdown || '*No text content could be extracted.*');
        
        // Render Raw Markdown
        rawMarkdownCode.textContent = markdown || '';
        
        // Trigger highlight.js on the raw block
        hljs.highlightElement(rawMarkdownCode);
        
        // Reset tabs to default (formatted active)
        switchTab('formatted');
        
        // Show Workspace
        workspaceSection.classList.remove('hidden');
    }

    // 4. Tab Switching Logic
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    function switchTab(tabName) {
        tabButtons.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        if (tabName === 'formatted') {
            tabFormatted.classList.add('active-content');
            tabRaw.classList.remove('active-content');
        } else {
            tabRaw.classList.add('active-content');
            tabFormatted.classList.remove('active-content');
        }
    }

    // 5. Actions: Copy & Download
    copyBtn.addEventListener('click', () => {
        if (!convertedMarkdown) return;
        
        navigator.clipboard.writeText(convertedMarkdown)
            .then(() => {
                const originalHtml = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                copyBtn.classList.add('btn-success');
                setTimeout(() => {
                    copyBtn.innerHTML = originalHtml;
                    copyBtn.classList.remove('btn-success');
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    });

    downloadBtn.addEventListener('click', () => {
        if (!convertedMarkdown) return;
        
        // Extract base name and append .md
        const dotIndex = currentFileName.lastIndexOf('.');
        const baseName = dotIndex !== -1 ? currentFileName.substring(0, dotIndex) : currentFileName;
        const outFileName = `${baseName}.md`;

        const blob = new Blob([convertedMarkdown], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = outFileName;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // 6. Reset button
    resetBtn.addEventListener('click', () => {
        workspaceSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
        
        // Clear state & inputs
        fileInput.value = '';
        convertedMarkdown = '';
        currentFileName = '';
        tabFormatted.innerHTML = '<div class="placeholder-text">Rendering markdown...</div>';
        rawMarkdownCode.textContent = '';
    });

    // 7. Toast Actions
    closeToastBtn.addEventListener('click', hideError);

    function showError(message) {
        errorMsg.textContent = message;
        errorToast.classList.remove('hidden');
        // Auto-hide after 8 seconds
        setTimeout(hideError, 8000);
    }

    function hideError() {
        errorToast.classList.add('hidden');
    }

    // Helper functions
    function formatBytes(bytes, decimals = 2) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function getFriendlyFileType(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();
        const types = {
            'pdf': 'PDF Document',
            'docx': 'Word Document',
            'doc': 'Word Document',
            'xlsx': 'Excel Spreadsheet',
            'xls': 'Excel Spreadsheet',
            'pptx': 'PowerPoint Presentation',
            'ppt': 'PowerPoint Presentation',
            'png': 'PNG Image',
            'jpg': 'JPEG Image',
            'jpeg': 'JPEG Image',
            'gif': 'GIF Image',
            'mp3': 'MP3 Audio',
            'wav': 'WAV Audio',
            'zip': 'ZIP Archive',
            'epub': 'EPub Book',
            'csv': 'CSV File',
            'json': 'JSON Data',
            'xml': 'XML Document',
            'html': 'HTML Document',
            'txt': 'Text Document',
            'md': 'Markdown File'
        };
        return types[ext] || `${ext.toUpperCase()} File`;
    }
});
