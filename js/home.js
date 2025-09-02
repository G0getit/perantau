// Home page specific JavaScript

// Newsletter popup functionality
function showNewsletterPopup() {
    const popup = document.getElementById('newsletterPopup');
    if (popup) {
        popup.classList.add('show');
    }
}

function hideNewsletterPopup() {
    const popup = document.getElementById('newsletterPopup');
    if (popup) {
        popup.classList.remove('show');
    }
}

// Add click handlers for feature boxes (backup in case onclick doesn't work)
document.addEventListener('DOMContentLoaded', function() {
    const featureBoxes = document.querySelectorAll('.feature-box');
    
    featureBoxes.forEach((box, index) => {
        // Add keyboard accessibility
        box.setAttribute('tabindex', '0');
        box.setAttribute('role', 'button');
        
        // Handle keyboard navigation
        box.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                box.click();
            }
        });
    });

    // Newsletter popup functionality
    const newsletterPopup = document.getElementById('newsletterPopup');
    const popupClose = document.getElementById('popupClose');
    const newsletterForm = document.getElementById('newsletterForm');

    // Show popup after random delay (between 10-30 seconds)
    const showDelay = Math.random() * 20000 + 10000; // 10-30 seconds
    setTimeout(() => {
        // Only show if user hasn't seen it in this session
        if (!sessionStorage.getItem('newsletterPopupShown')) {
            showNewsletterPopup();
            sessionStorage.setItem('newsletterPopupShown', 'true');
        }
    }, showDelay);

    // Close popup handlers
    if (popupClose) {
        popupClose.addEventListener('click', hideNewsletterPopup);
    }

    if (newsletterPopup) {
        newsletterPopup.addEventListener('click', function(e) {
            if (e.target === newsletterPopup) {
                hideNewsletterPopup();
            }
        });
    }

    // Newsletter form submission
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const emailInput = this.querySelector('.popup-email');
            const email = emailInput.value.trim();
            
            if (!email) return;
            
            // Disable form during submission
            const submitBtn = this.querySelector('.popup-subscribe');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Subscribing...';
            
            try {
                const response = await fetch('/.netlify/functions/email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: email,
                        signup_origin: 'popup'
                    })
                });

                if (response.ok) {
                    setCookie('newsletter_subscribed', 'true', 90);
                    trackNewsletterSignup('popup');
                    alert('Thank you for subscribing! You will receive our latest updates soon.');
                    hideNewsletterPopup();
                } else {
                    throw new Error('Failed to subscribe');
                }
            } catch (error) {
                console.error('Newsletter subscription error:', error);
                alert('Sorry, there was an error. Please try again later.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    // Close popup with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideNewsletterPopup();
        }
    });
});

// In home.js - Update the trackFeatureClick function:
function trackFeatureClick(featureName) {
    console.log('Feature clicked:', featureName);
    
    if (typeof gtag !== 'undefined') {
        gtag('event', 'click', {
            event_category: 'Feature',
            event_label: featureName,
            value: 1
        });
    }
}

// Add click tracking to navigation
document.addEventListener('click', function(e) {
    const target = e.target.closest('.feature-box');
    if (target) {
        const featureTitle = target.querySelector('.feature-title')?.textContent;
        if (featureTitle) {
            trackFeatureClick(featureTitle);
        }
    }
});