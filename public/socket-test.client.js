// Socket test client script extracted from inline HTML to satisfy CSP

const logArea = document.getElementById('log');
const statusEl = document.getElementById('status');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const heartbeatBtn = document.getElementById('heartbeatBtn');
const clearLogBtn = document.getElementById('clearLogBtn');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const restButtons = document.querySelectorAll('section:nth-of-type(3) button[data-action]');

let socket = null;

function log(message, data) {
    const timestamp = new Date().toISOString();
    const entry = document.createElement('div');
    entry.innerHTML = `<strong>[${timestamp}]</strong> ${message}`;
    if (data !== undefined) {
        const pre = document.createElement('pre');
        pre.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        entry.appendChild(pre);
    }
    logArea.appendChild(entry);
    logArea.scrollTop = logArea.scrollHeight;
}

function setStatus(text) { statusEl.textContent = text; }
function getAccessToken() { return document.getElementById('accessToken').value.trim(); }
function getBaseUrl() { return document.getElementById('baseUrl').value.trim().replace(/\/$/, ''); }
function getSocketNamespace() {
    const raw = document.getElementById('socketPath').value.trim();
    if (!raw) return '/';
    return raw.startsWith('/') ? raw : `/${raw}`;
}
function ensureSocket() {
    if (!socket || !socket.connected) throw new Error('Socket is not connected. Connect first.');
}

connectBtn.addEventListener('click', () => {
    const token = getAccessToken();
    const namespace = getSocketNamespace();
    const baseUrl = getBaseUrl();

    if (socket?.connected) socket.disconnect();

    log('Attempting socket connection...', { baseUrl, namespace });

    try {
        if (typeof io !== 'function') {
            throw new Error('socket.io client library not loaded (check /socket.io/socket.io.js network request)');
        }
        log('Creating socket client...');
        socket = io(baseUrl + namespace, {
            transports: ['websocket'],
            auth: token ? { token } : undefined,
            query: token ? { token } : undefined,
        });
    } catch (e) {
        log('Socket creation failed', e.message);
        return;
    }

    log('Socket instance created (waiting for connect)');
    socket.on('connect', () => {
        setStatus(`connected (id: ${socket.id})`);
        log('Socket connected', { id: socket.id });
    });
    socket.on('connect_error', (error) => {
        setStatus('connection error');
        log('Connect error', error.message || error);
    });
    socket.on('disconnect', (reason) => {
        setStatus(`disconnected (${reason})`);
        log('Socket disconnected', reason);
    });
    socket.on('chat:message', (payload) => {
        log('Received chat:message', payload);
    });
});

disconnectBtn.addEventListener('click', () => {
    if (!socket) return;
    socket.disconnect();
    setStatus('disconnected');
    log('Manual disconnect requested');
});

heartbeatBtn.addEventListener('click', () => {
    try {
        ensureSocket();
        socket.emit('heartbeat');
        log('Heartbeat emitted');
    } catch (error) {
        log('Heartbeat failed', error.message);
    }
});

clearLogBtn.addEventListener('click', () => { logArea.innerHTML = ''; });

sendMessageBtn.addEventListener('click', () => {
    const content = document.getElementById('messageContent').value.trim();
    const targetUserId = document.getElementById('targetUserId').value.trim();
    if (!content) return log('Cannot send empty message');
    try {
        ensureSocket();
        const payload = { content };
        if (targetUserId) payload.userId = targetUserId;
        socket.emit('chat:send', payload, (response) => log('chat:send ack', response));
        log('Emitted chat:send', payload);
    } catch (error) {
        log('Emit failed', error.message);
    }
});

restButtons.forEach((btn) => {
    btn.addEventListener('click', () => handleRestAction(btn.dataset.action));
});

async function handleRestAction(action) {
    const base = getBaseUrl();
    const token = getAccessToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const page = Number(document.getElementById('page').value || 1);
    const limit = Number(document.getElementById('limit').value || 50);
    const userId = document.getElementById('restUserId').value.trim();
    const message = document.getElementById('restMessage').value.trim();

    const api = async (method, path, body, query) => {
        const url = new URL(base + path);
        if (query) {
            Object.entries(query).forEach(([k, v]) => {
                if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
            });
        }
        log(`${method} ${url.pathname}${url.search}`);
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        const text = await response.text();
        let parsed;
        try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
        if (!response.ok) return log('Request failed', { status: response.status, body: parsed });
        log('Request success', parsed);
    };

    try {
        switch (action) {
            case 'fetch-me': await api('GET', '/api/v1/chat/me'); break;
            case 'fetch-me-messages': await api('GET', '/api/v1/chat/me/messages', null, { page, limit }); break;
            case 'list-chats': await api('GET', '/api/v1/chat/users', null, { page, limit }); break;
            case 'fetch-user-messages':
                if (!userId) throw new Error('User ID is required');
                await api('GET', `/api/v1/chat/users/${userId}/messages`, null, { page, limit });
                break;
            case 'send-user-message':
                if (!userId) throw new Error('User ID is required');
                if (!message) throw new Error('Message body is required');
                await api('POST', `/api/v1/chat/users/${userId}/messages`, { content: message });
                break;
            case 'presence-count': await api('GET', '/api/v1/chat/presence/online/count'); break;
            case 'presence-user':
                if (!userId) throw new Error('User ID is required');
                await api('GET', `/api/v1/chat/presence/${userId}`); break;
            default: log('Unknown action', action);
        }
    } catch (error) {
        log('REST helper error', error.message);
    }
}
