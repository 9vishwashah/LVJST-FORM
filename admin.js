// js/admin.js
(() => {
  const API_LOGIN = '/.netlify/functions/adminLogin';
  const API_FETCH = '/.netlify/functions/adminFetchVolunteers';
  const API_DELETE = '/.netlify/functions/adminDeleteVolunteer';

  const TOKEN_KEY = 'admin_token';
  const TOKEN_EXP_KEY = 'admin_token_exp';

  function setToken(token, expiresIn = 3600) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXP_KEY, String(Date.now() + expiresIn * 1000));
  }
  function getToken() {
    const t = localStorage.getItem(TOKEN_KEY);
    const exp = Number(localStorage.getItem(TOKEN_EXP_KEY) || 0);
    if (!t || Date.now() > exp) { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(TOKEN_EXP_KEY); return null; }
    return t;
  }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(TOKEN_EXP_KEY); }

  // Login overlay DOM
  const loginOverlay = document.getElementById('loginOverlay');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const loginError = document.getElementById('loginError');
  const cancelLoginBtn = document.getElementById('cancelLoginBtn');
  const dashboardMain = document.getElementById('dashboardMain');
  const logoutBtn = document.getElementById('logoutBtn');

  // Dashboard DOM
  const totalCount = document.getElementById('totalCount');
  const citiesCount = document.getElementById('citiesCount');
  const maleBadge = document.getElementById('maleBadge');
  const femaleBadge = document.getElementById('femaleBadge');
  const cityPieCanvas = document.getElementById('cityPie');
  const skillsBarCanvas = document.getElementById('skillsBar');
  const dataBody = document.getElementById('dataBody');
  const globalSearch = document.getElementById('globalSearch');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const exportPdfBtn = document.getElementById('exportPdfBtn');
  const refreshBtn = document.getElementById('refreshBtn');

  let allRows = [];
  let filteredRows = [];
  let activeCityFilter = null;
  let activeSkillFilter = null;
  let activeSort = { col: null, dir: 1 }; // 1 asc, -1 desc

  let cityPieChart = null;
  let skillsBarChart = null;

  /* helpers */
  function safe(v){ if (v===null||v===undefined||v==='') return '—'; return String(v); }
  function dateOnly(d){ if(!d) return '—'; const dt = new Date(d); if (isNaN(dt)) return d; return dt.toISOString().slice(0,10); }
  function escapeHtml(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }

  // Build a set of candidate city keys from the dataset
  function buildCityKeys(rows){
    const set = new Set();
    rows.forEach(r=>{
      const c = (r.city || '').toString().trim().toLowerCase();
      if (c) set.add(c);
      // also add tokens (words) of the city - useful when city strings have multiple words
      c.split(/\s+/).forEach(tok=>{
        const t = tok.trim();
        if (t && t.length >= 3) set.add(t.toLowerCase());
      });
    });
    return Array.from(set);
  }

  // Normalize a city string using the dataset keys:
  // If the city string contains a shorter known key (like "vashi"), prefer that key.
  function normalizeCityKey(city, allKeys){
    if (!city) return 'unknown';
    const s = city.toString().trim().toLowerCase();
    if (!s) return 'unknown';
    // try exact match first
    if (allKeys.includes(s)) return s;
    // try to find a known key that appears as substring inside s (prefer longer matches)
    const candidates = allKeys.filter(k => k.length >= 3 && s.includes(k));
    if (candidates.length) {
      // choose the longest candidate (more specific)
      candidates.sort((a,b)=>b.length - a.length);
      return candidates[0];
    }
    // if nothing matched, return the trimmed full city name
    return s;
  }

  function cityLabelFromKey(k){ if(!k || k==='unknown') return 'Unknown'; return k.charAt(0).toUpperCase() + k.slice(1); }

  function normalizeSkills(skillsField){
    if (!skillsField) return [];
    let obj = skillsField;
    if (typeof skillsField === 'string'){
      try { obj = JSON.parse(skillsField); } catch(e){ /* leave as string */ }
    }
    if (Array.isArray(obj)) return obj.map(s=>String(s).trim()).filter(Boolean);
    if (typeof obj === 'object') {
      const out = [];
      for (const [k,v] of Object.entries(obj)){
        if (!v) continue;
        if (typeof v === 'object'){
          if (v.selected === false) continue;
          const ex = (v.experience || v.ex || null) || (v.experience === ''?null:String(v.experience||'')).trim();
          out.push(ex ? `${k} - ${ex}` : `${k}`);
        } else {
          out.push(String(k));
        }
      }
      return out;
    }
    return [String(skillsField)];
  }

  // analytics builder that uses normalized city keys
  function buildAnalytics(rows){
    const allKeys = buildCityKeys(rows);
    const analytics = { total: rows.length, byCity: {}, byGender: { Male:0, Female:0, Other:0 }, bySkill: {} };
    rows.forEach(r=>{
      const ck = normalizeCityKey(r.city, allKeys);
      analytics.byCity[ck] = (analytics.byCity[ck]||0) + 1;
      const g = (r.gender||'Other').toString().trim();
      if (/male/i.test(g)) analytics.byGender.Male++;
      else if (/female/i.test(g)) analytics.byGender.Female++;
      else analytics.byGender.Other++;
      const skills = normalizeSkills(r.skills);
      skills.forEach(s=>{
        const name = s.split(' - ')[0].trim();
        analytics.bySkill[name] = (analytics.bySkill[name]||0) + 1;
      });
    });
    return analytics;
  }

  /* charts */
  function renderCityPie(analytics){
    const keys = Object.keys(analytics.byCity);
    const labels = keys.map(k=>cityLabelFromKey(k));
    const data = keys.map(k=>analytics.byCity[k]);
    const colors = keys.map((_,i)=>`hsl(${(i*47)%360} 85% 55%)`);
    if (cityPieChart) cityPieChart.destroy();
    cityPieChart = new Chart(cityPieCanvas.getContext('2d'), {
      type:'pie',
      data:{ labels, datasets:[{ data, backgroundColor: colors }] },
      options:{
        plugins:{ legend:{ position:'bottom' } },
        onClick: (evt, elements) => {
          if (elements && elements.length) {
            const idx = elements[0].index;
            const key = keys[idx];
            activeCityFilter = (activeCityFilter === key) ? null : key;
            applyAllFilters();
          }
        }
      }
    });
  }

  function renderSkillsBar(analytics){
    const entries = Object.entries(analytics.bySkill).sort((a,b)=>b[1]-a[1]).slice(0,12);
    const labels = entries.map(e=>e[0]);
    const data = entries.map(e=>e[1]);
    const colors = labels.map((_,i)=>`rgba(11,108,255,${0.6 + (i%3)*0.08})`);
    if (skillsBarChart) skillsBarChart.destroy();
    skillsBarChart = new Chart(skillsBarCanvas.getContext('2d'), {
      type:'bar',
      data:{ labels, datasets:[{ label:'Count', data, backgroundColor: colors }] },
      options:{
        plugins:{ legend:{ display:false } },
        onClick: (evt, elements) => {
          if (elements && elements.length) {
            const idx = elements[0].index;
            const skill = labels[idx];
            activeSkillFilter = (activeSkillFilter === skill) ? null : skill;
            applyAllFilters();
          }
        },
        scales: { y: { beginAtZero:true, ticks:{ precision:0 } } }
      }
    });
  }

  function renderAnalyticsUI(rows){
    const analytics = buildAnalytics(rows);
    if (totalCount) totalCount.textContent = analytics.total;
    if (citiesCount) citiesCount.textContent = Object.keys(analytics.byCity).length;
    if (maleBadge) maleBadge.textContent = `Male ${analytics.byGender.Male}`;
    if (femaleBadge) femaleBadge.textContent = `Female ${analytics.byGender.Female}`;
    renderCityPie(analytics);
    renderSkillsBar(analytics);
  }

  /* table render */
  function renderTable(rows){
    if (!rows || !rows.length){ dataBody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:24px">No records</td></tr>`; return; }
    dataBody.innerHTML = '';
    // compute city keys once for consistent display (use current allRows set so normalization matches analytics)
    const cityKeys = buildCityKeys(allRows);
    rows.forEach((r, idx)=>{
      const sr = idx + 1;
      const id = r.iD ?? r.id ?? '';
      const name = escapeHtml(r.full_name || r.name || '');
      const phone = (r.mobile_number || r.contact || '');
      const phoneClean = phone.toString().replace(/\D/g,'');
      const email = escapeHtml(r.email || '');
      const cityKey = normalizeCityKey(r.city, cityKeys);
      const cityLabel = cityLabelFromKey(cityKey);
      const age = escapeHtml(r.age ?? '');
      const reference = escapeHtml(r.reference || '');
      const submitted = escapeHtml(dateOnly(r.Timestamp || r.created_at || r.submitted_at));
      const skillsArr = normalizeSkills(r.skills);
      const skillsHtml = skillsArr.length ? skillsArr.map(s=>`<span class="chip">${escapeHtml(s)}</span>`).join(' ') : '—';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="srno">${sr}</td>
        <td>${name}</td>
        <td>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="whatsapp icon-btn" title="WhatsApp" data-phone="${phoneClean}"><i class="fa-brands fa-whatsapp" style="color:#fff"></i></button>
            <button class="email-icon icon-btn" title="Send email" data-email="${escapeHtml(r.email||'')}"><i class="fa-solid fa-envelope"></i></button>
            <div style="margin-left:8px">${escapeHtml(phone)}</div>
          </div>
        </td>
        <td class="email-cell">${email}</td>
        <td>${cityLabel}</td>
        <td>${age}</td>
        <td class="skills-cell">${skillsHtml}</td>
        <td>${reference}</td>
        <td class="date-cell">${submitted}</td>
        <td class="actions-col">
          <button class="action-delete icon-btn" data-id="${escapeHtml(id)}" title="Delete" style="color:#ff5b5b"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      dataBody.appendChild(tr);
    });

    // whatsapp handlers
    document.querySelectorAll('.whatsapp').forEach(btn=>{
      btn.addEventListener('click', ()=> {
        const p = btn.dataset.phone || '';
        if (!p) return alert('No phone number available');
        const wa = p.startsWith('91') ? p : '91' + p;
        window.open(`https://wa.me/${wa}`, '_blank');
      });
    });

    document.querySelectorAll('.email-icon').forEach(btn=>{
      btn.addEventListener('click', ()=> {
        const e = btn.dataset.email || '';
        if (!e) return alert('No email provided');
        window.location.href = `mailto:${e}`;
      });
    });

    // delete handlers
    document.querySelectorAll('.action-delete').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const id = btn.dataset.id;
        if (!confirm('Delete this volunteer?')) return;
        try {
          const token = getToken();
          if (!token) return alert('Not authorized');
          const res = await fetch(API_DELETE, {
            method:'POST',
            headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + token },
            body: JSON.stringify({ id })
          });
          const body = await res.json().catch(()=>null);
          if (!res.ok) { console.error(body); return alert('Delete failed'); }
          allRows = allRows.filter(r => String(r.iD ?? r.id ?? '') !== String(id));
          applyAllFilters();
        } catch (err) { console.error(err); alert('Server error'); }
      });
    });
  }

  /* sorting & filtering */
  function applySort(rows){
    if (!activeSort.col) return rows;
    const col = activeSort.col;
    const dir = activeSort.dir;
    const copy = rows.slice();
    copy.sort((a,b)=>{
      let va = (a[col] ?? a[col.toLowerCase()] ?? '');
      let vb = (b[col] ?? b[col.toLowerCase()] ?? '');
      if (col === 'age'){ va = Number(va||0); vb = Number(vb||0); return (va - vb) * dir; }
      if (col === 'Timestamp'){ va = new Date(va||0).getTime(); vb = new Date(vb||0).getTime(); return (va - vb) * dir; }
      if (col === 'mobile_number'){ va = String(va).replace(/\D/g,''); vb = String(vb).replace(/\D/g,''); return va.localeCompare(vb) * dir; }
      if (col === 'skills'){
        const sa = normalizeSkills(a.skills).length;
        const sb = normalizeSkills(b.skills).length;
        return (sa - sb) * dir;
      }
      return String(va).toLowerCase().localeCompare(String(vb).toLowerCase()) * dir;
    });
    return copy;
  }

  function applyAllFilters(){
    const q = (globalSearch?.value || '').trim().toLowerCase();

    // If the search is empty and there are no active city/skill filters, show everything quickly
    if (!q && !activeCityFilter && !activeSkillFilter) {
      filteredRows = allRows.slice();
      const sorted = applySort(filteredRows);
      renderTable(sorted);
      renderAnalyticsUI(filteredRows);
      return;
    }

    // otherwise apply filters properly
    filteredRows = allRows.filter(r=>{
      if (activeCityFilter){
        // normalize against dataset keys
        const key = normalizeCityKey(r.city, buildCityKeys(allRows));
        if (key !== activeCityFilter) return false;
      }
      if (activeSkillFilter){
        const skills = normalizeSkills(r.skills).map(s=>s.split(' - ')[0].toLowerCase());
        if (!skills.includes(activeSkillFilter.toLowerCase())) return false;
      }
      if (q){
        const joined = `${r.full_name||''} ${r.email||''} ${r.mobile_number||''} ${r.city||''} ${r.reference||''} ${JSON.stringify(r.skills||'')}`.toLowerCase();
        if (!joined.includes(q)) return false;
      }
      return true;
    });
    const sorted = applySort(filteredRows);
    renderTable(sorted);
    renderAnalyticsUI(filteredRows);
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.col-sort');
    if (!btn) return;
    const col = btn.dataset.col;
    if (!col) return;
    if (activeSort.col === col) activeSort.dir = -activeSort.dir; else { activeSort.col = col; activeSort.dir = 1; }
    applyAllFilters();
  });

  globalSearch?.addEventListener('input', () => {
    // when user removes all text we trigger a full reset (unless other filters active)
    applyAllFilters();
  });

  /* CSV / PDF export (unchanged logic) */
  function exportCSV(){
    if (!allRows.length) return alert('No data to export');
    const headers = ['Sr No','Name','Email','Contact','City','Age','Skills','Reference','Submitted At'];
    const rows = allRows.map((r,i)=>[
      i+1,
      r.full_name||'',
      r.email||'',
      r.mobile_number||'',
      cityLabelFromKey(normalizeCityKey(r.city, buildCityKeys(allRows))),
      r.age||'',
      normalizeSkills(r.skills).join('; '),
      r.reference||'',
      dateOnly(r.Timestamp||r.created_at||r.submitted_at)
    ]);
    const csv = [headers.join(',')].concat(rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `volunteers_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  async function exportPDF(){
    if (!allRows.length) return alert('No data');
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.style.width = '1200px';
    wrapper.style.padding = '20px';
    wrapper.style.background = '#fff';
    wrapper.style.color = '#000';
    wrapper.innerHTML = `<h2>Volunteers — ${new Date().toISOString().slice(0,10)}</h2>`;
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.innerHTML = `<thead><tr>
      <th style="border:1px solid #ddd;padding:6px">Sr No</th>
      <th style="border:1px solid #ddd;padding:6px">Name</th>
      <th style="border:1px solid #ddd;padding:6px">Contact</th>
      <th style="border:1px solid #ddd;padding:6px">Email</th>
      <th style="border:1px solid #ddd;padding:6px">City</th>
      <th style="border:1px solid #ddd;padding:6px">Age</th>
      <th style="border:1px solid #ddd;padding:6px">Skills</th>
      <th style="border:1px solid #ddd;padding:6px">Reference</th>
      <th style="border:1px solid #ddd;padding:6px">Submitted At</th>
    </tr></thead><tbody></tbody>`;
    const tb = table.querySelector('tbody');
    allRows.forEach((r,i)=>{
      const skills = normalizeSkills(r.skills).join('; ');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="border:1px solid #eee;padding:6px">${i+1}</td>
        <td style="border:1px solid #eee;padding:6px">${escapeHtml(r.full_name||'')}</td>
        <td style="border:1px solid #eee;padding:6px">${escapeHtml(r.mobile_number||'')}</td>
        <td style="border:1px solid #eee;padding:6px">${escapeHtml(r.email||'')}</td>
        <td style="border:1px solid #eee;padding:6px">${escapeHtml(cityLabelFromKey(normalizeCityKey(r.city, buildCityKeys(allRows))))}</td>
        <td style="border:1px solid #eee;padding:6px">${escapeHtml(r.age||'')}</td>
        <td style="border:1px solid #eee;padding:6px">${escapeHtml(skills)}</td>
        <td style="border:1px solid #eee;padding:6px">${escapeHtml(r.reference||'')}</td>
        <td style="border:1px solid #eee;padding:6px">${escapeHtml(dateOnly(r.Timestamp||r.created_at||r.submitted_at))}</td>
      `;
      tb.appendChild(tr);
    });
    wrapper.appendChild(table);
    document.body.appendChild(wrapper);

    try {
      const canvas = await html2canvas(wrapper, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const img = canvas.toDataURL('image/jpeg', 0.95);
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: 'px', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(img);
      const imgWidth = pageWidth - 40;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      pdf.addImage(img, 'JPEG', 20, 20, imgWidth, imgHeight);
      pdf.save(`volunteers_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
      console.error(err); alert('PDF export failed');
    } finally {
      document.body.removeChild(wrapper);
    }
  }

  /* load data with robust network error handling */
  async function loadData(){
    const token = getToken();
    if (!token) { dataBody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:22px;color:#c00">Not logged in — please login first</td></tr>`; return; }
    try {
      dataBody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:22px">Loading...</td></tr>`;
      const res = await fetch(API_FETCH, { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) {
        const body = await res.json().catch(()=>null);
        console.error('fetch error', body);
        dataBody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:22px;color:#c00">Fetch failed: ${res.status} ${res.statusText}</td></tr>`;
        return;
      }
      const body = await res.json().catch(()=>null);
      allRows = body.rows || [];
      filteredRows = allRows.slice();
      renderAnalyticsUI(allRows);
      renderTable(filteredRows);
    } catch (err) {
      console.error('Network / fetch error', err);
      dataBody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:22px;color:#c00">Cannot reach server — check Netlify functions / dev server. (${err.message})</td></tr>`;
    }
  }

  /* login overlay helpers */
  function showLoginOverlay(message = '') {
    loginError.style.display = message ? 'block' : 'none';
    loginError.textContent = message || '';
    loginOverlay.style.display = 'flex';
    loginOverlay.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    dashboardMain.style.filter = 'blur(2px) brightness(0.6)';
    dashboardMain.setAttribute('aria-hidden','true');
  }
  function hideLoginOverlay() {
    loginOverlay.style.display = 'none';
    loginOverlay.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    dashboardMain.style.filter = '';
    dashboardMain.removeAttribute('aria-hidden');
  }
  function clearUIOnLogout(){
    dataBody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:22px;color:#c00">Not logged in — please login first</td></tr>`;
    if (totalCount) totalCount.textContent = '0';
    if (citiesCount) citiesCount.textContent = '0';
    if (maleBadge) maleBadge.textContent = 'Male 0';
    if (femaleBadge) femaleBadge.textContent = 'Female 0';
    try { if (cityPieChart) cityPieChart.destroy(); } catch(e){}
    try { if (skillsBarChart) skillsBarChart.destroy(); } catch(e){}
  }

  /* login */
  if (!getToken()) showLoginOverlay(); else hideLoginOverlay();

  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    const id = document.getElementById('adminId').value.trim();
    const password = document.getElementById('adminPass').value;
    if (!id || !password) { loginError.textContent = 'Enter credentials'; loginError.style.display = 'block'; return; }

    try {
      const res = await fetch(API_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password })
      });
      const body = await res.json().catch(()=>null);
      if (!res.ok) {
        const err = body?.error || body?.message || `Login failed (${res.status})`;
        loginError.textContent = err;
        loginError.style.display = 'block';
        return;
      }
      setToken(body.token, body.expiresIn || 3600);
      hideLoginOverlay();
      adminLoginForm.reset();
      await loadData();
    } catch (err) {
      console.error('login error', err);
      loginError.textContent = 'Login error — try again';
      loginError.style.display = 'block';
    }
  });

  cancelLoginBtn.addEventListener('click', () => {
    adminLoginForm.reset();
    loginError.style.display = 'none';
  });

  logoutBtn.addEventListener('click', () => {
    clearToken();
    clearUIOnLogout();
    showLoginOverlay();
  });

  /* UI wiring */
  exportCsvBtn.addEventListener('click', exportCSV);
  exportPdfBtn.addEventListener('click', exportPDF);
  refreshBtn.addEventListener('click', loadData);

  document.addEventListener('click', (e) => {
    const b = e.target.closest('.col-sort');
    if (b){
      const col = b.dataset.col;
      if (!col) return;
      if (activeSort.col === col) activeSort.dir = -activeSort.dir; else { activeSort.col = col; activeSort.dir = 1; }
      applyAllFilters();
    }
  });

  globalSearch?.addEventListener('input', () => applyAllFilters());

  /* initial load */
  (async ()=> {
    if (getToken()) await loadData();
  })();

})();
