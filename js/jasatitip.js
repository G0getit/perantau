// Jasa Titip page with Supabase integration

// Supabase configuration
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let listingsData = [];
let filteredListings = [];

// Load listings data from Supabase
async function loadListingsData() {
    try {
        showLoading();
        
        // Only get approved listings that haven't expired
        const { data, error } = await supabase
            .from('jasa_titip_listings')
            .select('*')
            .eq('status', 'approved')
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        // Transform Supabase data to match existing format
        listingsData = data.map(item => ({
            id: item.id,
            from: item.from_city,
            to: item.to_city,
            departure_date: formatDate(item.departure_date),
            arrival_date: formatDate(item.arrival_date),
            capacity_kg: item.capacity_kg,
            price_per_kg: item.price_per_kg,
            dropoff_deadline: formatDate(item.dropoff_deadline),
            dropoff_locations: item.dropoff_locations,
            contact_name: item.contact_name,
            contact_phone: item.contact_phone,
            notes: item.notes,
            created_date: item.created_at,
            expires_date: item.expires_at,
            status: 'active'
        }));

        populateRouteFilter();
        filteredListings = [...listingsData];
        renderListings();
        
    } catch (error) {
        console.error('Error loading listings:', error);
        showError('Failed to load listings. Please try again later.');
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Show loading state
function showLoading() {
    const listingsGrid = document.getElementById('listingsGrid');
    const loadingState = document.getElementById('loadingState');
    
    if (loadingState) {
        loadingState.style.display = 'flex';
    }
}

// Populate route filter dropdown
function populateRouteFilter() {
    const routeSelect = document.getElementById('routeFilter');
    if (!routeSelect) return;
    
    // Get unique routes
    const routes = [...new Set(listingsData.map(listing => `${listing.from} → ${listing.to}`))];
    
    // Clear existing options (except "All Routes")
    routeSelect.innerHTML = '<option value="">All Routes</option>';
    
    routes.forEach(route => {
        const option = document.createElement('option');
        option.value = route;
        option.textContent = route;
        routeSelect.appendChild(option);
    });
}

// Render listings grid
function renderListings() {
    const listingsGrid = document.getElementById('listingsGrid');
    const loadingState = document.getElementById('loadingState');
    const noResults = document.getElementById('noResults');
    
    if (!listingsGrid) return;
    
    // Hide loading state
    hideLoading();
    
    // Clear existing listings
    listingsGrid.innerHTML = '';
    
    // Show no results if empty
    if (filteredListings.length === 0) {
        if (noResults) {
            noResults.style.display = 'flex';
        } else {
            // Create no results message if element doesn't exist
            listingsGrid.innerHTML = `
                <div class="no-results" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; color: var(--text-secondary);">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" style="margin-bottom: 20px; opacity: 0.5;">
                        <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                    </svg>
                    <h3>No data to display</h3>
                    <p>No approved listings found. Check back later for new offerings.</p>
                </div>
            `;
        }
        return;
    } else {
        if (noResults) {
            noResults.style.display = 'none';
        }
    }
    
    // Render each listing
    filteredListings.forEach((listing, index) => {
        const listingCard = createListingCard(listing, index);
        listingsGrid.appendChild(listingCard);
    });
}

// Create individual listing card
function createListingCard(listing, index) {
    const card = document.createElement('div');
    card.className = 'listing-card';
    card.style.animationDelay = `${(index % 6) * 0.1}s`;
    
    card.innerHTML = `
        <div class="route-header">
            <div class="route-info">
                <div class="route-text">${listing.from}</div>
                <div class="route-arrow">→</div>
                <div class="route-text">${listing.to}</div>
            </div>
            <div class="price-tag">$${listing.price_per_kg}/kg</div>
        </div>
        
        <div class="listing-details">
            <div class="detail-row">
                <span class="detail-label">Departure:</span>
                <span class="detail-value departure-time">${listing.departure_date}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Arrival:</span>
                <span class="detail-value">${listing.arrival_date}</span>
            </div>
        </div>
        
        <div class="capacity-info">
            <span class="capacity-text">Available Capacity:</span>
            <span class="capacity-value">${listing.capacity_kg} kg</span>
        </div>
        
        <div class="dropoff-info">
            <div class="dropoff-deadline">
                <strong>Drop-off Deadline:</strong> ${listing.dropoff_deadline}
            </div>
            <div class="dropoff-locations">
                <strong>Drop-off Locations:</strong> ${listing.dropoff_locations.join(', ')}
            </div>
        </div>
        
        <button class="contact-button" onclick="showContactModal('${listing.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
                <path d="M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4C22,2.89 21.1,2 20,2Z"/>
            </svg>
            CONTACT
        </button>
    `;
    
    return card;
}

// Filter listings based on search and route
function filterListings() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const selectedRoute = document.getElementById('routeFilter')?.value || '';
    
    filteredListings = listingsData.filter(listing => {
        const matchesSearch = listing.from.toLowerCase().includes(searchTerm) ||
                            listing.to.toLowerCase().includes(searchTerm) ||
                            listing.contact_name.toLowerCase().includes(searchTerm);
        
        const matchesRoute = !selectedRoute || `${listing.from} → ${listing.to}` === selectedRoute;
        
        return matchesSearch && matchesRoute;
    });
    
    renderListings();
}

// Show contact modal
function showContactModal(listingId) {
    const listing = listingsData.find(l => l.id === listingId);
    if (!listing) return;
    
    const modal = document.getElementById('contactModal');
    const modalRoute = document.getElementById('modalRoute');
    const contactName = document.getElementById('contactName');
    const contactPhone = document.getElementById('contactPhone');
    const contactNotes = document.getElementById('contactNotes');
    const notesField = document.getElementById('notesField');
    
    if (modal && modalRoute && contactName && contactPhone) {
        modalRoute.textContent = `${listing.from} → ${listing.to}`;
        contactName.textContent = listing.contact_name;
        contactPhone.textContent = listing.contact_phone;
        
        // Handle notes field
        if (listing.notes && listing.notes.trim() && contactNotes && notesField) {
            contactNotes.textContent = listing.notes;
            notesField.style.display = 'flex';
        } else if (notesField) {
            notesField.style.display = 'none';
        }
        
        modal.style.display = 'flex';
    }
}

// Hide contact modal
function hideContactModal() {
    const modal = document.getElementById('contactModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Show error message
function showError(message) {
    const listingsGrid = document.getElementById('listingsGrid');
    const loadingState = document.getElementById('loadingState');
    
    if (loadingState) {
        loadingState.style.display = 'none';
    }
    
    if (listingsGrid) {
        listingsGrid.innerHTML = `
            <div class="loading-state" style="color: var(--accent-color);">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z"/>
                </svg>
                <p>${message}</p>
                <button class="btn-primary" onclick="loadListingsData()">Try Again</button>
            </div>
        `;
    }
}

// Auto-refresh listings every 5 minutes
function startAutoRefresh() {
    setInterval(() => {
        loadListingsData();
    }, 5 * 60 * 1000); // 5 minutes
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Load listings data
    loadListingsData();
    
    // Start auto-refresh
    startAutoRefresh();
    
    // Set up event listeners
    const searchInput = document.getElementById('searchInput');
    const routeFilter = document.getElementById('routeFilter');
    const closeContactModal = document.getElementById('closeContactModal');
    const contactModal = document.getElementById('contactModal');
    
    // Search functionality with debouncing
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(filterListings, 300);
        });
    }
    
    // Route filter
    if (routeFilter) {
        routeFilter.addEventListener('change', filterListings);
    }
    
    // Close contact modal
    if (closeContactModal) {
        closeContactModal.addEventListener('click', hideContactModal);
    }
    
    // Close modal when clicking outside
    if (contactModal) {
        contactModal.addEventListener('click', function(e) {
            if (e.target === contactModal) {
                hideContactModal();
            }
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Escape key to close modal
        if (e.key === 'Escape') {
            hideContactModal();
        }
        
        // Ctrl/Cmd + F to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            searchInput?.focus();
        }
    });
});