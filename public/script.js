// Check if SpeechSynthesis and SpeechRecognition APIs are supported in the browser
if ('speechSynthesis' in window) {
    console.log('Speech Synthesis API is supported!');
} else {
    console.error('Speech Synthesis API is NOT supported in this browser.');
    alert("Sorry, your browser does not support text-to-speech functionality.");
}

if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    console.log('Speech Recognition API is supported!');
} else {
    console.error('Speech Recognition API is NOT supported in this browser.');
    alert("Sorry, your browser does not support speech-to-text functionality.");
}

// Set up Speech Recognition
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;  // Keep recognizing speech
recognition.interimResults = true;  // Show interim results (i.e., while speech is being recognized)
recognition.lang = 'en-US';  // Set language for recognition (change to your preferred language)

recognition.onstart = () => {
    console.log('🎤 Speech recognition started');
};

recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
    }
    document.getElementById('text').value = transcript; // Set the recognized speech as the input text
    console.log('🎤 Recognized text:', transcript);
};

recognition.onerror = (event) => {
    console.log('❌ Speech recognition error:', event.error);
};

recognition.onend = () => {
    console.log('🎤 Speech recognition ended');
};

// Start listening when the button is clicked
function startSpeechToText() {
    recognition.start();
}

// Stop listening
function stopSpeechToText() {
    recognition.stop();
}

async function translateText() {
    const text = document.getElementById('text').value;
    const language = document.getElementById('language').value;
    
    if (!text) {
        alert('Please enter text to translate.');
        return;
    }

    const response = await fetch('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language })
    });

    const data = await response.json();
    document.getElementById('translatedText').innerText = data.translated;
    fetchHistory();
}

async function fetchHistory() {
    const response = await fetch('http://localhost:3000/api/history');
    const history = await response.json();
    
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    history.forEach(entry => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${entry.text} → ${entry.translated} (${entry.language}) 
            <button onclick="deleteHistory(${entry.id})">❌</button>
            <button onclick="speakHistory('${entry.translated}', '${entry.language}')">🔊 Listen</button>`;
        historyList.appendChild(li);
    });
}

async function deleteHistory(id) {
    const response = await fetch(`http://localhost:3000/api/history/${id}`, { method: 'DELETE' });
    const data = await response.json();
    
    if (data.deleted) {
        fetchHistory();
    } else {
        alert("❌ Failed to delete history.");
    }
}

function speakHistory(text, language) {
    if (!text) {
        alert('No translation available to speak.');
        return;
    }

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = language || 'en-US'; // Set language for the speech synthesis
    window.speechSynthesis.speak(speech);
}

function toggleHistory() {
    const historyList = document.getElementById("historyList");
    const toggleButton = document.getElementById("toggleHistory");

    if (historyList.style.display === "none") {
        fetchHistory();
        historyList.style.display = "block";
        toggleButton.innerText = "Hide History";
    } else {
        historyList.style.display = "none";
        toggleButton.innerText = "Show History";
    }
}

async function exportHistory() {
    // Trigger the download of the text file containing translation history
    window.location.href = 'http://localhost:3000/api/export';
}

