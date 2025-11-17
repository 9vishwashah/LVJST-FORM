// public/js/admin.js
(() => {
  const API_LOGIN = '/.netlify/functions/adminLogin';
  const API_FETCH = '/.netlify/functions/adminFetchVolunteers';
  const API_DELETE = '/.netlify/functions/adminDeleteVolunteer'; // implement server function to delete by id

  // token storage keys
  const TOKEN_KEY = 'admin_token';
  const TOKEN_EXP_KEY = 'admin_token_exp';

  // DOM refs
  const loginOverlay = document.getElementById('loginOverlay');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const loginMsg = document.getElementById('loginMsg');
  const logoutBtn = document.getElementById('logoutBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const msgEl = document.getElementById('msg');
  const dataBody = document.getElementById('dataBody');
  const totalCount = document.getElementById('totalCount');
  const citiesCount = document.getElementById('citiesCount');
  const genderTop = document.getElementById('genderTop');
  const searchInput = document.getElementById('searchInput');
  const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const deleteModal = document.getElementById('deleteModal');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  let allRows = [];
  let filteredRows = [];
  let currentFilter = 'all';
  let deleteId = null;

  // token helpers
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
  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXP_KEY);
  }

  // show message
  function showMsg(text, cls = 'loading') {
    msgEl.className = cls;
    msgEl.textContent = text;
  }

  // login submit
  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginMsg.textContent = 'Verifying...';
    const id = document.getElementById('adminId').value.trim();
    const password = document.getElementById('adminPass').value;
    try {
      const res = await fetch(API_LOGIN, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ id, password })
      });
      const body = await res.json().catch(()=>null);
      if (!res.ok) {
        loginMsg.textContent = body?.error || 'Login failed';
        return;
      }
      setToken(body.token, body.expiresIn || 3600);
      loginOverlay.classList.remove('active');
      loginOverlay.style.display = 'none';
      loginMsg.textContent = '';
      await loadData();
    } catch (err) {
      console.error('login error', err);
      loginMsg.textContent = 'Login error';
    }
  });

  // logout
  logoutBtn.addEventListener('click', () => {
    clearToken();
    // show login overlay
    loginOverlay.classList.add('active');
    loginOverlay.style.display = 'flex';
    // clear UI
    dataBody.innerHTML = '<tr><td colspan="9" class="empty-state">Please login to view data</td></tr>';
    showMsg('Please login', 'loading');
  });

  // fetch data
  async function loadData() {
    const token = getToken();
    if (!token) {
      // show login
      loginOverlay.classList.add('active');
      loginOverlay.style.display = 'flex';
      return;
    }
    try {
      showMsg('⏳ Fetching volunteers...', 'loading');
      const res = await fetch(API_FETCH, { headers: { Authorization: 'Bearer ' + token } });
      const body = await res.json().catch(()=>null);
      if (!res.ok) {
        console.warn('fetch failed', body);
        if (body && body.error === 'unauthorized') {
          clearToken();
          loginOverlay.classList.add('active');
          loginOverlay.style.display = 'flex';
        }
        showMsg('❌ Failed to fetch data', 'error');
        return;
      }
      allRows = body.rows || [];
      filteredRows = allRows.slice();
      renderAnalytics(body.analytics || {});
      renderTable();
      showMsg(`✅ Loaded ${allRows.length} volunteers`, 'success');
    } catch (err) {
      console.error(err);
      showMsg('❌ Server error', 'error');
    }
  }

  // render analytics area
  function renderAnalytics(analytics) {
    totalCount.textContent = analytics.total || allRows.length;
    citiesCount.textContent = Object.keys(analytics.byCity || {}).length || '—';
    const gender = analytics.byGender || {};
    // pick top gender
    const topGender = Object.entries(gender).sort((a,b)=>b[1]-a[1])[0];
    genderTop.textContent = topGender ? `${topGender[0]} (${topGender[1]})` : '—';
  }

  // helpers
  function safe(v){ if (v===null||v===undefined||v==='') return '—'; return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function formatDate(d){ if(!d) return '—'; try{ return new Date(d).toLocaleString(); }catch(e){return d} }

  // render table
  async function renderTable() {
    if (!filteredRows.length) {
      dataBody.innerHTML = `<tr><td colspan="9" class="empty-state">No records found</td></tr>`;
      return;
    }
    dataBody.innerHTML = '';
    // render rows
    for (const row of filteredRows) {
      const id = row.iD ?? row.id ?? row._id ?? row.uuid ?? '';
      const name = safe(row.full_name || row.name);
      const phone = safe(row.mobile_number || row.contact_number);
      const email = safe(row.email || row.user_email);
      const city = safe(row.city);
      const age = safe(row.age);
      const reference = safe(row.reference);
      const skills = row.skills ? (typeof row.skills === 'string' ? safe(row.skills) : safe(JSON.stringify(row.skills))) : '—';
      const submitted = formatDate(row.Timestamp || row.created_at || row.submitted_at);

      // whatsapp link
      const phoneDigits = (row.mobile_number || row.contact_number || '').toString().replace(/\D/g,'');
      const waPhone = phoneDigits ? (phoneDigits.startsWith('91') ? phoneDigits : '91' + phoneDigits) : null;
      const whatsappBtn = waPhone ? `<button class="action-btn whatsapp-btn" title="Contact via WhatsApp" onclick="window.open('https://wa.me/${waPhone}','_blank')">💬</button>` : '';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${name}</td>
        <td>${phone}</td>
        <td class="email-cell">${email}</td>
        <td>${city}</td>
        <td>${age}</td>
        <td class="description-cell"><div class="desc-scroll">${skills}</div></td>
        <td>${reference}</td>
        <td class="date-cell">${submitted}</td>
        <td>
          <div class="action-buttons">
            ${whatsappBtn}
            <button class="action-btn delete-btn" data-id="${id}" title="Delete">🗑️</button>
          </div>
        </td>
      `;
      dataBody.appendChild(tr);
    }

    // attach delete handlers
    document.querySelectorAll('.delete-btn').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        deleteId = btn.getAttribute('data-id');
        deleteModal.classList.add('active');
      });
    });
  }

  // search & filter
  searchInput.addEventListener('input', (e)=> applyFilters(e.target.value));
  filterBtns.forEach(b=>{
    b.addEventListener('click', ()=>{
      filterBtns.forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      currentFilter = b.dataset.filter;
      applyFilters(searchInput.value);
    });
  });

  function applyFilters(searchTerm='') {
    const q = (searchTerm || '').toLowerCase().trim();
    filteredRows = allRows.filter(r => {
      // filter by currentFilter
      if (currentFilter === 'city' && (!r.city)) return false;
      if (currentFilter === 'age' && (!r.age)) return false;
      // search match
      if (!q) return true;
      return (
        (r.full_name && r.full_name.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.mobile_number && r.mobile_number.includes(q)) ||
        (r.city && r.city.toLowerCase().includes(q)) ||
        (r.reference && r.reference.toLowerCase().includes(q))
      );
    });
    renderTable();
  }

  // CSV export
  exportCsvBtn.addEventListener('click', ()=>{
    if (!allRows.length) return alert('No data to export');
    const csvRows = [];
    const headers = ['Name','Email','Contact','City','Age','Reference','Skills','Submitted At'];
    csvRows.push(headers.join(','));
    for (const r of allRows) {
      const row = [
        `"${(r.full_name||'').replace(/"/g,'""')}"`,
        `"${(r.email||'').replace(/"/g,'""')}"`,
        `"${(r.mobile_number||'').replace(/"/g,'""')}"`,
        `"${(r.city||'').replace(/"/g,'""')}"`,
        `"${(r.age||'').toString().replace(/"/g,'""')}"`,
        `"${(r.reference||'').replace(/"/g,'""')}"`,
        `"${(r.skills?JSON.stringify(r.skills):'').replace(/"/g,'""')}"`,
        `"${(r.Timestamp||r.created_at||'').replace(/"/g,'""')}"`
      ];
      csvRows.push(row.join(','));
    }
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `volunteers_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // delete confirm handlers
  cancelDeleteBtn.addEventListener('click', ()=> { deleteModal.classList.remove('active'); deleteId = null; });
  confirmDeleteBtn.addEventListener('click', async ()=>{
    if (!deleteId) return;
    const token = getToken();
    if (!token) { alert('Not authorized'); return; }
    showMsg('🗑️ Deleting...', 'loading');
    try {
      const res = await fetch(API_DELETE, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':'Bearer ' + token },
        body: JSON.stringify({ id: deleteId })
      });
      const body = await res.json().catch(()=>null);
      if (!res.ok) {
        showMsg('❌ Delete failed', 'error');
        console.error(body);
        return;
      }
      // remove from local arrays
      allRows = allRows.filter(r => String(r.iD ?? r.id ?? r._id ?? r.uuid ?? '') !== String(deleteId));
      filteredRows = filteredRows.filter(r => String(r.iD ?? r.id ?? r._id ?? r.uuid ?? '') !== String(deleteId));
      renderTable();
      showMsg('✅ Deleted', 'success');
    } catch (err) {
      console.error(err);
      showMsg('❌ Server error', 'error');
    } finally {
      deleteModal.classList.remove('active');
      deleteId = null;
    }
  });

  // refresh button
  refreshBtn.addEventListener('click', loadData);

  // initial bootstrap: if token exists, hide login and load, else keep overlay
  (async ()=> {
    const token = getToken();
    if (token) {
      loginOverlay.classList.remove('active');
      loginOverlay.style.display = 'none';
      await loadData();
    } else {
      // keep overlay open
      loginOverlay.classList.add('active');
      loginOverlay.style.display = 'flex';
      dataBody.innerHTML = '<tr><td colspan="9" class="empty-state">Please login to view data</td></tr>';
    }
  })();

})();
