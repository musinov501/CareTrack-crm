document.addEventListener('DOMContentLoaded', async () => {
    const auth = requireAuth();
    if (!auth) return;
    const { user } = auth;

    if (!guardPage(['ADMINISTRATOR', 'CLINICIAN'], user)) return;

    initApp('referrals', user);

    if (!['ADMINISTRATOR', 'CLINICIAN'].includes(user.role)) {
        document.getElementById('addReferralBtn')?.remove();
    }

    const table = document.getElementById('referralsTable');
    const modal = document.getElementById('referralModal');
    const form = document.getElementById('referralForm');
    let allRefs = [];

    async function loadReferrals(params = {}) {
        const qs = new URLSearchParams(Object.fromEntries(
            Object.entries(params).filter(([, v]) => v)
        )).toString();
        const { response, data } = await apiFetch(`/referrals${qs ? `?${qs}` : ''}`);
        if (response.ok) {
            allRefs = data;
            render(allRefs);
        }
    }

    async function loadPatients() {
        const { response, data } = await apiFetch('/patients');
        if (!response.ok) return;
        const sel = document.getElementById('refPatient');
        sel.innerHTML = '<option value="">Select patient</option>';
        data.forEach((p) => {
            sel.innerHTML += `<option value="${p.id}">${p.name} (${p.patient_no})</option>`;
        });
    }

    function render(list) {
        table.innerHTML = '';
        if (!list.length) {
            table.innerHTML = '<tr><td colspan="6" class="empty-state">No referrals</td></tr>';
            return;
        }
        list.forEach((r) => {
            const sc = (r.status || 'pending').toLowerCase().replace(/\s/g, '-');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${r.patient_name}</strong><br><small>${r.patient_no}</small></td>
                <td>${r.from_department} → ${r.to_department}</td>
                <td>${r.reason || '—'}</td>
                <td><span class="referral-pill referral-${sc}">${r.status}</span></td>
                <td>${new Date(r.created_at).toLocaleDateString()}</td>
                <td>
                    ${user.role === 'ADMINISTRATOR' || user.role === 'CLINICIAN' ? `<button class="btn-sm-edit" data-edit="${r.id}">Edit</button>` : ''}
                    ${user.role === 'ADMINISTRATOR' ? `<button class="btn-sm-delete" data-del="${r.id}">Delete</button>` : ''}
                </td>
            `;
            table.appendChild(tr);
        });
        table.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => openEdit(b.dataset.edit));
        table.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => deleteRef(b.dataset.del));
    }

    function openEdit(id) {
        const r = allRefs.find((x) => x.id === id);
        if (!r) return;
        loadPatients().then(() => {
            document.getElementById('refPatient').value = r.patient_id;
            document.getElementById('refFrom').value = r.from_department;
            document.getElementById('refTo').value = r.to_department;
            document.getElementById('refReason').value = r.reason || '';
            document.getElementById('refStatus').value = r.status;
            form.dataset.mode = 'edit';
            form.dataset.id = id;
            modal.style.display = 'flex';
        });
    }

    document.getElementById('addReferralBtn')?.addEventListener('click', () => {
        form.reset();
        delete form.dataset.mode;
        loadPatients();
        modal.style.display = 'flex';
    });

    document.querySelectorAll('.close-modal').forEach((b) => {
        b.onclick = () => { modal.style.display = 'none'; };
    });

    form.onsubmit = async (e) => {
        e.preventDefault();
        const isEdit = form.dataset.mode === 'edit';
        const payload = {
            patient_id: document.getElementById('refPatient').value,
            from_department: document.getElementById('refFrom').value,
            to_department: document.getElementById('refTo').value,
            reason: document.getElementById('refReason').value,
            status: document.getElementById('refStatus').value
        };

        const path = isEdit ? `/referrals/${form.dataset.id}` : '/referrals';
        const { response } = await apiFetch(path, {
            method: isEdit ? 'PUT' : 'POST',
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            modal.style.display = 'none';
            form.reset();
            delete form.dataset.mode;
            loadReferrals();
        } else {
            alert('Could not save referral');
        }
    };

    async function deleteRef(id) {
        if (!confirm('Delete referral?')) return;
        const { response } = await apiFetch(`/referrals/${id}`, { method: 'DELETE' });
        if (response.ok) loadReferrals();
    }

    const applyFilters = debounce(() => {
        loadReferrals({
            search: document.getElementById('refSearch').value,
            status: document.getElementById('filterStatus').value
        });
    }, 350);

    document.getElementById('refSearch').addEventListener('input', applyFilters);
    document.getElementById('filterStatus').addEventListener('change', applyFilters);

    loadReferrals();
});
