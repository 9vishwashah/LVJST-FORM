// pre-survey/admin.js
(() => {
    // Reuse existing Auth API, but use new Fetch API for surveys
    const API_LOGIN = '/.netlify/functions/adminLogin';
    const API_FETCH = '/.netlify/functions/adminFetchSurveys'; // New endpoint

    const TOKEN_KEY = 'admin_token';
    const TOKEN_EXP_KEY = 'admin_token_exp';

    // --- Auth Helpers ---
    function setToken(token, expiresIn = 3600) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(TOKEN_EXP_KEY, String(Date.now() + expiresIn * 1000));
    }
    function getToken() {
        const t = localStorage.getItem(TOKEN_KEY);
        const exp = Number(localStorage.getItem(TOKEN_EXP_KEY) || 0);
        if (!t || Date.now() > exp) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(TOKEN_EXP_KEY);
            return null;
        }
        return t;
    }
    function clearToken() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXP_KEY);
    }

    // --- UI Elements ---
    const loginOverlay = document.getElementById('loginOverlay');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');

    const totalCountEl = document.getElementById('totalCount');
    const dataBody = document.getElementById('dataBody');
    const globalSearch = document.getElementById('globalSearch');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const refreshBtn = document.getElementById('refreshBtn');

    let allRows = [];

    // --- Helpers ---
    function safe(v) { return (v === null || v === undefined) ? '—' : String(v); }
    function escapeHtml(s) { return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); }

    // --- Login Logic ---
    function updateLoginUI() {
        if (!getToken()) {
            loginOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        } else {
            loginOverlay.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('adminId').value;
        const password = document.getElementById('adminPass').value;
        const btn = adminLoginForm.querySelector('button');

        btn.disabled = true;
        btn.textContent = 'Verifying...';
        loginError.style.display = 'none';

        try {
            const res = await fetch(API_LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, password })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Login failed');

            setToken(data.token, data.expiresIn);
            updateLoginUI();
            adminLoginForm.reset();
            loadData();
        } catch (err) {
            console.error(err);
            loginError.textContent = 'Invalid credentials';
            loginError.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Login';
        }
    });

    logoutBtn.addEventListener('click', () => {
        clearToken();
        updateLoginUI();
    });

    // --- Data Fetching ---
    async function loadData() {
        if (!getToken()) return;

        dataBody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px"><i class="fa-solid fa-spinner fa-spin"></i> Loading data...</td></tr>`;

        try {
            const res = await fetch(API_FETCH, {
                headers: { 'Authorization': 'Bearer ' + getToken() }
            });

            if (res.status === 401) {
                clearToken();
                updateLoginUI();
                return;
            }

            if (!res.ok) throw new Error('Fetch failed');

            const json = await res.json();
            allRows = json.rows || [];

            // Update only total count
            if (json.analytics) {
                totalCountEl.textContent = json.analytics.total || allRows.length;
            } else {
                totalCountEl.textContent = allRows.length;
            }

            renderTable(allRows);

        } catch (err) {
            console.error(err);
            dataBody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:red;padding:40px">Error loading data. Please try refresh.</td></tr>`;
        }
    }

    // --- Rendering ---
    function renderTable(rows) {
        if (rows.length === 0) {
            dataBody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px">No records found.</td></tr>`;
            return;
        }

        dataBody.innerHTML = rows.map((r, i) => {
            // Trustees formatting
            let trusteesHtml = '—';
            if (Array.isArray(r.trustees) && r.trustees.length > 0) {
                trusteesHtml = r.trustees.map(t =>
                    `<div class="chip" title="${t.mobile}">
                        ${escapeHtml(t.name)} <br>
                        <small style="color:var(--text-secondary);font-size:11px"><i class="fa-solid fa-phone" style="font-size:10px"></i> ${escapeHtml(t.mobile)}</small>
                    </div>`
                ).join('');
            }

            // Photos formatting - styled as buttons
            const mulnayakLink = r.mulnayak_photo_url
                ? `<a href="${r.mulnayak_photo_url}" target="_blank" class="btn-xs-primary"><i class="fa-solid fa-image"></i> Open - Mulnayak</a>`
                : '';
            const jinalayLink = r.jinalay_photo_url
                ? `<a href="${r.jinalay_photo_url}" target="_blank" class="btn-xs-secondary"><i class="fa-solid fa-gopuram"></i> Open - Jinalay</a>`
                : '';

            const photos = [mulnayakLink, jinalayLink].filter(Boolean).join('<br>');

            // GMaps Button
            const gmapsBtn = r.gmaps_link
                ? `<a href="${r.gmaps_link}" target="_blank" class="btn-xs-accent"><i class="fa-solid fa-map-location-dot"></i> Open in GMaps</a>`
                : '—';

            return `
            <tr>
                <td>${i + 1}</td>
                <td>
                    <b>${escapeHtml(r.filler_name)}</b>
                </td>
                <td>
                   <a href="tel:${r.filler_mobile}" style="text-decoration:none;color:var(--primary-blue)">${escapeHtml(r.filler_mobile)}</a>
                </td>
                <td>
                    ${escapeHtml(r.filler_city)}<br>
                    <small style="color:var(--text-secondary)">${escapeHtml(r.filler_taluka)}</small>
                </td>
                <td>
                    <b>${escapeHtml(r.derasar_name)}</b>
                </td>
                <td>${escapeHtml(r.location_name)}</td>
                <td>${gmapsBtn}</td>
                <td>${escapeHtml(r.mulnayak_name || '—')}</td>
                <td>${safe(r.total_pratima_count)}</td>
                <td>${photos || '—'}</td>
                <td>${trusteesHtml}</td>
            </tr>
            `;
        }).join('');
    }

    // --- Search ---
    globalSearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allRows.filter(r => {
            const raw = [
                r.filler_name, r.filler_city, r.derasar_name, r.location_name, r.mulnayak_name
            ].join(' ').toLowerCase();
            return raw.includes(term);
        });
        renderTable(filtered);
    });

    // --- CSV Export ---
    exportCsvBtn.addEventListener('click', () => {
        if (!allRows.length) return alert('No data to export');

        // ALL columns based on data + superset of known fields
        const keys = [
            'id', 'created_at',
            'filler_name', 'filler_mobile', 'filler_address', 'filler_city', 'filler_taluka',
            'derasar_name', 'location_name', 'derasar_type',
            'full_address', 'state', 'district', 'taluka', 'gmaps_link',
            'pedhi_manager_name', 'pedhi_manager_mobile',
            'poojari_name', 'poojari_mobile',
            'mulnayak_name', 'total_pratima_count', 'mulnayak_photo_url', 'jinalay_photo_url',
            'trustees'
        ];

        const csvContent = [
            keys.join(','),
            ...allRows.map(r => {
                return keys.map(k => {
                    let val = r[k];
                    if (k === 'trustees' && Array.isArray(val)) {
                        val = val.map(t => `${t.name}(${t.mobile})`).join('; ');
                    }
                    if (val === null || val === undefined) val = '';
                    return `"${String(val).replace(/"/g, '""')}"`;
                }).join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LVJST_PreSurvey_Full_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    });

    // --- PDF Export ---
    exportPdfBtn.addEventListener('click', async () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'pt', [842, 595]); // A4 Landscape

        exportPdfBtn.disabled = true;
        exportPdfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';

        try {
            const table = document.getElementById('surveyTable');

            // Temporary style for PDF
            const originalMaxHeight = document.querySelector('.table-wrap').style.maxHeight;
            const originalOverflow = document.querySelector('.table-wrap').style.overflow;
            document.querySelector('.table-wrap').style.overflow = 'visible';
            document.querySelector('.table-wrap').style.maxHeight = 'none';

            await html2canvas(table, { scale: 1.5, useCORS: true }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const imgProps = doc.getImageProperties(imgData);
                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                doc.save(`LVJST_PreSurvey_View_${new Date().toISOString().slice(0, 10)}.pdf`);
            });

            document.querySelector('.table-wrap').style.overflow = originalOverflow;
            document.querySelector('.table-wrap').style.maxHeight = originalMaxHeight;

        } catch (e) {
            console.error(e);
            alert('PDF generation failed');
        } finally {
            exportPdfBtn.disabled = false;
            exportPdfBtn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> PDF';
        }
    });

    refreshBtn.addEventListener('click', loadData);

    // Init
    updateLoginUI();
    if (getToken()) loadData();

})();
