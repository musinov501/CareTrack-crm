document.addEventListener('DOMContentLoaded', async () => {
    const auth = requireAuth();
    if (!auth) return;
    const { user } = auth;

    if (!guardPage(['ADMINISTRATOR'], user)) return;

    initApp('settings', user);

    const { response, data } = await apiFetch('/dashboard/stats');
    const el = document.getElementById('settingsStats');
    if (!response.ok || !data) {
        el.textContent = 'Could not load stats';
        return;
    }
    const s = data.stats || {};
    el.innerHTML = `
        <p><strong>${s.doctors ?? 0}</strong> doctors registered</p>
        <p><strong>${s.patients ?? 0}</strong> patient records</p>
        <p><strong>${s.diagnoses ?? 0}</strong> diagnosis entries</p>
        <p><strong>${s.referrals ?? 0}</strong> active referrals</p>
        <p><strong>${s.availableDoctors ?? 0}</strong> doctors available now</p>
    `;
});
