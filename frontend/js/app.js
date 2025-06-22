// Placeholder for frontend JavaScript
document.addEventListener('DOMContentLoaded', () => {
    console.log('ZxD Panel frontend script loaded.');

    const loginSection = document.getElementById('login-section');
    const controlPanel = document.getElementById('control-panel');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutButton = document.getElementById('logout-button');

    const attackForm = document.getElementById('attack-form');
    const startAttackButton = document.getElementById('start-attack');
    const stopAttackButton = document.getElementById('stop-attack');
    const logsConsole = document.getElementById('logs-console');
    const historyTableBody = document.getElementById('history-table-body');

    const cpuUsageEl = document.getElementById('cpu-usage');
    const ramUsageEl = document.getElementById('ram-usage');
    const activeAttacksEl = document.getElementById('active-attacks');

    // Mock socket for now, replace with actual Socket.IO client
    const socket = {
        on: (event, callback) => console.log(`Mock socket: registered listener for ${event}`),
        emit: (event, data) => console.log(`Mock socket: emitting ${event}`, data),
        connect: () => console.log('Mock socket: connected'),
        disconnect: () => console.log('Mock socket: disconnected')
    };
    // socket.connect(); // Uncomment when real Socket.IO is implemented

    // Check initial auth state (e.g., from a session cookie or token)
    checkAuthState();

    function checkAuthState() {
        // This function would typically check a token in localStorage or make an API call
        // For now, we'll assume the user is logged out initially.
        const isAuthenticated = sessionStorage.getItem('isAuthenticated');
        if (isAuthenticated) {
            showControlPanel();
        } else {
            showLogin();
        }
    }

    function showLogin() {
        loginSection.classList.remove('hidden');
        controlPanel.classList.add('hidden');
        loginError.textContent = '';
    }

    function showControlPanel() {
        loginSection.classList.add('hidden');
        controlPanel.classList.remove('hidden');
        // connectWebSocket(); // Connect WebSocket when showing control panel
        // loadAttackHistory();
        // updateSystemStatus();
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = loginForm.username.value;
        const password = loginForm.password.value;
        loginError.textContent = '';

        // TODO: Replace with actual API call
        // Simulating API call
        if (username === 'admin' && password === 'password') { // Dummy credentials
            sessionStorage.setItem('isAuthenticated', 'true'); // Use sessionStorage for demo
            addLog('Login successful. Welcome!');
            showControlPanel();
        } else {
            loginError.textContent = 'Invalid username or password.';
            addLog('Login attempt failed.');
        }
    });

    logoutButton.addEventListener('click', () => {
        // TODO: Call backend logout endpoint
        sessionStorage.removeItem('isAuthenticated');
        addLog('Logged out.');
        showLogin();
        // if (socket) socket.disconnect(); // Disconnect WebSocket on logout
    });

    attackForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const target = attackForm.target.value;
        const port = attackForm.port.value;
        const duration = attackForm.duration.value;
        const method = attackForm.method.value;
        const threads = attackForm.threads.value;
        const proxyList = attackForm['proxy-list'].value.split('\n').filter(p => p.trim() !== '');

        addLog(`Starting attack: ${method} on ${target}:${port} for ${duration}s, ${threads} threads.`);

        // TODO: Emit 'start_attack' event to backend via WebSocket
        socket.emit('start_attack', { target, port, duration, method, threads, proxyList });

        startAttackButton.disabled = true;
        stopAttackButton.disabled = false;
        startAttackButton.classList.add('opacity-50', 'cursor-not-allowed');
        stopAttackButton.classList.remove('opacity-50', 'cursor-not-allowed');
    });

    stopAttackButton.addEventListener('click', () => {
        addLog('Stopping attack...');
        // TODO: Emit 'stop_attack' event to backend via WebSocket
        socket.emit('stop_attack', {});

        startAttackButton.disabled = false;
        stopAttackButton.disabled = true;
        startAttackButton.classList.remove('opacity-50', 'cursor-not-allowed');
        stopAttackButton.classList.add('opacity-50', 'cursor-not-allowed');
    });

    function addLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.innerHTML = `<span class="text-gray-500">${timestamp}</span>: <span class="${type === 'error' ? 'text-red-400' : (type === 'success' ? 'text-green-400' : 'text-gray-300')}">${message}</span>`;
        logsConsole.appendChild(logEntry);
        logsConsole.scrollTop = logsConsole.scrollHeight; // Auto-scroll to bottom
    }

    function updateSystemStatus(data) {
        // Example: data = { cpu: '15%', ram: '45%', active_attacks: 1 }
        if (cpuUsageEl && data && data.cpu !== undefined) cpuUsageEl.textContent = data.cpu;
        if (ramUsageEl && data && data.ram !== undefined) ramUsageEl.textContent = data.ram;
        if (activeAttacksEl && data && data.active_attacks !== undefined) activeAttacksEl.textContent = data.active_attacks;
    }

    function loadAttackHistory() {
        // TODO: Fetch history from backend and populate table
        // Simulating history
        const dummyHistory = [
            { timestamp: new Date(Date.now() - 3600000).toLocaleString(), target: '1.1.1.1', port: 80, method: 'UDP', duration: 60, status: 'Completed', details: 'View Log' },
            { timestamp: new Date(Date.now() - 7200000).toLocaleString(), target: 'example.com', port: 443, method: 'TCP', duration: 120, status: 'Stopped', details: 'View Log' },
        ];

        historyTableBody.innerHTML = ''; // Clear existing rows
        if (dummyHistory.length === 0) {
            historyTableBody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center">No attack history yet.</td></tr>';
            return;
        }

        dummyHistory.forEach(item => {
            const row = historyTableBody.insertRow();
            row.className = 'bg-gray-800 border-b border-gray-700 hover:bg-gray-700';
            row.innerHTML = `
                <td class="px-6 py-4">${item.timestamp}</td>
                <td class="px-6 py-4 font-medium text-gray-200 whitespace-nowrap">${item.target}</td>
                <td class="px-6 py-4">${item.port}</td>
                <td class="px-6 py-4">${item.method}</td>
                <td class="px-6 py-4">${item.duration}s</td>
                <td class="px-6 py-4"><span class="${item.status === 'Completed' ? 'text-green-400' : 'text-yellow-400'}">${item.status}</span></td>
                <td class="px-6 py-4"><button class="text-blue-400 hover:underline">${item.details}</button></td>
            `;
        });
    }

    // Mock WebSocket event handlers (replace with actual socket.on listeners)
    // socket.on('connect', () => {
    //     addLog('Connected to server via WebSocket.', 'success');
    // });

    // socket.on('disconnect', () => {
    //     addLog('Disconnected from server.', 'error');
    // });

    // socket.on('log_update', (logMessage) => {
    //     addLog(logMessage.data, logMessage.type || 'info');
    // });

    // socket.on('attack_status', (status) => {
    //     addLog(`Attack status: ${status.message}`);
    //     if (status.completed || status.error) {
    //         startAttackButton.disabled = false;
    //         stopAttackButton.disabled = true;
    //         loadAttackHistory(); // Refresh history
    //     }
    //     updateSystemStatus({ active_attacks: status.active_attacks_count });
    // });

    // socket.on('system_status', (data) => {
    //    updateSystemStatus(data);
    // });

    // Periodically update system status (example)
    // setInterval(() => {
    //     if (sessionStorage.getItem('isAuthenticated')) {
    //         socket.emit('get_system_status'); // Request status from backend
    //     }
    // }, 5000);

    // Initial UI setup
    addLog('Frontend initialized. Please log in.');
    // loadAttackHistory(); // Load history on page load if user is already authenticated (handled by checkAuthState)
});
