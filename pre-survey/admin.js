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
    const totalTirthsEl = document.getElementById('totalTirths');
    const totalBhojanshalaEl = document.getElementById('totalBhojanshala');
    const totalDharmshalaEl = document.getElementById('totalDharmshala');
    
    const surveyGrid = document.getElementById('surveyGrid');
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

        surveyGrid.innerHTML = `<div style="text-align:center;padding:40px;width:100%"><i class="fa-solid fa-spinner fa-spin"></i> Loading data...</div>`;

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

            // Update stats
            totalCountEl.textContent = json.analytics?.total || allRows.length;
            
            // Calculate new stats
            let countTirth = 0;
            let countBhojanshala = 0;
            let countDharmshala = 0;
            allRows.forEach(r => {
                if (r.is_tirth) countTirth++;
                if (r.bhojanshala_available) countBhojanshala++;
                if (r.dharmshala_available) countDharmshala++;
            });
            totalTirthsEl.textContent = countTirth;
            totalBhojanshalaEl.textContent = countBhojanshala;
            totalDharmshalaEl.textContent = countDharmshala;

            renderCards(allRows);

        } catch (err) {
            console.error(err);
            surveyGrid.innerHTML = `<div style="text-align:center;color:red;padding:40px;width:100%">Error loading data. Please try refresh.</div>`;
        }
    }

    // --- Rendering ---
    function renderCards(rows) {
        if (rows.length === 0) {
            surveyGrid.innerHTML = `<div style="text-align:center;padding:40px;width:100%">No records found.</div>`;
            return;
        }

        surveyGrid.innerHTML = rows.map((r, i) => {
            // Trustees formatting
            let trusteesHtml = '<span style="color:var(--text-muted)">—</span>';
            if (Array.isArray(r.trustees) && r.trustees.length > 0) {
                trusteesHtml = r.trustees.map(t =>
                    `<div class="chip" title="${t.mobile}">
                        ${escapeHtml(t.name)} 
                        <small style="color:var(--text-secondary);font-size:11px"><i class="fa-solid fa-phone" style="font-size:10px"></i> ${escapeHtml(t.mobile)}</small>
                    </div>`
                ).join(' ');
            }

            // Photos formatting
            const mulnayakLink = r.mulnayak_photo_url
                ? `<a href="${r.mulnayak_photo_url}" target="_blank" class="btn-xs-primary"><i class="fa-solid fa-image"></i> Mulnayak Photo</a>`
                : '';
            const jinalayLink = r.jinalay_photo_url
                ? `<a href="${r.jinalay_photo_url}" target="_blank" class="btn-xs-secondary"><i class="fa-solid fa-gopuram"></i> Jinalay Photo</a>`
                : '';
            const trusteeListLink = r.trustee_list_photo_url
                ? `<a href="${r.trustee_list_photo_url}" target="_blank" class="btn-xs-accent"><i class="fa-solid fa-file-contract"></i> Trustee List</a>`
                : '';
            
            const photosArea = [mulnayakLink, jinalayLink, trusteeListLink].filter(Boolean).join('');

            const gmapsBtn = r.gmaps_link
                ? `<a href="${r.gmaps_link}" target="_blank" class="btn-xs-accent" style="margin-top:4px"><i class="fa-solid fa-map-location-dot"></i> GMaps</a>`
                : '';

            const tirthBadge = r.is_tirth ? `<span class="badge yes">Tirth: Yes</span>` : `<span class="badge no">Tirth: No</span>`;
            const bhojanBadge = r.bhojanshala_available ? `<span class="badge yes">Bhojanshala: Yes</span>` : `<span class="badge no">Bhojanshala: No</span>`;
            const dharmBadge = r.dharmshala_available ? `<span class="badge yes">Dharmshala: Yes</span>` : `<span class="badge no">Dharmshala: No</span>`;

            return `
            <div class="survey-card">
                <div class="card-header">
                    <div>
                        <div class="derasar-name">${escapeHtml(r.derasar_name)}</div>
                        <div class="card-location">
                            <i class="fa-solid fa-location-dot"></i> ${escapeHtml(r.location_name)}, ${escapeHtml(r.filler_city)}
                            ${gmapsBtn}
                        </div>
                    </div>
                    <div class="status-badges">
                        ${tirthBadge}
                        ${bhojanBadge}
                        ${dharmBadge}
                    </div>
                </div>

                <div class="card-section">
                    <h4>Mulnayak & Pratima</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span>Mulnayak Name</span>
                            <strong>${escapeHtml(r.mulnayak_name || '—')}</strong>
                        </div>
                        <div class="info-item">
                            <span>Total Pratima</span>
                            <strong>${safe(r.total_pratima_count)}</strong>
                        </div>
                    </div>
                </div>

                <div class="card-section">
                    <h4>Photos</h4>
                    <div class="action-buttons" style="margin-top:0;">
                        ${photosArea || '<span style="color:var(--text-muted);font-size:12px;">No photos uploaded</span>'}
                    </div>
                </div>

                <div class="card-section">
                    <h4>Trustees</h4>
                    <div>${trusteesHtml}</div>
                </div>

                <details class="surveyor-info">
                    <summary><i class="fa-solid fa-chevron-right"></i> Surveyor Info</summary>
                    <div class="surveyor-details">
                        <div class="info-item">
                            <span>Name</span>
                            <strong>${escapeHtml(r.filler_name)}</strong>
                        </div>
                        <div class="info-item">
                            <span>Mobile</span>
                            <strong><a href="tel:${r.filler_mobile}" style="color:var(--primary-blue);text-decoration:none">${escapeHtml(r.filler_mobile)}</a></strong>
                        </div>
                    </div>
                </details>
            </div>
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
        renderCards(filtered);
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
            'mulnayak_name', 'total_pratima_count', 'mulnayak_photo_url', 'jinalay_photo_url', 'trustee_list_photo_url',
            'is_tirth', 'bhojanshala_available', 'dharmshala_available', 'trustees'
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
            const elementToPdf = document.getElementById('surveyGrid');

            // Temporary style for PDF
            const originalMaxHeight = elementToPdf.style.maxHeight;
            const originalOverflow = elementToPdf.style.overflow;
            elementToPdf.style.overflow = 'visible';
            elementToPdf.style.maxHeight = 'none';

            await html2canvas(elementToPdf, { scale: 1.5, useCORS: true }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const imgProps = doc.getImageProperties(imgData);
                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                doc.save(`LVJST_PreSurvey_View_${new Date().toISOString().slice(0, 10)}.pdf`);
            });

            elementToPdf.style.overflow = originalOverflow;
            elementToPdf.style.maxHeight = originalMaxHeight;

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
