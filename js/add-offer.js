// Add Offer Form JavaScript with Proper Validation & Feedback

// Supabase configuration - REPLACE WITH YOUR ACTUAL VALUES
const SUPABASE_URL = 'https://tckjxyymdwxykwdcyija.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRja2p4eXltZHd4eWt3ZGN5aWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTEzNzgsImV4cCI6MjA2ODI2NzM3OH0.cXXTGsEWJAKdqkJNM3asSP3HKeCDguMEn9hWYRwklUA';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Rate limiting - max 3 submissions per day per IP
const MAX_SUBMISSIONS_PER_DAY = 3;
const RATE_LIMIT_KEY = 'jasatitip_submissions_' + new Date().toDateString();

// Form elements
const offerForm = document.getElementById('offerForm');
const submitButton = document.getElementById('submitButton');
const successMessage = document.getElementById('successMessage');
const formContainer = document.querySelector('.form-container');
const rateLimitModal = document.getElementById('rateLimitModal');
const closeRateLimitModal = document.getElementById('closeRateLimitModal');

// Character counter for notes
const notesTextarea = document.getElementById('notes');
const notesCounter = document.getElementById('notesCounter');

// Check rate limiting on page load
function checkRateLimit() {
    const submissions = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '[]');
    return submissions.length >= MAX_SUBMISSIONS_PER_DAY;
}

// Add submission to rate limit tracking
function addSubmissionToRateLimit() {
    const submissions = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '[]');
    submissions.push(Date.now());
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(submissions));
}

// Show rate limit modal
function showRateLimitModal() {
    rateLimitModal.style.display = 'flex';
}

// Hide rate limit modal
function hideRateLimitModal() {
    rateLimitModal.style.display = 'none';
}

// Show success message
function showSuccessMessage() {
    formContainer.style.display = 'none';
    successMessage.style.display = 'block';
    document.querySelector('.payment-notice').style.display = 'none';
    successMessage.scrollIntoView({ behavior: 'smooth' });
}

// Show error message
function showErrorMessage(message) {
    // Remove existing error messages
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        background: #f8d7da;
        color: #721c24;
        padding: 15px 20px;
        border-radius: 10px;
        margin-bottom: 20px;
        border: 1px solid #f5c6cb;
        font-weight: 500;
        text-align: center;
    `;
    errorDiv.innerHTML = `
        <strong>❌ Error:</strong> ${message}
    `;
    
    // Insert at top of form container
    formContainer.insertBefore(errorDiv, formContainer.firstChild);
    
    // Scroll to top to show error
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Validate all required fields
function validateRequiredFields() {
    const requiredFields = [
        { id: 'fromCity', name: 'Origin City' },
        { id: 'toCity', name: 'Destination City' },
        { id: 'departureDate', name: 'Departure Date' },
        { id: 'arrivalDate', name: 'Arrival Date' },
        { id: 'dropoffDeadline', name: 'Drop-off Deadline' },
        { id: 'capacity', name: 'Capacity' },
        { id: 'pricePerKg', name: 'Price per kg' },
        { id: 'dropoffLocations', name: 'Drop-off Locations' },
        { id: 'contactName', name: 'Contact Name' },
        { id: 'contactPhone', name: 'Phone Number' },
        { id: 'submitterEmail', name: 'Email Address' }
    ];
    
    const emptyFields = [];
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element.value || element.value.trim() === '') {
            emptyFields.push(field.name);
            // Add visual indication
            element.style.borderColor = '#e74c3c';
            element.style.boxShadow = '0 0 0 3px rgba(231, 76, 60, 0.1)';
        } else {
            // Remove error styling
            element.style.borderColor = '#e0e0e0';
            element.style.boxShadow = 'none';
        }
    });
    
    return emptyFields;
}

// Validate checkboxes
function validateCheckboxes() {
    const agreeTerms = document.getElementById('agreeTerms');
    const confirmPayment = document.getElementById('confirmPayment');
    
    const missingChecks = [];
    
    if (!agreeTerms.checked) {
        missingChecks.push('You must agree to the terms and conditions');
    }
    
    if (!confirmPayment.checked) {
        missingChecks.push('You must confirm that payment has been sent');
    }
    
    return missingChecks;
}

// Validate dates
function validateDates() {
    const departureDate = new Date(document.getElementById('departureDate').value);
    const arrivalDate = new Date(document.getElementById('arrivalDate').value);
    const dropoffDeadline = new Date(document.getElementById('dropoffDeadline').value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const errors = [];
    
    if (departureDate <= today) {
        errors.push('Departure date must be in the future');
    }
    
    if (arrivalDate <= departureDate) {
        errors.push('Arrival date must be after departure date');
    }
    
    if (dropoffDeadline >= departureDate) {
        errors.push('Drop-off deadline must be before departure date');
    }
    
    return errors;
}

// Validate numeric fields
function validateNumbers() {
    const capacity = parseInt(document.getElementById('capacity').value);
    const price = parseFloat(document.getElementById('pricePerKg').value);
    
    const errors = [];
    
    if (isNaN(capacity) || capacity < 1 || capacity > 50) {
        errors.push('Capacity must be between 1 and 50 kg');
    }
    
    if (isNaN(price) || price < 5 || price > 100) {
        errors.push('Price per kg must be between $5 and $100');
    }
    
    return errors;
}

// Validate email and phone
function validateContactInfo() {
    const email = document.getElementById('submitterEmail').value;
    const phone = document.getElementById('contactPhone').value;
    
    const errors = [];
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errors.push('Please enter a valid email address');
    }
    
    // Phone validation (basic check)
    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 10) {
        errors.push('Please enter a valid phone number (minimum 10 digits)');
    }
    
    return errors;
}

// Get client IP address (basic method)
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.log('Could not get IP:', error);
        return 'unknown';
    }
}

// Submit form to Supabase
async function submitOffer() {
    try {
        // Get form values
        const fromCity = document.getElementById('fromCity').value;
        const toCity = document.getElementById('toCity').value;
        const departureDate = document.getElementById('departureDate').value;
        const arrivalDate = document.getElementById('arrivalDate').value;
        const dropoffDeadline = document.getElementById('dropoffDeadline').value;
        const capacity = parseInt(document.getElementById('capacity').value);
        const price = parseInt(document.getElementById('pricePerKg').value);
        const dropoffLocations = document.getElementById('dropoffLocations').value
            .split(',')
            .map(loc => loc.trim())
            .filter(loc => loc.length > 0);
        const contactName = document.getElementById('contactName').value;
        const contactPhone = document.getElementById('contactPhone').value;
        const contactEmail = document.getElementById('submitterEmail').value;
        const notes = document.getElementById('notes').value || null;
        
        // Get client information
        const clientIP = await getClientIP();
        const userAgent = navigator.userAgent;
        
        // Calculate expiry date - use dropoff deadline instead of departure date
        const dropoffDeadlineDate = new Date(dropoffDeadline);
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
        
        // Prepare submission data (matching your exact table schema)
        const submissionData = {
            from_city: fromCity,
            to_city: toCity,
            departure_date: departureDate,
            arrival_date: arrivalDate,
            capacity_kg: capacity,
            price_per_kg: price,
            dropoff_deadline: dropoffDeadline,
            dropoff_locations: dropoffLocations,
            contact_name: contactName,
            contact_phone: contactPhone,
            contact_email: contactEmail,
            notes: notes,
            status: 'pending',
            payment_received: false,
            submitted_ip: clientIP,
            user_agent: userAgent,
            expires_at: dropoffDeadlineDate.toISOString()
        };
        
        console.log('Submitting data:', submissionData);
        
        // Insert into Supabase
        const { data, error } = await supabase
            .from('jasa_titip_submissions')
            .insert([submissionData])
            .select();
        
        if (error) {
            console.error('Supabase error:', error);
            throw new Error(`Database error: ${error.message}`);
        }
        
        console.log('Submission successful:', data);
        return data[0];
        
    } catch (error) {
        console.error('Error submitting offer:', error);
        throw error;
    }
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    console.log('Form submission started');
    
    // Remove any existing error messages
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    
    // Check rate limiting first
    if (checkRateLimit()) {
        showRateLimitModal();
        return;
    }
    
    // Validate all fields
    const emptyFields = validateRequiredFields();
    const checkboxErrors = validateCheckboxes();
    const dateErrors = validateDates();
    const numberErrors = validateNumbers();
    const contactErrors = validateContactInfo();
    
    // Combine all errors
    let allErrors = [];
    
    if (emptyFields.length > 0) {
        allErrors.push(`Please fill in all required fields: ${emptyFields.join(', ')}`);
    }
    
    allErrors = allErrors.concat(checkboxErrors, dateErrors, numberErrors, contactErrors);
    
    // Show errors if any
    if (allErrors.length > 0) {
        showErrorMessage(allErrors.join('<br>• '));
        return;
    }
    
    // Disable submit button and show loading
    submitButton.disabled = true;
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="animation: spin 1s linear infinite;">
            <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
        </svg>
        Submitting...
    `;
    
    try {
        // Submit to Supabase
        console.log('Calling submitOffer...');
        const result = await submitOffer();
        
        // Add to rate limiting
        addSubmissionToRateLimit();
        
        // Show success message
        console.log('Showing success message');
        showSuccessMessage();
        
    } catch (error) {
        console.error('Submission failed:', error);
        showErrorMessage(`Failed to submit offer: ${error.message}. Please try again or contact support.`);
        
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

// Update character counter for notes
function updateNotesCounter() {
    if (!notesTextarea || !notesCounter) return;
    
    const currentLength = notesTextarea.value.length;
    const maxLength = 500;
    notesCounter.textContent = `${currentLength}/${maxLength} characters`;
    
    if (currentLength > maxLength * 0.9) {
        notesCounter.classList.add('warning');
    } else {
        notesCounter.classList.remove('warning');
    }
    
    // Limit input
    if (currentLength > maxLength) {
        notesTextarea.value = notesTextarea.value.substring(0, maxLength);
        updateNotesCounter();
    }
}

// Set minimum dates
function setMinimumDates() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    // Set minimum dates
    document.getElementById('departureDate').min = formatDate(tomorrow);
    document.getElementById('arrivalDate').min = formatDate(tomorrow);
    document.getElementById('dropoffDeadline').min = formatDate(today);
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...');
    
    // Set minimum dates
    setMinimumDates();
    
    // Check if rate limited on page load
    if (checkRateLimit()) {
        submitButton.disabled = true;
        submitButton.innerHTML = 'Daily Limit Reached (3 submissions/day)';
        submitButton.style.background = '#ccc';
    }
    
    // Form submission
    if (offerForm) {
        offerForm.addEventListener('submit', handleFormSubmit);
        console.log('Form event listener added');
    }
    
    // Character counter for notes
    if (notesTextarea) {
        notesTextarea.addEventListener('input', updateNotesCounter);
        updateNotesCounter(); // Initialize counter
    }
    
    // Rate limit modal
    if (closeRateLimitModal) {
        closeRateLimitModal.addEventListener('click', hideRateLimitModal);
    }
    
    if (rateLimitModal) {
        rateLimitModal.addEventListener('click', function(e) {
            if (e.target === rateLimitModal) {
                hideRateLimitModal();
            }
        });
    }
    
    // Date validation helpers
    const departureDate = document.getElementById('departureDate');
    const arrivalDate = document.getElementById('arrivalDate');
    const dropoffDeadline = document.getElementById('dropoffDeadline');
    
    if (departureDate) {
        departureDate.addEventListener('change', function() {
            if (this.value) {
                arrivalDate.min = this.value;
                dropoffDeadline.max = this.value;
            }
        });
    }
});

// Add CSS for spinning animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .error-message {
        animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);