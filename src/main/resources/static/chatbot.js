/* === FlavorVerse AI Chatbot Logic === */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Chatbot kaga namma HTML elements ah create panrom
    const chatBubble = document.createElement('div');
    chatBubble.id = 'ai-chat-bubble';
    chatBubble.innerHTML = '💬'; 
    chatBubble.title = 'Chat with StarkBot';
    
    const chatWindow = document.createElement('div');
    chatWindow.id = 'ai-chat-window';
    chatWindow.style.display = 'none'; 

    chatWindow.innerHTML = `
        <div id="ai-chat-header">
            <span>StarkBot Assistant</span>
            <span id="ai-chat-close-btn">&times;</span>
        </div>
        <div id="ai-chat-body">
            <div class="chat-message bot-message">
                <p>Hello! I'm StarkBot. Ask me anything about our menu items or restaurants!</p>
            </div>
        </div>
        <div id="ai-chat-footer">
            <input type="text" id="ai-chat-input" placeholder="Ask a question (e.g., 'What is Ghee Dosa?')">
            <button id="ai-chat-send-btn">Send</button>
        </div>
    `;
    
    document.body.appendChild(chatBubble);
    document.body.appendChild(chatWindow);

    
    // 2. Namma variables ah select pannikkarom
    const chatBody = document.getElementById('ai-chat-body');
    const chatInput = document.getElementById('ai-chat-input');
    const sendBtn = document.getElementById('ai-chat-send-btn');
    const closeBtn = document.getElementById('ai-chat-close-btn');
    chatBubble.addEventListener('click', () => {
    const isHidden = chatWindow.style.display === 'none';
    
    // FIX: 'block'-kku badhila 'flex' use panrom
    chatWindow.style.display = isHidden ? 'flex' : 'none';
    
    if (isHidden) {
        chatInput.focus(); 
    }
    });

    closeBtn.addEventListener('click', () => {
        chatWindow.style.display = 'none';
    });

    sendBtn.addEventListener('click', sendMessage);

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    
    // 4. Main Chat Logic (Send Message)
    async function sendMessage() {
        const userMessage = chatInput.value.trim();
        if (userMessage === '') return; 

        addMessageToChat(userMessage, 'user-message');
        chatInput.value = ''; 
        
        addMessageToChat('Typing...', 'bot-message loading');

        // === IDHU THAAN PUTHU "EFFICIENT" LOGIC ===
        // Namma ippo endha page la irukkom nu paakurom
        let currentRestaurantId = null;
        if (window.location.pathname.endsWith('menu.html')) {
            const params = new URLSearchParams(window.location.search);
            currentRestaurantId = params.get('id'); // e.g., "1"
        }
        // ===========================================

        try {
            // Namma puthu backend API endpoint ah call panrom
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // === KELVI KOODAVE, RESTAURANT ID YUM ANUPPUROM ===
                body: JSON.stringify({ 
                    prompt: userMessage,
                    restaurantId: currentRestaurantId ? parseInt(currentRestaurantId) : null
                })
            });

            if (!response.ok) {
                throw new Error('AI response was not ok.');
            }

            const aiResponse = await response.text(); 
            
            const loadingMessage = chatBody.querySelector('.loading');
            if (loadingMessage) {
                loadingMessage.remove();
            }

            addMessageToChat(aiResponse, 'bot-message');

        } catch (error) {
            console.error("AI Chat Error:", error);
            const loadingMessage = chatBody.querySelector('.loading');
            if (loadingMessage) {
                loadingMessage.classList.remove('loading');
                loadingMessage.innerHTML = '<p>Sorry, I am unable to respond right now. Please try again later.</p>';
            }
        }
    }

    // 5. Helper Function (Chat la message ah add panna)
    function addMessageToChat(text, className) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${className}`;
        
        const p = document.createElement('p');
        p.textContent = text;
        messageElement.appendChild(p);
        
        chatBody.appendChild(messageElement);
        
        chatBody.scrollTop = chatBody.scrollHeight;
    }
});