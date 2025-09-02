// Configuration
    const WEBHOOK_URL = '/.netlify/functions/chat';
    const FEEDBACK_URL = '/.netlify/functions/feedback';

    // Rate limiting
    let lastMessageTime = 0;
    const MESSAGE_COOLDOWN = 2000;

    // DOM Elements
    const chatInterface = document.getElementById('chatInterface');
    const welcomeSection = document.getElementById('welcomeSection');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    const templateCategories = document.getElementById('templateCategories');
    const sampleQuestions = document.getElementById('sampleQuestions');
    const sampleQuestionsList = document.getElementById('sampleQuestionsList');
    const userInfoModal = document.getElementById('userInfoModal');
    const userInfoForm = document.getElementById('userInfoForm');
    const resetButton = document.getElementById('resetButton');
    const feedbackButton = document.getElementById('feedbackButton');
    const feedbackModal = document.getElementById('feedbackModal');
    const feedbackForm = document.getElementById('feedbackForm');
    const feedbackText = document.getElementById('feedbackText');
    const characterCounter = document.getElementById('characterCounter');
    const cancelFeedback = document.getElementById('cancelFeedback');
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const infoButton = document.getElementById('infoButton');
    const faqPopup = document.getElementById('faqPopup');

    let isFirstMessage = true;
    let isThinking = false;
    let userInfo = null;
    let sessionId = null;
    let currentCategory = null;
    let thinkingTimer = null;
    
    // Add this function to clean dangerous code from messages
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Sample questions data
    const sampleQuestionsData = {
        immigration: {
            title: "Immigration Questions",
            questions: [
                "Bagaimana jika PGWP saya ditolak?",
                "Bagaimanakah cara apply Permanent Residency?",
                "Bagaimanakah cara memperpanjang study permit?"
            ]
        },
        lifestyle: {
            title: "Lifestyle Questions", 
            questions: [
                "Beli tiket pesawat, lebih baik dari Indonesia atau Kanada?",
                "Berapa jumlah paket data yang dibutuhkan di Kanada?",
                "Bagaimanakah cara mendapatkan Driver's License di BC?"
            ]
        },
        accommodation: {
            title: "Accommodation Questions",
            questions: [
                "Apakah saya harus keluar dorm saat summer?",
                "Bagaimana jika saya belum punya tempat tinggal saat datang ke Kanada?",
                "Tips menghindari penipuan rental unit di Kanada."
            ]
        },
        academic: {
            title: "Academic Questions",
            questions: [
                "Apakah bisa bekerja sambil kuliah di Kanada?",
                "Bagaimana sistem grading di universitas Kanada?",
                "Apa itu co-op program dan bagaimana cara apply-nya?"
            ]
        },
        finances: {
            title: "Finances Questions",
            questions: [
                "Jenis investasi apa saja yang ada di Kanada?",
                "Bagaimana cara membaca paystub?",
                "Apa tips hidup hemat di Kanada?"
            ]
        }
    };

    // Generate session ID
    function generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    sessionId = generateSessionId();

    // Theme Management
    function initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }

    function toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    }

    function updateThemeIcon(theme) {
        const sunIcon = `<path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>`;
        const moonIcon = `<path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>`;
        
        themeIcon.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
    }

    // Local storage functions
    function saveUserInfo(info) {
        localStorage.setItem('pantau_user_info', JSON.stringify(info));
    }

    function loadUserInfo() {
        const saved = localStorage.getItem('pantau_user_info');
        return saved ? JSON.parse(saved) : null;
    }

    function clearUserInfo() {
        localStorage.removeItem('pantau_user_info');
    }

    // Check for saved user info on page load
    function checkSavedUserInfo() {
        const savedUserInfo = loadUserInfo();
        if (savedUserInfo) {
            userInfo = savedUserInfo;
            document.getElementById('userName').value = userInfo.name;
            document.getElementById('userEmail').value = userInfo.email;
            return true;
        }
        return false;
    }

    // Category Management
    function showSampleQuestions(category) {
        if (currentCategory === category) {
            hideSampleQuestions();
            return;
        }

        currentCategory = category;
        const data = sampleQuestionsData[category];
        
        sampleQuestionsList.innerHTML = '';
        data.questions.forEach(question => {
            const button = document.createElement('button');
            button.className = 'sample-question-btn';
            button.textContent = question;
            button.addEventListener('click', () => {
                chatInput.value = question;
                hideSampleQuestions();
                chatInput.focus();
            });
            sampleQuestionsList.appendChild(button);
        });

        sampleQuestions.classList.add('visible');
        
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
    }

    function hideSampleQuestions() {
        currentCategory = null;
        sampleQuestions.classList.remove('visible');
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    // Reset session function
    function resetSession() {
        sessionId = generateSessionId();
        chatMessages.innerHTML = '';
        chatMessages.classList.remove('visible');
        welcomeSection.style.display = 'flex';
        templateCategories.classList.remove('hidden');
        hideSampleQuestions();
        isFirstMessage = true;
        document.querySelector('.chat-input-container').classList.remove('chat-started');
        chatInput.value = '';
        chatInput.style.height = 'auto';
        console.log('New session started:', sessionId);
    }

    // Show/Hide modals
    function showUserInfoModal() {
        userInfoModal.style.display = 'flex';
        setTimeout(() => {
            document.getElementById('userName').focus();
        }, 100);
    }

    function hideUserInfoModal() {
        userInfoModal.style.display = 'none';
    }

    function showFeedbackModal() {
        feedbackModal.style.display = 'flex';
        setTimeout(() => {
            feedbackText.focus();
        }, 100);
    }

    function hideFeedbackModal() {
        feedbackModal.style.display = 'none';
        feedbackText.value = '';
        updateCharacterCounter();
    }

    // Update character counter
    function updateCharacterCounter() {
        const currentLength = feedbackText.value.length;
        const maxLength = 1000;
        characterCounter.textContent = `${currentLength}/${maxLength} characters`;
        
        if (currentLength > maxLength * 0.9) {
            characterCounter.classList.add('warning');
        } else {
            characterCounter.classList.remove('warning');
        }
    }

    // Copy functionality
    async function copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            const originalText = button.innerHTML;
            button.innerHTML = '✓';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            const originalText = button.innerHTML;
            button.innerHTML = '✓';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('copied');
            }, 2000);
        }
    }

    // Format AI response with markdown-like formatting
    function formatAIResponse(text) {
        text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        text = text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
        
        text = text.replace(/\n\n/g, '<br>');
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }

    // Add message to chat
    function addMessage(text, sender) {
        const messageGroup = document.createElement('div');
        messageGroup.className = 'message-group';
        
        if (sender === 'user') {
            messageGroup.innerHTML = `
                <div class="user-message">
                    <div class="user-bubble">${escapeHtml(text)}</div>
                </div>
                <button class="copy-button" onclick="copyToClipboard('${escapeHtml(text)}.replace(/'/g, "\\'")}', this)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                </button>
            `;
        } else {
            const formattedText = formatAIResponse(text);
            const plainText = text.replace(/[#*\-\d\.]/g, '').trim();
            
            messageGroup.innerHTML = `
                <div class="ai-message">
                    <div class="ai-content">${formattedText}</div>
                </div>
                <div class="feedback-buttons">
                    <button class="feedback-btn thumbs-up" data-feedback="helpful" onclick="sendQuickFeedback(\`${plainText.replace(/`/g, '\\`')}\`, 'helpful', this)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
                        </svg>
                    </button>
                    <button class="feedback-btn thumbs-down" data-feedback="not-helpful" onclick="sendQuickFeedback(\`${plainText.replace(/`/g, '\\`')}\`, 'not-helpful', this)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/>
                        </svg>
                    </button>
                    <button class="copy-button" onclick="copyToClipboard(\`${plainText.replace(/`/g, '\\`')}\`, this)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                    </button>
                </div>
            `;
        }
        
        chatMessages.appendChild(messageGroup);

        // Force immediate scroll without animation first
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Then add smooth scroll as backup
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 50);

        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 200);
    }

    // Updated thinking animation with progressive text changes
    function showThinking() {
        isThinking = true;
        sendButton.disabled = true;
        
        const thinkingGroup = document.createElement('div');
        thinkingGroup.className = 'message-group';
        thinkingGroup.id = 'thinkingGroup';
        thinkingGroup.innerHTML = `
            <div class="thinking-message">
                <div class="thinking-bubble">
                    <span id="thinkingText">Thinking</span>
                    <div class="thinking-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        chatMessages.appendChild(thinkingGroup);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Progressive text changes
        const thinkingTextElement = document.getElementById('thinkingText');
        const messages = [
            "Fetching the most helpful information",
            "Working hard to find you the best answer"
        ];
        
        // Change text after 3 seconds (randomized)
        setTimeout(() => {
            if (thinkingTextElement) {
                const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                thinkingTextElement.textContent = randomMessage;
            }
        }, 3000);
        
        // Change to "Almost there..." after 7 seconds
        setTimeout(() => {
            if (thinkingTextElement) {
                thinkingTextElement.textContent = "Almost there...";
            }
        }, 7000);
    }

    // Hide thinking animation
    function hideThinking() {
        isThinking = false;
        sendButton.disabled = false;
        
        const thinkingGroup = document.getElementById('thinkingGroup');
        if (thinkingGroup) {
            thinkingGroup.remove();
        }
    }

    // Send message function
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message || isThinking) return;

        const currentTime = Date.now();
        if (currentTime - lastMessageTime < MESSAGE_COOLDOWN) {
            const remainingTime = Math.ceil((MESSAGE_COOLDOWN - (currentTime - lastMessageTime)) / 1000);
            addMessage(`Please wait ${remainingTime} more second(s) before sending another message.`, 'ai');
            return;
        }
        lastMessageTime = currentTime;

        if (!userInfo) {
            showUserInfoModal();
            return;
        }

        // Hide welcome section and template categories on first message
        if (isFirstMessage) {
            welcomeSection.style.display = 'none';
            templateCategories.classList.add('hidden');
            chatMessages.classList.add('visible');
            document.querySelector('.chat-input-container').classList.add('chat-started');
            isFirstMessage = false;
        }

        // Add user message
        addMessage(message, 'user');
        chatInput.value = '';
        chatInput.style.height = 'auto';

        // Show thinking bubble
        showThinking();

        try {
            console.log('Sending to backend API...');

            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    timestamp: new Date().toISOString(),
                    user: userInfo,
                    sessionId: sessionId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            hideThinking();
            addMessage(data.response || data.message || 'I received your message and I\'m processing it.', 'ai');

        } catch (error) {
            console.error('Error:', error);
            hideThinking();
            
            if (error.message.includes('404')) {
                addMessage('Backend API not set up yet. You need to create a Netlify Function at /netlify/functions/chat.js to handle the webhook securely.', 'ai');
            } else {
                addMessage('Sorry, I\'m having trouble connecting right now. Please try again in a moment.', 'ai');
            }
        }
    }

    // Auto-resize textarea
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    resetButton.addEventListener('click', resetSession);
    themeToggle.addEventListener('click', toggleTheme);
    feedbackButton.addEventListener('click', showFeedbackModal);
    cancelFeedback.addEventListener('click', hideFeedbackModal);
    feedbackText.addEventListener('input', updateCharacterCounter);

    // FAQ popup toggle
    infoButton.addEventListener('click', function(e) {
        e.stopPropagation();
        faqPopup.classList.toggle('show');
    });

    // Close FAQ popup when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.info-button')) {
            faqPopup.classList.remove('show');
        }
    });

    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Handle user info form submission
    userInfoForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        
        if (name && email) {
            userInfo = { name, email };
            saveUserInfo(userInfo);
            
            // Capture email to Supabase
            try {
                await fetch('/.netlify/functions/email-capture', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: email,
                        name: name,
                        signup_origin: 'chat'
                    })
                });
            } catch (error) {
                console.error('Email capture error:', error);
                // Don't block the user experience if email capture fails
            }
            
            hideUserInfoModal();
            chatInput.focus();
        }
    });

    // Handle feedback form submission
    feedbackForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const feedback = feedbackText.value.trim();
        if (!feedback) return;

        if (!userInfo) {
            alert('Please provide your contact information first by starting a chat.');
            hideFeedbackModal();
            showUserInfoModal();
            return;
        }

        try {
            document.getElementById('submitFeedback').disabled = true;
            document.getElementById('submitFeedback').textContent = 'Sending...';

            const response = await fetch(FEEDBACK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: feedback,
                    feedback: 'detailed_feedback',
                    timestamp: new Date().toISOString(),
                    sessionId: sessionId,
                    user: userInfo,
                    type: 'user_feedback'
                })
            });

            if (response.ok) {
                alert('Thank you for your feedback! We appreciate your input.');
                hideFeedbackModal();
            } else {
                throw new Error('Failed to send feedback');
            }
        } catch (error) {
            console.error('Feedback submission error:', error);
            alert('Sorry, there was an error sending your feedback. Please try again later.');
        } finally {
            document.getElementById('submitFeedback').disabled = false;
            document.getElementById('submitFeedback').textContent = 'Send Feedback';
        }
    });

    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target === feedbackModal) {
            hideFeedbackModal();
        }
    });

    // Quick feedback function
    async function sendQuickFeedback(messageText, feedbackType, button) {
        button.classList.add('selected');
        button.parentNode.querySelectorAll('.feedback-btn').forEach(btn => {
            if (btn !== button) btn.disabled = true;
        });
        
        try {
            await fetch(FEEDBACK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageText,
                    feedback: feedbackType,
                    timestamp: new Date().toISOString(),
                    sessionId: sessionId,
                    user: userInfo,
                    type: 'quick_feedback'
                })
            });
            console.log('Quick feedback sent:', feedbackType);
        } catch (error) {
            console.error('Failed to send quick feedback:', error);
        }
    }

    // Category button event listeners
    document.querySelectorAll('.category-btn').forEach(button => {
        button.addEventListener('click', function() {
            const category = this.dataset.category;
            showSampleQuestions(category);
        });
    });

    // Click outside to hide sample questions
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.category-container')) {
            hideSampleQuestions();
        }
    });

    // ADD THIS NEW CODE HERE:
    // Remove hover states on touch devices
    document.addEventListener('touchstart', function() {
        // Add touch class to body to disable hover effects
        document.body.classList.add('touch-device');
    });
    
    // Remove focus from buttons after touch
    document.addEventListener('touchend', function(e) {
        if (e.target.tagName === 'BUTTON') {
            e.target.blur();
        }
    });