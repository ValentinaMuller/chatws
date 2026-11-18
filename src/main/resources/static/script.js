let stompClient = null;
document.getElementById('serverIp').value = window.location.hostname;

function connect() {
    const serverIp = document.getElementById('serverIp').value;
    const endpoint = new URL('/chat', window.location.origin);
    endpoint.hostname = serverIp;
    const socket = new SockJS(endpoint.href);

    stompClient = Stomp.over(socket);
    
    //conexion y subcripcion
    stompClient.connect({}, function (frame) {
        setConnected(true);
        console.log('Connected: ' + frame);
        stompClient.subscribe('/topic/public', function (message) {
            showMessage(JSON.parse(message.body));
        });
    }, function (error) {
        console.error('Error: ' + error);
        setConnected(false);
    });
}

function disconnect() {
    // Desconectar
    if (stompClient !== null) {
        stompClient.disconnect();
    }
    setConnected(false);
    console.log("Disconnected");
}

function setConnected(connected) {
    const status = document.getElementById('status');
    if (connected) {
        status.className = 'connected';
        status.textContent = 'Conectado';
    } else {
        status.className = 'disconnected';
        status.textContent = 'Desconectado';
    }
    document.getElementById('message').disabled = !connected;
}

function sendMessage() {
    const username = document.getElementById('username').value;
    const content = document.getElementById('message').value;
    
    if (content.trim() === '') return;
    
     // Enviar mensaje
    stompClient.send("/app/chat.sendMessage", {'content-type': 'application/json'}, JSON.stringify({
        tipo: 'CHAT',
        usuario: username,
        contenido: content 
    }));
    
    document.getElementById('message').value = '';
}

function showMessage(message) {
    const messages = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    const author = document.createElement('strong');
    author.textContent = message.usuario + ':';
    messageDiv.append(author, ' ' + message.contenido);
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
}

// Allow sending message with Enter key
document.getElementById('message').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
