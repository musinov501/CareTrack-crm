document.addEventListener('DOMContentLoaded', async () => {
    const auth = requireAuth();
    if (!auth) return;
    const { user } = auth;

    initApp('dashboard', user);

    const greeting = document.getElementById('greetingTitle');
    if (greeting) {
        const hour = new Date().getHours();
        const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
        greeting.textContent = `Good ${time}, ${user.name?.split(' ')[0] || 'there'}.`;
    }

    const dateEl = document.getElementById('liveDate');
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    configureRoleDashboard(user);

    const { response, data } = await apiFetch('/dashboard/stats');

    hideLoader();

    if (!response.ok || !data) {
        showDashboardError();
        return;
    }

    populateStats(data, user);
    renderRecentPatients(data.recentPatients || []);
    renderRecentDiagnoses(data.recentDiagnoses || []);
    renderPendingReferrals(data.pendingReferrals || [], user);

    if (data.severityDist?.length) initSeverityChart(data.severityDist);
    else showChartEmpty('severityChartCard');

    initAdmissionsChart(data.admissionsTrend || []);

    if (data.deptDist?.length && user.role !== 'CLINICIAN') {
        initDeptChart(data.deptDist);
    } else {
        document.getElementById('deptChartCard')?.classList.add('chart-empty-state');
    }

    if (data.doctorStatus?.length && user.role !== 'CLINICIAN') {
        initDoctorStatusChart(data.doctorStatus);
    }
});

function hideLoader() {
    document.getElementById('dashboardLoader')?.classList.add('hidden');
    document.getElementById('dashboardContent')?.classList.remove('hidden');
}

function showDashboardError() {
    hideLoader();
    const main = document.getElementById('dashboardMain');
    if (main) {
        main.innerHTML = '<div class="empty-state" style="padding:80px">Could not load dashboard. <a href="../login/index.html">Sign in again</a></div>';
    }
}

function showChartEmpty(cardId) {
    const card = document.getElementById(cardId);
    if (card) {
        const wrap = card.querySelector('.chart-wrap');
        if (wrap) wrap.innerHTML = '<p class="chart-empty-msg">No data yet</p>';
    }
}

function configureRoleDashboard(user) {
    if (user.role === 'CLINICIAN') {
        document.getElementById('statDoctorsCard')?.remove();
        document.querySelector('a[href="../doctors/index.html"]')?.remove();
        document.getElementById('deptChartCard')?.remove();
        document.getElementById('doctorStatusChartCard')?.remove();
    }
    if (user.role === 'RECEPTIONIST') {
        document.getElementById('statDiagCard')?.remove();
        document.getElementById('diagListSection')?.remove();
        document.getElementById('referralsStatCard')?.remove();
        document.getElementById('referralsSection')?.remove();
        document.getElementById('severityChartCard')?.remove();
        document.getElementById('chartsRow')?.classList.add('single-chart');
    }
}

function populateStats(data) {
    const s = data.stats || {};
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val ?? '0';
    };
    set('totalDoctors', s.doctors);
    set('totalPatients', s.patients);
    set('totalDiagnoses', s.diagnoses);
    set('totalReferrals', s.referrals);

    const availEl = document.getElementById('availableDoctors');
    if (availEl) {
        availEl.textContent = `${s.availableDoctors ?? 0} available now`;
    }
}

function renderRecentPatients(patients) {
    const list = document.getElementById('recentPatients');
    if (!list) return;
    list.innerHTML = '';
    if (!patients.length) {
        list.innerHTML = '<li class="empty-state">No patients yet</li>';
        return;
    }
    patients.forEach((p) => {
        const li = document.createElement('li');
        li.className = 'list-item list-item-clickable';
        li.onclick = () => { window.location.href = `../profile/index.html?id=${p.id}`; };
        li.innerHTML = `
            <div class="item-info">
                <h4>${p.name}</h4>
                <p>${p.patient_no} · ${p.doctor_name || 'Unassigned'}</p>
            </div>
            <div class="item-meta">
                <span class="view-all">Profile →</span>
            </div>
        `;
        list.appendChild(li);
    });
}

function renderRecentDiagnoses(diagnoses) {
    const list = document.getElementById('recentDiagnoses');
    if (!list) return;
    list.innerHTML = '';
    if (!diagnoses.length) {
        list.innerHTML = '<li class="empty-state">No diagnoses recorded</li>';
        return;
    }
    diagnoses.forEach((d) => {
        const li = document.createElement('li');
        li.className = 'list-item';
        li.innerHTML = `
            <div class="item-info">
                <h4>${d.icd_code} — ${d.description}</h4>
                <p>${d.patient_name}</p>
            </div>
            <div class="item-meta">
                <span class="${severityBadgeClass(d.severity)}">${d.severity}</span>
            </div>
        `;
        list.appendChild(li);
    });
}

function renderPendingReferrals(referrals, user) {
    const list = document.getElementById('pendingReferrals');
    if (!list) return;
    if (user.role === 'RECEPTIONIST') return;
    list.innerHTML = '';
    if (!referrals.length) {
        list.innerHTML = '<li class="empty-state">No pending referrals — all clear</li>';
        return;
    }
    referrals.forEach((r) => {
        const li = document.createElement('li');
        li.className = 'list-item';
        const statusClass = (r.status || 'pending').toLowerCase().replace(/\s/g, '-');
        li.innerHTML = `
            <div class="item-info">
                <h4>${r.patient_name}</h4>
                <p>${r.from_department} → ${r.to_department}</p>
            </div>
            <span class="referral-pill referral-${statusClass}">${r.status}</span>
        `;
        list.appendChild(li);
    });
}

const chartInstances = {};
const chartColors = {
    teal: '#006B6B',
    green: '#0B2F31',
    mild: '#86efac',
    moderate: '#fde68a',
    severe: '#fca5a5',
    critical: '#dc2626'
};

function initSeverityChart(severityDist) {
    const canvas = document.getElementById('severityChart');
    if (!canvas) return;
    chartInstances.severity?.destroy();
    chartInstances.severity = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: severityDist.map((s) => s.severity),
            datasets: [{
                data: severityDist.map((s) => parseInt(s.count, 10)),
                backgroundColor: [chartColors.mild, chartColors.moderate, chartColors.severe, chartColors.critical],
                borderWidth: 3,
                borderColor: '#FCFAF4',
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { usePointStyle: true, padding: 16 } }
            },
            cutout: '58%'
        }
    });
}

function initAdmissionsChart(trend) {
    const canvas = document.getElementById('admissionsChart');
    if (!canvas) return;

    let labels, values;
    if (trend.length) {
        labels = trend.map((t) => {
            const dateStr = String(t.day).substring(0, 10);
            const d = new Date(dateStr + 'T00:00:00');
            return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
        });
        values = trend.map((t) => parseInt(t.count, 10));
    } else {
        labels = [];
        values = [];
    }

    chartInstances.admissions?.destroy();
    chartInstances.admissions = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Admissions',
                data: values,
                borderColor: chartColors.teal,
                backgroundColor: 'rgba(0, 107, 107, 0.14)',
                fill: true,
                tension: 0.45,
                pointRadius: 5,
                pointBackgroundColor: chartColors.teal,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(11,47,49,0.06)' } }
            }
        }
    });
}

function initDeptChart(deptDist) {
    const canvas = document.getElementById('deptChart');
    if (!canvas) return;
    chartInstances.dept?.destroy();
    chartInstances.dept = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: deptDist.map((d) => d.department),
            datasets: [{
                data: deptDist.map((d) => parseInt(d.count, 10)),
                backgroundColor: 'rgba(0, 107, 107, 0.75)',
                borderRadius: 10,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

function initDoctorStatusChart(statusData) {
    const canvas = document.getElementById('doctorStatusChart');
    if (!canvas) return;
    chartInstances.docStatus?.destroy();
    chartInstances.docStatus = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: statusData.map((s) => s.status),
            datasets: [{
                data: statusData.map((s) => parseInt(s.count, 10)),
                backgroundColor: ['#22c55e', '#f59e0b', '#94a3b8', '#006B6B'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            cutout: '55%'
        }
    });
}
