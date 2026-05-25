document.addEventListener('DOMContentLoaded', async () => {
    const auth = requireAuth();
    if (!auth) return;
    const { user } = auth;

    initApp('patients', user);

    const patientId = new URLSearchParams(window.location.search).get('id');
    if (!patientId) {
        alert('No patient ID provided');
        window.history.back();
        return;
    }

    let profileData = null;

    async function loadProfile() {
        const { response, data } = await apiFetch(`/patients/${patientId}/profile`);
        if (!response.ok) {
            alert('Error loading patient profile.');
            return;
        }
        profileData = data;
        renderProfile(data);
        renderDiagnoses(data.diagnoses || []);
        renderReferrals(data.referrals || []);
    }

    function renderProfile(data) {
        document.getElementById('profName').textContent = data.name;
        document.getElementById('profNo').textContent = `ID: ${data.patient_no}`;
        document.getElementById('profStatus').innerHTML = `● ${data.treatment || 'Registered'}`;
        document.getElementById('profWard').textContent = `Ward: ${data.ward_no}`;
        document.getElementById('profAdmit').textContent = new Date(data.date_of_admit).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        if (data.doctor_id) {
            document.getElementById('docName').textContent = data.doctor_name || 'Assigned Clinician';
            document.getElementById('docDept').textContent = `${data.department || ''} · ${data.doctor_specialty || ''}`;
            document.getElementById('docPhone').textContent = data.doctor_phone || 'Contact via reception';
            document.getElementById('docAvatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.doctor_name)}&background=0B2F31&color=FCFAF4`;
        } else {
            document.getElementById('docName').textContent = 'Unassigned';
            document.getElementById('docDept').textContent = 'No clinician assigned';
            document.getElementById('docPhone').textContent = '—';
        }
    }

    function renderDiagnoses(diagnoses) {
        const tbody = document.getElementById('diagTableBody');
        tbody.innerHTML = '';
        if (!diagnoses.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No clinical history recorded.</td></tr>';
            return;
        }
        diagnoses.forEach((d) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(d.date_recorded).toLocaleDateString()}</td>
                <td class="patient-id">${d.icd_code}</td>
                <td><strong>${d.description}</strong></td>
                <td><span class="${severityBadgeClass(d.severity)}">${d.severity}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderReferrals(referrals) {
        const tbody = document.getElementById('referralsTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!referrals.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No referrals for this patient.</td></tr>';
            return;
        }
        referrals.forEach((r) => {
            const tr = document.createElement('tr');
            const sc = (r.status || 'pending').toLowerCase().replace(/\s/g, '-');
            tr.innerHTML = `
                <td>${new Date(r.created_at).toLocaleDateString()}</td>
                <td>${r.from_department} → ${r.to_department}</td>
                <td>${r.reason || '—'}</td>
                <td><span class="referral-pill referral-${sc}">${r.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    document.getElementById('printReportBtn')?.addEventListener('click', async () => {
        const { response, data } = await apiFetch(`/patients/${patientId}/report`);
        if (!response.ok) {
            alert('Could not generate report');
            return;
        }
        printDiagnosisReport(data);
    });

    if (canManageDiagnoses(user)) {
        document.getElementById('addDiagFromProfile')?.addEventListener('click', () => {
            window.location.href = `../diagnoses/index.html?patient=${patientId}`;
        });
    } else {
        document.getElementById('addDiagFromProfile')?.remove();
    }

    loadProfile();
});

function printDiagnosisReport(report) {
    const win = window.open('', '_blank');
    const rows = (report.diagnoses || []).map((d) => `
        <tr>
            <td>${d.icd_code}</td>
            <td>${d.description}</td>
            <td>${d.severity}</td>
            <td>${new Date(d.date_recorded).toLocaleDateString()}</td>
        </tr>
    `).join('');

    win.document.write(`
        <!DOCTYPE html><html><head><title>Diagnosis Report — ${report.patient.name}</title>
        <style>
            body { font-family: Georgia, serif; padding: 40px; color: #0B2F31; }
            h1 { font-size: 24px; } table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th, td { border: 1px solid #ccc; padding: 10px; text-align: left; font-size: 13px; }
            th { background: #E6EEF0; }
            .meta { color: #666; font-size: 14px; }
        </style></head><body>
        <h1>CareTrack Clinic — Patient Diagnosis Report</h1>
        <p class="meta">Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
        <h2>${report.patient.name} (${report.patient.id})</h2>
        <p>Ward: ${report.patient.ward} · Admitted: ${new Date(report.patient.admitted).toLocaleDateString()} · Treatment: ${report.patient.treatment}</p>
        <p><strong>Assigned doctor:</strong> ${report.assignedDoctor.name || 'Unassigned'} — ${report.assignedDoctor.department || ''} ${report.assignedDoctor.specialty || ''}</p>
        <p><strong>Summary:</strong> ${report.summary.totalDiagnoses} diagnoses (${report.summary.severeCount} severe/critical)</p>
        <table><thead><tr><th>ICD</th><th>Description</th><th>Severity</th><th>Date</th></tr></thead><tbody>${rows || '<tr><td colspan="4">No diagnoses</td></tr>'}</tbody></table>
        <script>window.print();</script>
        </body></html>
    `);
    win.document.close();
}
