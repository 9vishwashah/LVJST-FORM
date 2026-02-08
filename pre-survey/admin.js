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
    const citiesCountEl = document.getElementById('citiesCount');
    const districtsCountEl = document.getElementById('districtsCount');
    const dataBody = document.getElementById('dataBody');
    const globalSearch = document.getElementById('globalSearch');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const refreshBtn = document.getElementById('refreshBtn');

    let allRows = [];
    let citiesChart = null;

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

            updateStats(json.analytics);
            renderTable(allRows);

        } catch (err) {
            console.error(err);
            dataBody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:red;padding:40px">Error loading data. Please try refresh.</td></tr>`;
        }
    }

    // --- Rendering ---
    function updateStats(analytics) {
        if (!analytics) return;
        totalCountEl.textContent = analytics.total;
        citiesCountEl.textContent = Object.keys(analytics.byCity || {}).length;
        districtsCountEl.textContent = Object.keys(analytics.byDistrict || {}).length;

        renderChart(analytics.byCity);
    }

    function renderChart(byCity) {
        const ctx = document.getElementById('cityBarChart');
        if (!ctx) return;

        // Sort top 10 cities
        const sorted = Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const labels = sorted.map(x => x[0]);
        const data = sorted.map(x => x[1]);

        if (citiesChart) citiesChart.destroy();

        citiesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Surveys Count',
                    data: data,
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
            }
        });
    }

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
                    `<div class="chip" title="${t.mobile}">${escapeHtml(t.name)}</div>`
                ).join('');
            }

            // Photos formatting
            const mulnayakLink = r.mulnayak_photo_url
                ? `<a href="${r.mulnayak_photo_url}" target="_blank" class="img-link"><i class="fa-solid fa-image"></i> Mulnayak</a>`
                : '';
            const jinalayLink = r.jinalay_photo_url
                ? `<a href="${r.jinalay_photo_url}" target="_blank" class="img-link"><i class="fa-solid fa-gopuram"></i> Jinalay</a>`
                : '';

            const photos = [mulnayakLink, jinalayLink].filter(Boolean).join('<br>');

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
                <td>${escapeHtml(r.derasar_type || '—')}</td>
                <td>${escapeHtml(r.mulnayak_name || '—')}</td>
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

        const headers = [
            'Filler Name', 'Mobile', 'City', 'Taluka', 'Address',
            'Derasar Name', 'Location', 'Derasar Type', 'Full Address',
            'State', 'District', 'Taluka', 'Google Maps',
            'Pedhi Manager', 'Manager Mobile', 'Poojari', 'Poojari Mobile',
            'Mulnayak Name', 'Mulnayak Photo', 'Jinalay Photo', 'Trustees Data'
        ];

        const csvContent = [
            headers.join(','),
            ...allRows.map(r => {
                const trusteesStr = Array.isArray(r.trustees) ? r.trustees.map(t => `${t.name}(${t.mobile})`).join('; ') : '';
                return [
                    r.filler_name, r.filler_mobile, r.filler_city, r.filler_taluka, r.filler_address,
                    r.derasar_name, r.location_name, r.derasar_type, r.full_address,
                    r.state, r.district, r.taluka, r.gmaps_link,
                    r.pedhi_manager_name, r.pedhi_manager_mobile, r.poojari_name, r.poojari_mobile,
                    r.mulnayak_name, r.mulnayak_photo_url, r.jinalay_photo_url, trusteesStr
                ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LVJST_PreSurvey_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    });

    refreshBtn.addEventListener('click', loadData);

    // Init
    updateLoginUI();
    if (getToken()) loadData();

})();
