/** Call after sidebar exists in DOM */
function highlightNav(activeKey) {
    document.querySelectorAll('.sidebar-nav .nav-item').forEach((link) => {
        const href = link.getAttribute('href') || '';
        link.classList.toggle('active', href.includes(activeKey));
    });
}

function injectEmergencyFooter() {
    const footer = document.querySelector('.sidebar-footer');
    if (!footer || document.getElementById('emergencyBlock')) return;
    const block = document.createElement('div');
    block.id = 'emergencyBlock';
    block.className = 'emergency-block';
    block.innerHTML = `
        <p class="emergency-label">After-hours emergency</p>
        <a href="tel:+998911585939">+998 91 158 59 39</a>
    `;
    footer.insertBefore(block, footer.firstChild);
}

function initApp(activeNav, user) {
    updateUserBlock(user);
    applySidebarRBAC(user);
    setupSignOut();
    highlightNav(activeNav);
    injectEmergencyFooter();
}
