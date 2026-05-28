document.addEventListener('DOMContentLoaded', async () => {
    const auth = requireAuth();
    if (!auth) return;
    const { user } = auth;

    if (!guardPage(['ADMINISTRATOR', 'CLINICIAN'], user)) return;

    initApp('diagnoses', user);

    if (!canManageDiagnoses(user)) {
        document.getElementById('addDiagBtn')?.remove();
    }

    let allDiagnoses = [];
    const tableBody = document.getElementById('diagTableBody');
    const modal = document.getElementById('diagModal');
    const form = document.getElementById('diagForm');

    async function loadDiagnoses(params = {}) {
        const qs = new URLSearchParams(Object.fromEntries(
            Object.entries(params).filter(([, v]) => v)
        )).toString();
        const { response, data } = await apiFetch(`/diagnoses${qs ? `?${qs}` : ''}`);
        if (response.ok) {
            allDiagnoses = data;
            renderDiagnoses(allDiagnoses);
        }
    }

    async function loadPatientsDropdown() {
        const { response, data } = await apiFetch('/patients');
        if (!response.ok) return;
        const select = document.getElementById('diagPatient');
        select.innerHTML = '<option value="">Select Patient</option>';
        data.forEach((p) => {
            select.innerHTML += `<option value="${p.id}">${p.name} (${p.patient_no})</option>`;
        });
    }

    const renderDiagnoses = (list) => {
        tableBody.innerHTML = '';
        if (!list.length) {
            tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No diagnoses found</td></tr>';
            return;
        }
        list.forEach((d) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="patient-id">${d.icd_code}</td>
                <td><strong>${d.description}</strong></td>
                <td><a href="../profile/index.html?id=${d.patient_id}">${d.patient_name}</a><br><small>${d.patient_no}</small></td>
                <td><span class="${severityBadgeClass(d.severity)}">${d.severity}</span></td>
                <td>${new Date(d.date_recorded).toLocaleDateString()}</td>
                <td>
                    ${canManageDiagnoses(user) ? `<button class="btn-sm-edit" data-edit="${d.id}">Edit</button>` : ''}
                    ${user.role === 'ADMINISTRATOR' ? `<button class="btn-sm-delete" data-del="${d.id}">Delete</button>` : ''}
                </td>
            `;
            tableBody.appendChild(tr);
        });
        tableBody.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => openEdit(b.dataset.edit));
        tableBody.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => deleteDiagnosis(b.dataset.del));
    };

    function openEdit(id) {
        const d = allDiagnoses.find((x) => x.id === id);
        if (!d) return;
        document.getElementById('dCode').value = d.icd_code;
        document.getElementById('dName').value = d.description;
        document.getElementById('dSeverity').value = d.severity;
        form.dataset.mode = 'edit';
        form.dataset.id = id;
        loadPatientsDropdown().then(() => {
            document.getElementById('diagPatient').value = d.patient_id;
        });
        modal.style.display = 'flex';
    }

    document.getElementById('addDiagBtn')?.addEventListener('click', () => {
        form.reset();
        delete form.dataset.mode;
        loadPatientsDropdown();
        modal.style.display = 'flex';
    });

    document.querySelectorAll('.close-modal').forEach((b) => {
        b.onclick = () => { modal.style.display = 'none'; };
    });

    form.onsubmit = async (e) => {
        e.preventDefault();
        const isEdit = form.dataset.mode === 'edit';
        const payload = {
            icd_code: document.getElementById('dCode').value,
            description: document.getElementById('dName').value,
            patient_id: document.getElementById('diagPatient').value,
            severity: document.getElementById('dSeverity').value
        };

        const path = isEdit ? `/diagnoses/${form.dataset.id}` : '/diagnoses';
        const { response } = await apiFetch(path, {
            method: isEdit ? 'PUT' : 'POST',
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            modal.style.display = 'none';
            form.reset();
            delete form.dataset.mode;
            loadDiagnoses();
        } else {
            alert('Error saving diagnosis');
        }
    };

    async function deleteDiagnosis(id) {
        if (!confirm('Delete this diagnosis record?')) return;
        const { response } = await apiFetch(`/diagnoses/${id}`, { method: 'DELETE' });
        if (response.ok) loadDiagnoses();
    }

    const applyFilters = debounce(() => {
        loadDiagnoses({
            search: document.getElementById('diagSearch').value,
            severity: document.getElementById('filterSeverity').value
        });
    }, 350);

    document.getElementById('diagSearch').addEventListener('input', applyFilters);
    document.getElementById('filterSeverity')?.addEventListener('change', applyFilters);

    loadDiagnoses();
});
