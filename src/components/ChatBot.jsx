import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faCamera, faImage } from '@fortawesome/free-solid-svg-icons';
import { v4 as uuidv4 } from 'uuid';
import { marked } from 'marked';
import ImagePreviewModal from './ImagePreviewModal';

// Configure marked options
marked.setOptions({
  breaks: true,      // Add <br> on a single line break
  gfm: true,         // Use GitHub Flavored Markdown
  headerIds: false,  // Don't add IDs to headers (for security)
  mangle: false,     // Don't mangle email addresses
  sanitize: false    // Don't sanitize HTML (we trust the bot's output)
});

// Utility function to generate a session ID
const generateSessionId = () => {
  return uuidv4();
};

function ChatBot({ user, onClose }) {
  // onClose prop is used by the parent component to close the chat
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const fileInputRef = useRef(null);
  const welcomeMessageAddedRef = useRef(false);

  // Extract user name for convenience
  const userName = user?.name || 'User';

  // Initialize session and add welcome message only once
  useEffect(() => {
    // Generate a new session ID
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);

    // Only add welcome message if it hasn't been added yet
    if (!welcomeMessageAddedRef.current) {
      welcomeMessageAddedRef.current = true;

      // Create a personalized welcome message based on available user information
      let welcomeMessage = `
## Hello ${userName}! I'm your agricultural assistant. How can I help you today?

You can ask me about:
* **Fertilizer recommendations**
* **Weather forecasts** for your area
* **Current market prices** for agricultural commodities
* **Crop disease detection** (use the camera icon to take a photo or upload one from your gallery)
* **General agricultural questions**
      `;

      // Add the welcome message
      setMessages([{
        id: Date.now(),
        sender: 'bot',
        content: welcomeMessage,
        timestamp: new Date().toISOString()
      }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Add a message to the chat
  const addMessageToChat = (sender, content) => {
    setMessages(prevMessages => [
      ...prevMessages,
      {
        id: Date.now(),
        sender,
        content,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  // Show typing indicator using DOM manipulation (like the original implementation)
  const showTypingIndicator = () => {
    // First, remove any existing typing indicator
    hideTypingIndicator();

    if (chatMessagesRef.current) {
      // Create a new typing indicator element
      const typingIndicator = document.createElement('div');
      typingIndicator.className = 'message bot-message typing-indicator';
      typingIndicator.id = 'typing-indicator';
      typingIndicator.innerHTML = '<div class="message-content"><span></span><span></span><span></span></div>';

      // Add it to the chat
      chatMessagesRef.current.appendChild(typingIndicator);

      // Scroll to bottom
      scrollToBottom();
    }
  };

  // Hide typing indicator
  const hideTypingIndicator = () => {
    // Find and remove any existing typing indicator
    const existingIndicator = document.getElementById('typing-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
  };

  // Send message to backend
  const sendMessage = async () => {
    const message = inputText.trim();
    if (message === '') return;

    // Add user message to chat
    addMessageToChat('user', message);

    // Clear input
    setInputText('');

    // Show typing indicator
    showTypingIndicator();

    try {
      // Call our backend API to interact with Lex
      const response = await fetch('/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          sessionId: sessionId,
          user: user // Pass the entire user object
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      hideTypingIndicator();
      addMessageToChat('bot', data.message);
    } catch (error) {
      console.error('Error:', error);
      hideTypingIndicator();
      addMessageToChat('bot', 'Sorry, I encountered an error. Please try again later.');
    }
  };



  // Handle input change
  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  // Render message content with markdown support
  const renderMessageContent = (content, sender) => {
    // For user messages, just use plain text
    if (sender === 'user') {
      return { __html: content };
    }

    // For bot messages, render markdown
    return { __html: marked.parse(content) };
  };

  // Handle camera button click
  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.capture = "environment";
      fileInputRef.current.click();
    }
  };

  // Handle upload button click
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.removeAttribute("capture");
      fileInputRef.current.click();
    }
  };

  // Handle image selection
  const handleImageSelection = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if the file is an image
    if (!file.type.match('image.*')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Display the image preview
    const reader = new FileReader();
    reader.onload = function(e) {
      setImagePreviewUrl(e.target.result);
      setSelectedFile(file);
      setModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalOpen(false);
    setImagePreviewUrl('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle image upload and analysis
  const handleImageUploadAndAnalysis = async (cropType) => {
    try {
      if (!selectedFile) {
        alert('Please select an image file');
        return;
      }

      // Create form data for the upload
      const formData = new FormData();
      formData.append('image', selectedFile);

      // Upload the image
      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const uploadData = await uploadResponse.json();

      // Close the modal
      handleModalClose();

      // Add user message with the image
      let userMessage = 'Analyze this crop disease';
      if (cropType) {
        userMessage += ` for ${cropType}`;
      }

      // Add user message to chat
      addMessageToChat('user', userMessage);

      // Show typing indicator
      showTypingIndicator();

      // Send the image URL to the chatbot
      let messageToSend = `CropDiseaseDetection: ${uploadData.url}`;
      if (cropType) {
        messageToSend += ` | CropType: ${cropType}`;
      }

      // Call our backend API
      const messageResponse = await fetch('/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageToSend,
          sessionId: sessionId,
          user: user // Pass the entire user object
        })
      });

      if (!messageResponse.ok) {
        throw new Error('Failed to analyze image');
      }

      const messageData = await messageResponse.json();
      hideTypingIndicator();

      // Add the image to the chat
      addImageToChat('user', uploadData.url);

      // Add the bot response
      addMessageToChat('bot', messageData.message);
    } catch (error) {
      console.error('Error:', error);
      hideTypingIndicator();
      addMessageToChat('bot', 'Sorry, I encountered an error analyzing your image. Please try again later.');
      handleModalClose();
    }
  };

  // Function to add an image to the chat
  const addImageToChat = (sender, imageUrl) => {
    setMessages(prevMessages => [
      ...prevMessages,
      {
        id: Date.now() + 1,
        sender,
        content: `<img src="${imageUrl}" alt="Uploaded image" class="uploaded-image" />`,
        isImage: true,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h3>Hello {userName} 👋</h3>
        <p>Agricultural Assistant</p>
      </div>

      <div className="chat-messages" ref={chatMessagesRef}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
          >
            <div
              className="message-content"
              dangerouslySetInnerHTML={renderMessageContent(message.content, message.sender)}
            />
          </div>
        ))}



        <div ref={messagesEndRef} />
      </div>

      <div className="chatbot-footer">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          className="chatbot-input"
        />
        <button className="chatbot-send" onClick={sendMessage}>
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
        <button className="chatbot-camera" onClick={handleCameraClick} title="Take a photo">
          <FontAwesomeIcon icon={faCamera} />
        </button>
        <button className="chatbot-upload" onClick={handleUploadClick} title="Upload an image">
          <FontAwesomeIcon icon={faImage} />
        </button>

        {/* Hidden file input for image upload */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleImageSelection}
          accept="image/*"
        />
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        imagePreviewUrl={imagePreviewUrl}
        onConfirm={handleImageUploadAndAnalysis}
      />
    </div>
  );
}

export default ChatBot;
