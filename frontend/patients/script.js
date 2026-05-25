document.addEventListener('DOMContentLoaded', async () => {
    const auth = requireAuth();
    if (!auth) return;
    const { user } = auth;

    initApp('patients', user);

    if (!canRegisterPatients(user)) {
        document.getElementById('registerPatientBtn')?.remove();
    }

    let allPatients = [];
    const tableBody = document.getElementById('patientsTableBody');
    const modal = document.getElementById('patientModal');
    const form = document.getElementById('patientForm');

    async function loadPatients(params = {}) {
        const qs = new URLSearchParams(Object.fromEntries(
            Object.entries(params).filter(([, v]) => v)
        )).toString();
        const { response, data } = await apiFetch(`/patients${qs ? `?${qs}` : ''}`);
        if (response.ok) {
            allPatients = data;
            renderPatients(allPatients);
        }
    }

    async function loadDoctorsDropdown() {
        const { response, data } = await apiFetch('/doctors');
        if (!response.ok) return;
        const select = document.getElementById('pDoctor');
        select.innerHTML = '<option value="">Select Doctor</option>';
        data.forEach((d) => {
            select.innerHTML += `<option value="${d.id}">${d.name} (${d.specialty})</option>`;
        });
    }

    const renderPatients = (list) => {
        tableBody.innerHTML = '';
        if (!list.length) {
            tableBody.innerHTML = '<tr><td colspan="7" class="empty-state">No patients found</td></tr>';
            return;
        }
        list.forEach((p) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="patient-id">${p.patient_no}</td>
                <td><a href="../profile/index.html?id=${p.id}" class="patient-link"><strong>${p.name}</strong></a></td>
                <td>${new Date(p.date_of_admit).toLocaleDateString()}</td>
                <td>${p.doctor_name || 'Unassigned'}<br><small>${p.department || ''}</small></td>
                <td><span class="status-ongoing">${p.treatment || 'Ongoing'}</span></td>
                <td>${p.ward_no}</td>
                <td>
                    ${canEditPatients(user) ? `<button class="btn-sm-edit" data-edit="${p.id}">Edit</button>` : '<span class="meta">View only</span>'}
                    ${user.role === 'ADMINISTRATOR' ? `<button class="btn-sm-delete" data-del="${p.id}">Delete</button>` : ''}
                </td>
            `;
            tableBody.appendChild(tr);
        });
        tableBody.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => openEdit(b.dataset.edit));
        tableBody.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => deletePatient(b.dataset.del));
    };

    function openEdit(id) {
        const p = allPatients.find((x) => x.id === id);
        if (!p) return;
        document.getElementById('pName').value = p.name;
        document.getElementById('pDate').value = new Date(p.date_of_admit).toISOString().split('T')[0];
        document.getElementById('pWard').value = p.ward_no;
        document.getElementById('pTreatment').value = p.treatment || 'Ongoing';
        form.dataset.mode = 'edit';
        form.dataset.id = id;
        document.querySelector('#patientModal h2').textContent = 'Update Patient';
        loadDoctorsDropdown().then(() => {
            document.getElementById('pDoctor').value = p.doctor_id || '';
        });
        modal.style.display = 'block';
    }

    document.getElementById('registerPatientBtn')?.addEventListener('click', () => {
        form.reset();
        delete form.dataset.mode;
        document.querySelector('#patientModal h2').textContent = 'Register New Patient';
        loadDoctorsDropdown();
        modal.style.display = 'block';
    });

    document.querySelectorAll('.close-modal').forEach((b) => {
        b.onclick = () => { modal.style.display = 'none'; };
    });

    form.onsubmit = async (e) => {
        e.preventDefault();
        const isEdit = form.dataset.mode === 'edit';
        const payload = {
            name: document.getElementById('pName').value,
            date_of_admit: document.getElementById('pDate').value,
            doctor_id: document.getElementById('pDoctor').value || null,
            ward_no: document.getElementById('pWard').value,
            treatment: document.getElementById('pTreatment').value
        };

        const path = isEdit ? `/patients/${form.dataset.id}` : '/patients';
        const { response } = await apiFetch(path, {
            method: isEdit ? 'PUT' : 'POST',
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            modal.style.display = 'none';
            form.reset();
            delete form.dataset.mode;
            loadPatients();
        } else {
            alert('Could not save patient. Check assigned doctor and required fields.');
        }
    };

    async function deletePatient(id) {
        if (!confirm('Delete this patient and all linked diagnoses?')) return;
        const { response } = await apiFetch(`/patients/${id}`, { method: 'DELETE' });
        if (response.ok) loadPatients();
    }

    const applyFilters = debounce(() => {
        loadPatients({
            search: document.getElementById('patientSearch').value,
            department: document.getElementById('filterDept').value,
            treatment: document.getElementById('filterTreatment').value
        });
    }, 350);

    document.getElementById('patientSearch').addEventListener('input', applyFilters);
    document.getElementById('filterDept')?.addEventListener('change', applyFilters);
    document.getElementById('filterTreatment')?.addEventListener('change', applyFilters);

    loadPatients();
});
