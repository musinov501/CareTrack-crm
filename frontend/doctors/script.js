document.addEventListener('DOMContentLoaded', async () => {
    const auth = requireAuth();
    if (!auth) return;
    const { user } = auth;

    if (!guardPage(['ADMINISTRATOR', 'RECEPTIONIST'], user)) return;

    initApp('doctors', user);

    const isReceptionist = user.role === 'RECEPTIONIST';
    if (isReceptionist) {
        document.getElementById('doctorsEyebrow').textContent = 'RECEPTION';
        document.getElementById('doctorsTitle').textContent = 'Doctor schedules';
        document.getElementById('doctorsSubtitle').textContent = 'View specialist availability and contact details for appointments.';
        document.getElementById('scheduleSection')?.classList.remove('hidden');
    }

    if (!canManageDoctors(user)) {
        document.getElementById('addDoctorBtn')?.remove();
    }

    let allDoctors = [];
    const grid = document.getElementById('doctorsGrid');
    const modal = document.getElementById('doctorModal');
    const form = document.getElementById('doctorForm');

    async function loadDoctors(params = {}) {
        const qs = new URLSearchParams(Object.fromEntries(
            Object.entries(params).filter(([, v]) => v)
        )).toString();
        const { response, data } = await apiFetch(`/doctors${qs ? `?${qs}` : ''}`);
        if (response.ok) {
            allDoctors = data;
            if (isReceptionist) {
                renderScheduleTable(allDoctors);
                grid.classList.add('compact-grid');
            }
            renderDoctors(allDoctors);
        }
    }

    function renderScheduleTable(list) {
        const tbody = document.getElementById('scheduleTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        list.forEach((d) => {
            const tr = document.createElement('tr');
            const statusClass = (d.status || '').toLowerCase().includes('avail') ? 'referral-approved' : 'referral-pending';
            tr.innerHTML = `
                <td><strong>${d.name}</strong></td>
                <td>${d.department || '—'}</td>
                <td>${d.specialty}</td>
                <td><span class="referral-pill ${statusClass}">${d.status}</span></td>
                <td>${d.patient_count || 0}</td>
                <td>${d.phone || d.email || '—'}</td>
                <td><button class="btn-sm-edit" data-view="${d.id}">View profile</button></td>
            `;
            tbody.appendChild(tr);
        });
        tbody.querySelectorAll('[data-view]').forEach((btn) => {
            btn.onclick = () => {
                window.location.href = `profile/index.html?id=${btn.dataset.view}`;
            };
        });
    }

    const renderDoctors = (list) => {
        grid.innerHTML = '';
        if (!list.length) {
            grid.innerHTML = '<p class="empty-state">No doctors match your filters.</p>';
            return;
        }
        list.forEach((d) => {
            const statusClass = (d.status || 'Available').toLowerCase().includes('avail') ? 'status-available' : 'status-busy';
            const card = document.createElement('div');
            card.className = 'dash-card doctor-card doctor-card-clickable';
            card.dataset.id = d.id;
            card.innerHTML = `
                <div class="doctor-card-header">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=006B6B&color=FCFAF4&size=128" alt="${d.name}" class="doc-avatar">
                    <div class="doc-status ${statusClass}" title="${d.status}"></div>
                </div>
                <h3>${d.name}</h3>
                <p class="doc-specialty">${d.specialty}</p>
                <p class="doc-dept">${d.department || '—'}</p>
                ${d.phone ? `<p class="doc-contact-line">📞 ${d.phone}</p>` : ''}
                <p class="doc-contact-line">✉ ${d.email || '—'}</p>
                <div class="doc-meta">
                    <span>${d.experience || 0} yrs exp.</span>
                    <span>${d.patient_count || 0} patients</span>
                    <span>${d.status}</span>
                </div>
                <div class="doc-actions">
                    <span class="view-profile-hint">Click card for full profile →</span>
                    ${canManageDoctors(user) ? `<button class="btn-sm-edit" data-edit="${d.id}">Edit</button>` : ''}
                    ${canManageDoctors(user) ? `<button class="btn-delete" data-del="${d.id}">Delete</button>` : ''}
                </div>
            `;
            grid.appendChild(card);
        });

        grid.querySelectorAll('.doctor-card-clickable').forEach((card) => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                window.location.href = `profile/index.html?id=${card.dataset.id}`;
            });
        });

        grid.querySelectorAll('[data-edit]').forEach((btn) => {
            btn.onclick = (e) => { e.stopPropagation(); openEdit(btn.dataset.edit); };
        });
        grid.querySelectorAll('[data-del]').forEach((btn) => {
            btn.onclick = (e) => { e.stopPropagation(); deleteDoctor(btn.dataset.del); };
        });
    };

    document.getElementById('addDoctorBtn')?.addEventListener('click', () => {
        form.reset();
        delete form.dataset.mode;
        delete form.dataset.id;
        document.getElementById('emailFields').style.display = 'grid';
        document.querySelector('#doctorModal h2').textContent = 'Add New Specialist';
        document.getElementById('doctorSubmitBtn').textContent = 'Add Doctor';
        modal.style.display = 'block';
    });

    document.querySelectorAll('.close-modal').forEach((btn) => {
        btn.onclick = () => { modal.style.display = 'none'; };
    });

    function openEdit(id) {
        const d = allDoctors.find((x) => x.id === id);
        if (!d) return;
        document.getElementById('dName').value = d.name;
        document.getElementById('dSpecialty').value = d.specialty;
        document.getElementById('dDept').value = d.department || '';
        document.getElementById('dExp').value = d.experience || '';
        document.getElementById('dStatus').value = d.status || 'Available';
        document.getElementById('dPhone').value = d.phone || '';
        document.getElementById('emailFields').style.display = 'none';
        form.dataset.mode = 'edit';
        form.dataset.id = id;
        document.querySelector('#doctorModal h2').textContent = 'Edit Doctor Profile';
        document.getElementById('doctorSubmitBtn').textContent = 'Save Changes';
        modal.style.display = 'block';
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        const isEdit = form.dataset.mode === 'edit';
        const payload = {
            name: document.getElementById('dName').value,
            specialty: document.getElementById('dSpecialty').value,
            department: document.getElementById('dDept').value,
            experience: document.getElementById('dExp').value,
            status: document.getElementById('dStatus').value,
            phone: document.getElementById('dPhone').value,
            email: document.getElementById('dEmail').value,
            password: document.getElementById('dPass').value
        };

        const path = isEdit ? `/doctors/${form.dataset.id}` : '/doctors';
        const { response, data } = await apiFetch(path, {
            method: isEdit ? 'PUT' : 'POST',
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            modal.style.display = 'none';
            form.reset();
            delete form.dataset.mode;
            loadDoctors();
        } else {
            alert(data?.message || 'Error saving doctor');
        }
    };

    async function deleteDoctor(id) {
        if (!confirm('Delete this doctor and linked user account?')) return;
        const { response } = await apiFetch(`/doctors/${id}`, { method: 'DELETE' });
        if (response.ok) loadDoctors();
    }

    const applyFilters = debounce(() => {
        loadDoctors({
            search: document.getElementById('doctorSearch').value,
            department: document.getElementById('filterDept').value,
            status: document.getElementById('filterStatus').value
        });
    }, 350);

    document.getElementById('doctorSearch').addEventListener('input', applyFilters);
    document.getElementById('filterDept').addEventListener('change', applyFilters);
    document.getElementById('filterStatus').addEventListener('change', applyFilters);

    loadDoctors();
});
