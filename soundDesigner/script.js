document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startRecording');
    const stopButton = document.getElementById('stopRecording');
    const messagesContainer = document.getElementById('messages');
    const statusElement = document.getElementById('status');
    
    let isRecording = false;
    let mediaRecorder;
    let audioChunks = [];

    // Update status message
    function updateStatus(message, isError = false) {
        statusElement.textContent = message;
        statusElement.style.color = isError ? '#FF6584' : '#495057';
    }

    // Add message to chat
    function addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;
        messageDiv.textContent = text;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Show loading state
    function showLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message assistant-message loading';
        loadingDiv.textContent = 'Processing...';
        messagesContainer.appendChild(loadingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return loadingDiv;
    }

    // Start recording
    startButton.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const loadingDiv = showLoading();
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const formData = new FormData();
                formData.append('audio', audioBlob);

                try {
                    // Send audio to backend
                    const response = await fetch('/process-audio', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();
                    
                    if (response.ok) {
                        messagesContainer.removeChild(loadingDiv);
                        addMessage(data.transcript, true);
                        addMessage(data.response);
                        updateStatus('Ready to record');
                    } else {
                        throw new Error(data.error || 'Failed to process audio');
                    }
                } catch (error) {
                    messagesContainer.removeChild(loadingDiv);
                    console.error('Error:', error);
                    updateStatus(error.message, true);
                }
            };

            mediaRecorder.start();
            isRecording = true;
            startButton.disabled = true;
            stopButton.disabled = false;
            startButton.classList.add('recording');
            updateStatus('Recording... Speak now');
        } catch (error) {
            console.error('Error accessing microphone:', error);
            updateStatus('Error accessing microphone. Please check permissions.', true);
        }
    });

    // Stop recording
    stopButton.addEventListener('click', () => {
        if (isRecording && mediaRecorder) {
            mediaRecorder.stop();
            isRecording = false;
            startButton.disabled = false;
            stopButton.disabled = true;
            startButton.classList.remove('recording');
            updateStatus('Processing audio...');
        }
    });

    // Initial greeting from the assistant
    addMessage("Hello! I'm your sound design assistant. How can I help you with your audio project today?");
}); 