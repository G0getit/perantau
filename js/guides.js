// Guides page specific JavaScript

let guidesData = [];
let filteredGuides = [];
let currentGuide = null;

// Load guides data from JSON file
async function loadGuidesData() {
    try {
        const response = await fetch('data/guides.json');
        if (!response.ok) {
            throw new Error('Failed to load guides data');
        }
        const data = await response.json();
        guidesData = data.guides || [];
        populateCategories(data.categories || []);
        filteredGuides = [...guidesData];
        renderGuides();
    } catch (error) {
        console.error('Error loading guides:', error);
        showError('Failed to load guides. Please try again later.');
    }
}

// Populate category filter dropdown
function populateCategories(categories) {
    const categorySelect = document.getElementById('categoryFilter');
    if (!categorySelect) return;
    
    // Clear existing options (except "All Categories")
    categorySelect.innerHTML = '<option value="">All Categories</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

// Render guides grid
function renderGuides() {
    const guidesGrid = document.getElementById('guidesGrid');
    const loadingState = document.getElementById('loadingState');
    const noResults = document.getElementById('noResults');
    
    if (!guidesGrid) return;
    
    // Hide loading state
    if (loadingState) {
        loadingState.style.display = 'none';
    }
    
    // Clear existing guides
    guidesGrid.innerHTML = '';
    
    // Show no results if empty
    if (filteredGuides.length === 0) {
        noResults.style.display = 'flex';
        return;
    } else {
        noResults.style.display = 'none';
    }
    
    // Render each guide
    filteredGuides.forEach((guide, index) => {
        const guideCard = createGuideCard(guide, index);
        guidesGrid.appendChild(guideCard);
    });
}

// Create individual guide card
function createGuideCard(guide, index) {
    const card = document.createElement('div');
    card.className = 'guide-card';
    card.style.animationDelay = `${(index % 6) * 0.1}s`;
    
    // Get category icon
    const categoryIcon = getCategoryIcon(guide.category);
    
    card.innerHTML = `
        <div class="guide-header">
            <div class="guide-icon">
                ${categoryIcon}
            </div>
            <div class="guide-meta">
                <h3 class="guide-title">${guide.title}</h3>
                <div class="guide-category">${guide.category}</div>
            </div>
        </div>
        <p class="guide-description">${guide.description}</p>
        <div class="guide-footer">
            ${guide.featured ? '<span class="guide-featured">Featured</span>' : '<span></span>'}
            <div class="guide-download">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
                </svg>
                Download
            </div>
        </div>
    `;
    
    // Add click handler for download
    card.addEventListener('click', () => {
        currentGuide = guide;
        showEmailModal();
    });
    
    // Add keyboard accessibility
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Download ${guide.title}`);
    
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            currentGuide = guide;
            showEmailModal();
        }
    });
    
    return card;
}

// Get icon for category
function getCategoryIcon(category) {
    const icons = {
        'Immigration': '<path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z"/>',
        'Accommodation': '<path d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z"/>',
        'Finances': '<path d="M14,11H10a2,2,0,0,1,0-4h5a1,1,0,0,1,1,1,1,1,0,0,0,2,0,3,3,0,0,0-3-3H13V3a1,1,0,0,0-2,0V5H10a4,4,0,0,0,0,8h4a2,2,0,0,1,0,4H9a1,1,0,0,1-1-1,1,1,0,0,0-2,0,3,3,0,0,0,3,3h2v2a1,1,0,0,0,2,0V19h1a4,4,0,0,0,0-8Z"/>',
        'Academic': '<path d="M12,3L1,9L12,15L21,10.09V17H23V9M5,13.18V17.18L12,21L19,17.18V13.18L12,17L5,13.18Z"/>',
        'Lifestyle': '<path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z"/>',
        'Legal': '<path d="M16.84,2.73C16.45,2.73 16.07,2.88 15.77,3.17L13.65,5.29C13.06,5.88 13.06,6.82 13.65,7.41L16.83,10.59C17.42,11.18 18.36,11.18 18.95,10.59L21.07,8.47C21.66,7.88 21.66,6.94 21.07,6.35L17.89,3.17C17.6,2.88 17.22,2.73 16.84,2.73Z"/>',
        'Health': '<path d="M12.8,21L16.8,14.5L15.2,13.5L12,18.5L8.8,13.5L7.2,14.5L11.2,21H12.8M15,12H17V10C17,6.69 14.31,4 11,4C7.69,4 5,6.69 5,10V12H7V10C7,7.79 8.79,6 11,6C13.21,6 15,7.79 15,10V12Z"/>'
    };
    
    return `<svg viewBox="0 0 24 24" fill="currentColor">${icons[category] || icons['Academic']}</svg>`;
}

// Filter guides based on search and category
function filterGuides() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const selectedCategory = document.getElementById('categoryFilter')?.value || '';
    
    filteredGuides = guidesData.filter(guide => {
        const matchesSearch = guide.title.toLowerCase().includes(searchTerm) ||
                            guide.description.toLowerCase().includes(searchTerm) ||
                            guide.category.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !selectedCategory || guide.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });
    
    renderGuides();
}

// Show email modal
function showEmailModal() {
    const emailModal = document.getElementById('emailModal');
    if (emailModal) {
        emailModal.style.display = 'flex';
        // Focus on email input
        setTimeout(() => {
            document.getElementById('downloadEmail')?.focus();
        }, 100);
    }
}

// Hide email modal
function hideEmailModal() {
    const emailModal = document.getElementById('emailModal');
    if (emailModal) {
        emailModal.style.display = 'none';
        // Reset form
        document.getElementById('emailForm')?.reset();
    }
}

// Handle guide download
async function handleDownload(email, subscribe) {
    if (!currentGuide) return;
    
    const downloadButton = document.getElementById('downloadButton');
    const originalText = downloadButton.innerHTML;
    
    downloadButton.disabled = true;
    downloadButton.innerHTML = 'Processing...';
    
    try {
        // Capture email to Supabase
        const response = await fetch('/.netlify/functions/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                signup_origin: 'guide download'
            })
        });

        if (response.ok) {
            alert(`Thank you! Download information for "${currentGuide.title}" has been sent to ${email}`);
            hideEmailModal();
            trackDownload(currentGuide.title, email);
            trackNewsletterSignup('guide_download');
        } else {
            throw new Error('Failed to process download');
        }
        
    } catch (error) {
        console.error('Download error:', error);
        alert('Sorry, there was an error processing your download. Please try again.');
    } finally {
        downloadButton.disabled = false;
        downloadButton.innerHTML = originalText;
    }
}

// In guides.js - Update the trackDownload function:
function trackDownload(guideTitle, email) {
    console.log('Guide downloaded:', guideTitle, 'by', email);
    
    // Send to Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'download', {
            event_category: 'Guide',
            event_label: guideTitle,
            value: 1
        });
    }
}

// Add newsletter subscription tracking (add to home.js):
function trackNewsletterSignup(source) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'sign_up', {
            event_category: 'Newsletter',
            event_label: source, // 'popup' or 'guide_download'
            value: 1
        });
    }
}

// Show error message
function showError(message) {
    const guidesGrid = document.getElementById('guidesGrid');
    const loadingState = document.getElementById('loadingState');
    
    if (loadingState) {
        loadingState.style.display = 'none';
    }
    
    if (guidesGrid) {
        guidesGrid.innerHTML = `
            <div class="loading-state" style="color: var(--accent-color);">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z"/>
                </svg>
                <p>${message}</p>
                <button class="btn-primary" onclick="loadGuidesData()">Try Again</button>
            </div>
        `;
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Load guides data
    loadGuidesData();
    
    // Set up event listeners
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const emailForm = document.getElementById('emailForm');
    const cancelDownload = document.getElementById('cancelDownload');
    const emailModal = document.getElementById('emailModal');
    
    // Search functionality with debouncing
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(filterGuides, 300);
        });
    }
    
    // Category filter
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterGuides);
    }
    
    // Email form submission
    if (emailForm) {
        emailForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('downloadEmail').value.trim();
            const subscribe = document.getElementById('subscribeNewsletter').checked;
            
            if (email) {
                handleDownload(email, subscribe);
            }
        });
    }
    
    // Cancel download
    if (cancelDownload) {
        cancelDownload.addEventListener('click', hideEmailModal);
    }
    
    // Close modal when clicking outside
    if (emailModal) {
        emailModal.addEventListener('click', function(e) {
            if (e.target === emailModal) {
                hideEmailModal();
            }
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Escape key to close modal
        if (e.key === 'Escape') {
            hideEmailModal();
        }
        
        // Ctrl/Cmd + F to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            searchInput?.focus();
        }
    });
});
