const API_BASE = '/api';
const LOGIN_URL = '/login/index.html';

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
}

function requireAuth() {
    const token = getToken();
    const user = getUser();
    if (!token || !user) {
        window.location.href = LOGIN_URL;
        return null;
    }
    return { token, user };
}

async function apiFetch(path, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

    if (response.status === 401) {
        localStorage.clear();
        window.location.href = LOGIN_URL;
        return { response, data: null };
    }

    let data = null;
    try {
        data = await response.json();
    } catch (_) {
        data = null;
    }
    return { response, data };
}

function formatRole(role) {
    const map = {
        ADMINISTRATOR: 'Administrator',
        CLINICIAN: 'Clinician',
        RECEPTIONIST: 'Receptionist'
    };
    return map[role] || role;
}

function updateUserBlock(user) {
    const emailEl = document.getElementById('userEmail');
    const roleEl = document.getElementById('userRole');
    const nameEl = document.getElementById('userName');
    if (emailEl) emailEl.textContent = user.email;
    if (roleEl) roleEl.textContent = formatRole(user.role);
    if (nameEl) nameEl.textContent = user.name || user.email;
}

function applySidebarRBAC(user) {
    const hideByRole = {
        CLINICIAN: ['doctors', 'referrals', 'settings'],
        RECEPTIONIST: ['diagnoses', 'referrals', 'settings']
    };

    const toHide = hideByRole[user.role] || [];
    document.querySelectorAll('.sidebar-nav .nav-item').forEach((link) => {
        const href = link.getAttribute('href') || '';
        toHide.forEach((key) => {
            if (href.includes(key)) link.style.display = 'none';
        });
    });

    if (user.role === 'ADMINISTRATOR') {
        const settingsLink = document.querySelector('a[href*="settings"]');
        if (settingsLink) settingsLink.style.display = '';
    }
}

/** Redirect if user's role is not allowed on this page */
function guardPage(allowedRoles, user) {
    if (!allowedRoles.includes(user.role)) {
        window.location.href = '/dashboard/index.html';
        return false;
    }
    return true;
}

function setupSignOut() {
    const btn = document.getElementById('signOutBtn');
    if (btn) {
        btn.onclick = () => {
            localStorage.clear();
            window.location.href = LOGIN_URL;
        };
    }
}

function canManageDoctors(user) {
    return user.role === 'ADMINISTRATOR';
}

function canRegisterPatients(user) {
    return user.role === 'ADMINISTRATOR' || user.role === 'RECEPTIONIST';
}

function canEditPatients(user) {
    return user.role === 'ADMINISTRATOR' || user.role === 'CLINICIAN';
}

function canManageDiagnoses(user) {
    return user.role === 'ADMINISTRATOR' || user.role === 'CLINICIAN';
}

function canViewDoctorSchedules(user) {
    return user.role === 'ADMINISTRATOR' || user.role === 'RECEPTIONIST';
}

function severityBadgeClass(severity) {
    return `badge badge-${(severity || 'mild').toLowerCase()}`;
}

function debounce(fn, delay = 300) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), delay);
    };
}

function saveSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}
