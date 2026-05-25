document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = normalizeEmail(document.getElementById('email').value);
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const messageDiv = document.getElementById('message');
    const registerBtn = document.getElementById('registerBtn');

    messageDiv.textContent = '';
    messageDiv.className = 'message';
    registerBtn.disabled = true;
    registerBtn.textContent = 'Processing...';

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });

        const data = await response.json();

        if (response.ok) {
            if (data.token && data.user) {
                saveSession(data.token, data.user);
                messageDiv.textContent = 'Account created! Opening dashboard...';
                messageDiv.classList.add('success');
                setTimeout(() => {
                    window.location.href = '/dashboard/index.html';
                }, 800);
            } else {
                messageDiv.textContent = 'Registration successful! You can sign in now.';
                messageDiv.classList.add('success');
                setTimeout(() => {
                    window.location.href = '/login/index.html';
                }, 1500);
            }
        } else {
            messageDiv.textContent = data.message || 'Registration failed';
            messageDiv.classList.add('error');
            registerBtn.disabled = false;
            registerBtn.textContent = 'Register Account';
        }
    } catch (err) {
        messageDiv.textContent = 'Server unreachable. Run npm start first.';
        messageDiv.classList.add('error');
        registerBtn.disabled = false;
        registerBtn.textContent = 'Register Account';
    }
});
