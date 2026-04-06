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

    // Modal elements
    const modalOverlay = document.getElementById('detailsModalOverlay');
    const modalContent = document.getElementById('detailsModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalDerasarName = document.getElementById('modalDerasarName');
    const modalLocation = document.getElementById('modalLocation');
    const modalBody = document.getElementById('modalBody');

    let allRows = [];

    // --- Helpers ---
    function safe(v) { return (v === null || v === undefined) ? '—' : String(v); }
    function escapeHtml(s) { return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); }

    // --- Login Logic ---
    function updateLoginUI() {
        if (!getToken()) {
            loginOverlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        } else {
            loginOverlay.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('adminId').value;
        const password = document.getElementById('adminPass').value;
        const btn = adminLoginForm.querySelector('button');

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
        loginError.classList.add('hidden');

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
            loginError.classList.remove('hidden');
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

        surveyGrid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-500"><i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i><p>Loading survey data...</p></div>`;

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
            surveyGrid.innerHTML = `<div class="col-span-full py-12 text-center text-red-500"><i class="fa-solid fa-circle-exclamation text-2xl mb-2"></i><p>Error loading data. Please try refresh.</p></div>`;
        }
    }

    // --- Rendering ---
    function renderCards(rows) {
        if (rows.length === 0) {
            surveyGrid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-500"><i class="fa-solid fa-inbox text-2xl mb-2"></i><p>No records found.</p></div>`;
            return;
        }

        surveyGrid.innerHTML = rows.map((r, i) => {
            const tirthBadge = r.is_tirth ? `<span class="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">Tirth: Yes</span>` : `<span class="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">Tirth: No</span>`;
            
            return `
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                <div class="p-5 border-b border-slate-100 flex-1">
                    <div class="flex justify-between items-start gap-2 mb-3">
                        <h3 class="text-lg font-bold text-slate-800 leading-tight">${escapeHtml(r.derasar_name)}</h3>
                        <div class="flex flex-col items-end gap-1 shrink-0">
                            ${tirthBadge}
                        </div>
                    </div>
                    
                    <p class="text-xs text-slate-500 flex items-start gap-1.5 mb-4">
                        <i class="fa-solid fa-location-dot mt-0.5"></i> 
                        <span>${escapeHtml(r.location_name)}, ${escapeHtml(r.filler_city)}</span>
                    </p>

                    <div class="grid grid-cols-2 gap-3 bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs">
                        <div>
                            <span class="block text-slate-400 font-semibold mb-0.5 uppercase text-[10px] tracking-wider">Surveyor</span>
                            <span class="font-medium text-slate-700 truncate block capitalize">${escapeHtml(r.filler_name)}</span>
                        </div>
                        <div>
                            <span class="block text-slate-400 font-semibold mb-0.5 uppercase text-[10px] tracking-wider">Mulnayak</span>
                            <span class="font-medium text-slate-700 truncate block capitalize">${escapeHtml(r.mulnayak_name || '—')}</span>
                        </div>
                    </div>
                </div>
                
                <button onclick="window.openDetailsModal(${allRows.indexOf(r)})" class="w-full bg-slate-50 hover:bg-primary-50 text-primary-600 font-semibold py-3 flex justify-center items-center gap-2 text-sm transition-colors border-t border-slate-100">
                    View All Details <i class="fa-solid fa-arrow-right text-xs"></i>
                </button>
            </div>
            `;
        }).join('');
    }

    // --- Modal Logic ---
    window.openDetailsModal = function(index) {
        const r = allRows[index];
        if (!r) return;

        // Populate header
        modalDerasarName.textContent = r.derasar_name;
        modalLocation.innerHTML = `<i class="fa-solid fa-location-dot"></i> <span>${escapeHtml(r.location_name)}, ${escapeHtml(r.filler_city)} - ${escapeHtml(r.state || '')}</span>`;

        // Format Photos
        const photos = [
            r.mulnayak_photo_url ? `<a href="${r.mulnayak_photo_url}" target="_blank" class="flex flex-col items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:border-primary-400 hover:shadow-sm transition-all"><i class="fa-solid fa-image text-2xl text-blue-500"></i><span class="text-xs font-semibold text-slate-600 text-center">Mulnayak</span></a>` : '',
            r.jinalay_photo_url ? `<a href="${r.jinalay_photo_url}" target="_blank" class="flex flex-col items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:border-primary-400 hover:shadow-sm transition-all"><i class="fa-solid fa-gopuram text-2xl text-purple-500"></i><span class="text-xs font-semibold text-slate-600 text-center">Jinalay</span></a>` : '',
            r.trustee_list_photo_url ? `<a href="${r.trustee_list_photo_url}" target="_blank" class="flex flex-col items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:border-primary-400 hover:shadow-sm transition-all"><i class="fa-solid fa-file-contract text-2xl text-amber-500"></i><span class="text-xs font-semibold text-slate-600 text-center">Trustee List</span></a>` : ''
        ].filter(Boolean).join('');

        // Format Trustees
        let trusteesHtml = '<p class="text-slate-500 text-sm italic">No trustee details provided.</p>';
        if (Array.isArray(r.trustees) && r.trustees.length > 0) {
            trusteesHtml = `<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">` + r.trustees.map(t =>
                `<div class="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center">
                    <div class="font-medium text-sm text-slate-700">${escapeHtml(t.name)}</div>
                    <a href="tel:${t.mobile}" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap"><i class="fa-solid fa-phone text-[10px]"></i> ${escapeHtml(t.mobile)}</a>
                </div>`
            ).join('') + `</div>`;
        }

        // Build Body HTML
        modalBody.innerHTML = `
            <div class="space-y-6">
                <!-- Status Badges Row -->
                <div class="flex flex-wrap gap-2">
                    <span class="${r.is_tirth ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'} border px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5"><i class="fa-solid ${r.is_tirth ? 'fa-check' : 'fa-xmark'}"></i> Tirth</span>
                    <span class="${r.bhojanshala_available ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-500'} border px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5"><i class="fa-solid fa-bowl-food"></i> Bhojanshala</span>
                    <span class="${r.dharmshala_available ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-slate-50 border-slate-200 text-slate-500'} border px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5"><i class="fa-solid fa-bed"></i> Dharmshala</span>
                </div>

                <!-- Surveyor & Location Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Surveyor Details</h4>
                        <div class="space-y-2 text-sm">
                            <p class="flex justify-between"><span class="text-slate-500">Name:</span> <strong class="text-slate-800 capitalize">${escapeHtml(r.filler_name)}</strong></p>
                            <p class="flex justify-between"><span class="text-slate-500">Mobile:</span> <a href="tel:${r.filler_mobile}" class="font-bold text-primary-600 hover:underline">${escapeHtml(r.filler_mobile)}</a></p>
                            <p class="flex justify-between"><span class="text-slate-500">City / Taluka:</span> <span class="font-medium text-slate-800">${escapeHtml(r.filler_city)} / ${escapeHtml(r.filler_taluka)}</span></p>
                            ${r.filler_address ? `<p class="flex justify-between border-t border-slate-200 mt-2 pt-2"><span class="text-slate-500 block w-20 shrink-0">Address:</span> <span class="font-medium text-slate-800 text-right text-xs leading-relaxed">${escapeHtml(r.filler_address)}</span></p>` : ''}
                        </div>
                    </div>
                    
                    <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Location Data</h4>
                        <div class="space-y-2 text-sm">
                            <p class="flex justify-between"><span class="text-slate-500">Full Address:</span> <span class="font-medium text-slate-800 text-right truncate max-w-[200px]" title="${escapeHtml(r.full_address)}">${escapeHtml(r.full_address || '—')}</span></p>
                            <p class="flex justify-between"><span class="text-slate-500">District:</span> <span class="font-medium text-slate-800">${escapeHtml(r.district || '—')}</span></p>
                            <p class="flex justify-between"><span class="text-slate-500">Taluka:</span> <span class="font-medium text-slate-800">${escapeHtml(r.taluka || '—')}</span></p>
                            ${r.gmaps_link ? `<div class="mt-3 pt-3 border-t border-slate-200"><a href="${r.gmaps_link}" target="_blank" class="w-full block text-center bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold py-2 rounded-lg text-xs transition-colors"><i class="fa-solid fa-map-location-dot"></i> Open deeply in GMaps</a></div>` : ''}
                        </div>
                    </div>
                </div>

                <!-- Pedhi & Poojari & Mulnayak -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="border border-slate-200 rounded-xl p-4">
                        <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2"><i class="fa-solid fa-user-tie"></i> Pedhi Manager</h4>
                        ${r.pedhi_manager_name ? `
                            <p class="font-bold text-slate-800 text-sm">${escapeHtml(r.pedhi_manager_name)}</p>
                            ${r.pedhi_manager_mobile ? `<a href="tel:${r.pedhi_manager_mobile}" class="text-xs text-primary-600 hover:text-primary-700 font-semibold mt-1 block"><i class="fa-solid fa-phone"></i> ${escapeHtml(r.pedhi_manager_mobile)}</a>` : ''}
                        ` : '<p class="text-xs text-slate-400 italic">Not available</p>'}
                    </div>
                    <div class="border border-slate-200 rounded-xl p-4">
                        <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2"><i class="fa-solid fa-hands-praying"></i> Poojari</h4>
                        ${r.poojari_name ? `
                            <p class="font-bold text-slate-800 text-sm">${escapeHtml(r.poojari_name)}</p>
                            ${r.poojari_mobile ? `<a href="tel:${r.poojari_mobile}" class="text-xs text-primary-600 hover:text-primary-700 font-semibold mt-1 block"><i class="fa-solid fa-phone"></i> ${escapeHtml(r.poojari_mobile)}</a>` : ''}
                        ` : '<p class="text-xs text-slate-400 italic">Not available</p>'}
                    </div>
                    <div class="border border-slate-200 rounded-xl p-4 bg-primary-50 border-primary-100">
                        <h4 class="text-[10px] font-bold text-primary-400 uppercase tracking-wider mb-2">Mulnayak details</h4>
                        <p class="font-bold text-primary-900 text-sm leading-tight">${escapeHtml(r.mulnayak_name || '—')}</p>
                        <p class="text-xs text-primary-700 font-medium mt-1">Pratimas: ${safe(r.total_pratima_count)}</p>
                    </div>
                </div>

                <!-- Trustees -->
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 class="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><i class="fa-solid fa-users text-slate-400"></i> Trustees & Contacts</h4>
                    ${trusteesHtml}
                </div>

                <!-- Photos -->
                <div class="border-t border-slate-200 pt-5">
                    <h4 class="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><i class="fa-solid fa-images text-slate-400"></i> Attached Photos</h4>
                    <div class="grid grid-cols-3 gap-3">
                        ${photos || '<p class="col-span-3 text-sm text-slate-500 italic">No photos uploaded for this survey.</p>'}
                    </div>
                </div>
                
                <div class="text-center pt-4 pb-2">
                    <p class="text-[10px] text-slate-400 leading-tight">Survey submitted at:<br>${new Date(r.created_at).toLocaleString()}</p>
                </div>
            </div>
        `;

        // Show Modal
        modalOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Trigger animation
        requestAnimationFrame(() => {
            modalContent.classList.remove('translate-y-full');
            modalContent.classList.remove('sm:translate-y-full');
            if (window.innerWidth < 640) {
                 // Mobile slide up
                 modalContent.classList.remove('translate-y-full');
            }
        });
    };

    function closeModal() {
        modalContent.classList.add('translate-y-full');
        setTimeout(() => {
            modalOverlay.classList.add('hidden');
            document.body.style.overflow = '';
        }, 150);
    }

    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

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

    const exportColumns = [
        { key: 'id', label: 'ID' },
        { key: 'created_at', label: 'Submitted On' },
        { key: 'filler_name', label: 'Surveyor Name' },
        { key: 'filler_mobile', label: 'Surveyor Mobile' },
        { key: 'filler_city', label: 'City' },
        { key: 'filler_taluka', label: 'Taluka' },
        { key: 'filler_address', label: 'Surveyor Address' },
        { key: 'derasar_name', label: 'Derasar Name' },
        { key: 'location_name', label: 'Location' },
        { key: 'derasar_type', label: 'Derasar Type' },
        { key: 'full_address', label: 'Derasar Full Address' },
        { key: 'district', label: 'District' },
        { key: 'state', label: 'State' },
        { key: 'is_tirth', label: 'Tirth?' },
        { key: 'bhojanshala_available', label: 'Bhojanshala?' },
        { key: 'dharmshala_available', label: 'Dharmshala?' },
        { key: 'mulnayak_name', label: 'Mulnayak' },
        { key: 'total_pratima_count', label: 'Pratima Count' },
        { key: 'pedhi_manager_name', label: 'Pedhi Manager' },
        { key: 'pedhi_manager_mobile', label: 'Pedhi Mobile' },
        { key: 'poojari_name', label: 'Poojari Name' },
        { key: 'poojari_mobile', label: 'Poojari Mobile' },
        { key: 'trustees', label: 'Trustees & Contacts' },
        { key: 'gmaps_link', label: 'Google Maps Link' },
        { key: 'mulnayak_photo_url', label: 'Mulnayak Photo' },
        { key: 'jinalay_photo_url', label: 'Jinalay Photo' },
        { key: 'trustee_list_photo_url', label: 'Trustee Photo' }
    ];

    // --- CSV Export ---
    exportCsvBtn.addEventListener('click', () => {
        if (!allRows.length) return alert('No data to export');

        const csvContent = [
            exportColumns.map(c => `"${c.label}"`).join(','),
            ...allRows.map(r => {
                return exportColumns.map(c => {
                    let val = r[c.key];
                    if (c.key === 'trustees' && Array.isArray(val)) {
                        val = val.map(t => `${t.name}(${t.mobile})`).join('; ');
                    }
                    if (c.key === 'created_at') val = new Date(val).toLocaleString();
                    if (val === null || val === undefined) val = '';
                    if (typeof val === 'boolean') val = val ? 'Yes' : 'No';
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

    // --- PDF Export (Using AutoTable) ---
    exportPdfBtn.addEventListener('click', async () => {
        if (!allRows.length) return alert('No data to export');
        
        const { jsPDF } = window.jspdf;
        // Landscape, points, very large custom format to fit ~27 columns nicely without breaking layout
        const doc = new jsPDF('l', 'pt', [1200, 842]); 

        exportPdfBtn.disabled = true;
        exportPdfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';

        try {
            const head = [exportColumns.map(c => c.label)];
            const body = allRows.map(r => {
                return exportColumns.map(c => {
                    let val = r[c.key];
                    if (c.key === 'trustees' && Array.isArray(val)) {
                        val = val.map(t => `${t.name}(${t.mobile})`).join(', ');
                    }
                    if (c.key === 'created_at') val = new Date(val).toLocaleDateString();
                    if (val === null || val === undefined) val = '';
                    if (typeof val === 'boolean') val = val ? 'Yes' : 'No';
                    return String(val);
                });
            });

            doc.autoTable({
                head: head,
                body: body,
                startY: 50,
                styles: { fontSize: 7, cellPadding: 3, overflow: 'linebreak' },
                headStyles: { fillColor: [37, 99, 235], textColor: 255 },
                columnStyles: {
                    // Make url columns wrap or break smoothly
                    23: { cellWidth: 50 }, // gmaps
                    24: { cellWidth: 40 }, // mul photo
                    25: { cellWidth: 40 }, // jinalay photo
                    26: { cellWidth: 40 }  // trustee photo
                },
                didDrawPage: function (data) {
                    doc.setFontSize(14);
                    doc.text("LVJST Pre-Survey Data Full Report", data.settings.margin.left, 30);
                }
            });

            doc.save(`LVJST_PreSurvey_View_${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (e) {
            console.error(e);
            alert('PDF generation failed');
        } finally {
            exportPdfBtn.disabled = false;
            exportPdfBtn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> PDF';
        }
    });

    // Init
    updateLoginUI();
    if (getToken()) loadData();

})();
