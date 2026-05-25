document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = normalizeEmail(document.getElementById('email').value);
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');
    const loginBtn = document.getElementById('loginBtn');

    messageDiv.textContent = '';
    messageDiv.className = 'message';
    loginBtn.disabled = true;
    loginBtn.innerHTML = 'Authenticating...';

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            saveSession(data.token, data.user);
            messageDiv.textContent = 'Success! Opening your workspace...';
            messageDiv.classList.add('success');
            setTimeout(() => {
                window.location.href = '/dashboard/index.html';
            }, 600);
        } else {
            messageDiv.textContent = data.message || 'Authentication failed';
            messageDiv.classList.add('error');
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'Sign in <span class="arrow">→</span>';
        }
    } catch (err) {
        messageDiv.textContent = 'Server unreachable. Run npm start in the project folder.';
        messageDiv.classList.add('error');
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'Sign in <span class="arrow">→</span>';
    }
});
