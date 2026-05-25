document.addEventListener('DOMContentLoaded', async () => {
    const auth = requireAuth();
    if (!auth) return;
    const { user } = auth;

    if (!guardPage(['ADMINISTRATOR', 'RECEPTIONIST'], user)) return;
    initApp('doctors', user);

    const doctorId = new URLSearchParams(window.location.search).get('id');
    if (!doctorId) {
        alert('No doctor selected');
        window.location.href = '../index.html';
        return;
    }

    let profile = null;
    let feedbackIndex = 0;
    let chartInstance = null;

    const { response, data } = await apiFetch(`/doctors/${doctorId}/profile`);
    if (!response.ok) {
        alert('Could not load doctor profile');
        window.location.href = '../index.html';
        return;
    }

    profile = data;
    renderDoctor(profile);
    renderPatients(profile.patients || []);
    initFeedback(profile.feedback || []);
    initPerformanceChart(profile.performance);

    function renderDoctor(d) {
        const photo = document.getElementById('docPhoto');
        photo.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=0B2F31&color=FCFAF4&size=256`;
        document.getElementById('docName').textContent = d.name;
        document.getElementById('docSpecialty').textContent = d.specialty || d.department;
        document.getElementById('docExp').textContent = `Experience +${d.experience || 0} yrs`;

        const isAvailable = (d.status || '').toLowerCase().includes('avail');
        document.getElementById('pillDuty').textContent = isAvailable ? '● On duty' : '● Off duty';
        document.getElementById('pillAvailable').textContent = `● ${d.status || 'Available'}`;
        document.getElementById('pillAvailable').style.background = isAvailable ? '#e7f6ec' : '#fff4e6';
        document.getElementById('pillAvailable').style.color = isAvailable ? '#008a2e' : '#b25e09';

        document.getElementById('statPatients').textContent = d.patient_count ?? 0;
        document.getElementById('statRevenue').textContent = `£ ${(d.stats?.avgRevenuePerCase || 3200).toLocaleString()}`;
        document.getElementById('statRecovery').textContent = `${d.stats?.recoveryRate ?? 0}%`;

        const phoneBtn = document.getElementById('btnPhone');
        const emailBtn = document.getElementById('btnEmail');
        if (d.phone) phoneBtn.href = `tel:${d.phone}`;
        else phoneBtn.href = '#';
        if (d.email) emailBtn.href = `mailto:${d.email}`;
        else emailBtn.href = '#';
    }

    function renderPatients(patients) {
        const tbody = document.getElementById('doctorPatientsBody');
        tbody.innerHTML = '';
        if (!patients.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No patients assigned to this doctor yet.</td></tr>';
            return;
        }
        patients.forEach((p) => {
            const ongoing = p.treatment !== 'Completed';
            const tr = document.createElement('tr');
            tr.onclick = () => { window.location.href = `../../profile/index.html?id=${p.id}`; };
            tr.innerHTML = `
                <td><span class="status-dot ${ongoing ? 'ongoing' : 'completed'}"></span></td>
                <td class="patient-id">${p.patient_no}</td>
                <td><strong>${p.name}</strong></td>
                <td>${new Date(p.date_of_admit).toLocaleDateString('en-GB')}</td>
                <td>${p.case_name || '—'}</td>
                <td class="${ongoing ? 'treatment-ongoing' : 'treatment-completed'}">${p.treatment || 'Ongoing'}</td>
                <td>${p.ward_no || '—'}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function initFeedback(items) {
        const show = (i) => {
            const fb = items[i];
            if (!fb) return;
            document.getElementById('fbAvatar').src = fb.avatar;
            document.getElementById('fbName').textContent = fb.patientName;
            document.getElementById('fbText').textContent = fb.text;
            document.getElementById('fbStars').textContent = '★'.repeat(fb.rating) + '☆'.repeat(5 - fb.rating);
            document.querySelectorAll('#carouselDots span').forEach((dot, idx) => {
                dot.classList.toggle('active', idx === i);
            });
        };

        const dots = document.getElementById('carouselDots');
        dots.innerHTML = '';
        items.forEach((_, i) => {
            const s = document.createElement('span');
            s.onclick = () => { feedbackIndex = i; show(i); };
            dots.appendChild(s);
        });

        document.getElementById('fbPrev').onclick = () => {
            feedbackIndex = (feedbackIndex - 1 + items.length) % items.length;
            show(feedbackIndex);
        };
        document.getElementById('fbNext').onclick = () => {
            feedbackIndex = (feedbackIndex + 1) % items.length;
            show(feedbackIndex);
        };

        show(0);
    }

    function initPerformanceChart(performance) {
        const canvas = document.getElementById('performanceChart');
        if (!canvas || !performance) return;
        chartInstance?.destroy();
        chartInstance = new Chart(canvas.getContext('2d'), {
            type: 'radar',
            data: {
                labels: performance.labels,
                datasets: [{
                    label: 'Performance',
                    data: performance.values,
                    backgroundColor: 'rgba(11, 47, 49, 0.15)',
                    borderColor: '#0B2F31',
                    borderWidth: 2,
                    pointBackgroundColor: '#006B6B'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { display: false },
                        grid: { color: 'rgba(11, 47, 49, 0.08)' }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
});
