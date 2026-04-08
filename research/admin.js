/* =====================================================
   LVJST Research — admin.js
   Features: Login, Search, Filter, Sort, CSV Export
   ===================================================== */

// ── Config ───────────────────────────────────────────────
const SUPABASE_URL = "https://filyclgrctiyercthvmq.supabase.co";

// Service role key — used server-side (admin page is password protected)
// Get from: Supabase Dashboard → Project Settings → API → service_role
const SUPABASE_SERVICE_KEY = "sb_publishable_WkPoLV_QIgETY8jxPVKJeg_Ap1GMyQo";

// Admin password — change this!
const ADMIN_PASSWORD = "LVJST@Research2024";

const TABLE_NAME = "research_entries";

// ── State ────────────────────────────────────────────────
let db;
let allRecords = [];          // Raw fetched data
let filteredRecords = [];     // After search/filter

let sortCol  = "id";
let sortAsc  = true;

let searchQuery      = "";
let filterCity       = "";
let filterDistrict   = "";
let filterFacilities = {
  dharamshala:   false,
  bhojanshala:   false,
  aayambilshala: false,
};

// ── Init ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  setupLoginOverlay();
  setupExportBtn();
  setupLogoutBtn();
  setupTableSorting();
  setupSearch();
  setupFilters();
  setupDetailModal();
});

// ── Login ─────────────────────────────────────────────────
function setupLoginOverlay() {
  const overlay  = document.getElementById("loginOverlay");
  const form     = document.getElementById("loginForm");
  const pwInput  = document.getElementById("adminPassword");
  const errorEl  = document.getElementById("loginError");
  const loginBtn = document.getElementById("loginBtn");

  // Check session
  if (sessionStorage.getItem("lvjst_research_admin") === "true") {
    overlay.style.display = "none";
    initAdmin();
    return;
  }

  // Show overlay
  overlay.style.display = "flex";
  setTimeout(() => pwInput.focus(), 100);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pw = pwInput.value;

    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem("lvjst_research_admin", "true");
      overlay.style.opacity = "0";
      overlay.style.transition = "opacity 0.3s ease";
      setTimeout(() => {
        overlay.style.display = "none";
        overlay.style.opacity = "";
      }, 300);
      initAdmin();
    } else {
      errorEl.style.display = "block";
      pwInput.value = "";
      pwInput.focus();
      // Shake animation
      loginBtn.style.transform = "translateX(-4px)";
      setTimeout(() => loginBtn.style.transform = "translateX(4px)", 80);
      setTimeout(() => loginBtn.style.transform = "", 160);
    }
  });
}

// ── Admin Init ────────────────────────────────────────────
function initAdmin() {
  try {
    db = supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    console.log("[Admin] Supabase initialised");
    fetchData();
  } catch (e) {
    showTableMessage("error", "Failed to connect to database: " + e.message);
  }
}

// ── Fetch Data ────────────────────────────────────────────
async function fetchData() {
  showTableMessage("loading", "Loading records...");

  try {
    const { data, error } = await db
      .from(TABLE_NAME)
      .select("*")
      .order("id", { ascending: true });

    if (error) throw new Error(error.message);

    allRecords = data || [];
    console.log(`[Admin] Fetched ${allRecords.length} records`);

    populateFilterDropdowns();
    updateStats();
    applyFiltersAndRender();

  } catch (err) {
    console.error("[Fetch Error]", err);
    showTableMessage("error", "Error loading data: " + err.message);
  }
}

// ── Stats ─────────────────────────────────────────────────
function updateStats() {
  const total = allRecords.length;
  const dh    = allRecords.filter(r => r.dharamshala).length;
  const bh    = allRecords.filter(r => r.bhojanshala).length;
  const aa    = allRecords.filter(r => r.aayambilshala).length;

  setText("statTotal",         total);
  setText("statDharamshala",   dh);
  setText("statBhojanshala",   bh);
  setText("statAayambilshala", aa);
}

// ── Filter Dropdowns ──────────────────────────────────────
function populateFilterDropdowns() {
  const cities    = [...new Set(allRecords.map(r => r.city).filter(Boolean))].sort();
  const districts = [...new Set(allRecords.map(r => r.district).filter(Boolean))].sort();

  fillSelect("filterCity",     cities,    "All Cities");
  fillSelect("filterDistrict", districts, "All Districts");
}

function fillSelect(id, values, defaultLabel) {
  const sel = document.getElementById(id);
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = `<option value="">${defaultLabel}</option>`;
  values.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    if (v === current) opt.selected = true;
    sel.appendChild(opt);
  });
}

// ── Search Setup ──────────────────────────────────────────
function setupSearch() {
  const input = document.getElementById("globalSearch");
  if (!input) return;
  let debounce;
  input.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      searchQuery = input.value.trim().toLowerCase();
      applyFiltersAndRender();
    }, 250);
  });
}

// ── Filter Setup ──────────────────────────────────────────
function setupFilters() {
  document.getElementById("filterCity")?.addEventListener("change", (e) => {
    filterCity = e.target.value;
    applyFiltersAndRender();
  });

  document.getElementById("filterDistrict")?.addEventListener("change", (e) => {
    filterDistrict = e.target.value;
    applyFiltersAndRender();
  });

  ["dharamshala", "bhojanshala", "aayambilshala"].forEach(fac => {
    const btn = document.getElementById("filter" + capitalize(fac));
    if (!btn) return;
    btn.addEventListener("click", () => {
      filterFacilities[fac] = !filterFacilities[fac];
      btn.classList.toggle("active", filterFacilities[fac]);
      btn.setAttribute("aria-pressed", String(filterFacilities[fac]));
      applyFiltersAndRender();
    });
  });

  document.getElementById("clearFiltersBtn")?.addEventListener("click", clearAllFilters);
}

function clearAllFilters() {
  searchQuery = "";
  filterCity  = "";
  filterDistrict = "";
  filterFacilities = { dharamshala: false, bhojanshala: false, aayambilshala: false };

  const searchInput = document.getElementById("globalSearch");
  if (searchInput) searchInput.value = "";

  const citySelect     = document.getElementById("filterCity");
  const districtSelect = document.getElementById("filterDistrict");
  if (citySelect)     citySelect.value     = "";
  if (districtSelect) districtSelect.value = "";

  ["dharamshala", "bhojanshala", "aayambilshala"].forEach(fac => {
    const btn = document.getElementById("filter" + capitalize(fac));
    if (btn) {
      btn.classList.remove("active");
      btn.setAttribute("aria-pressed", "false");
    }
  });

  applyFiltersAndRender();
}

// ── Apply Filters + Render ────────────────────────────────
function applyFiltersAndRender() {
  let results = [...allRecords];

  // Global search (name, address, city, district, contact, history)
  if (searchQuery) {
    results = results.filter(r =>
      [r.name, r.address, r.city, r.district, r.contact_no, r.history]
        .some(val => (val || "").toLowerCase().includes(searchQuery))
    );
  }

  // City filter
  if (filterCity) {
    results = results.filter(r => r.city === filterCity);
  }

  // District filter
  if (filterDistrict) {
    results = results.filter(r => r.district === filterDistrict);
  }

  // Facility filters
  if (filterFacilities.dharamshala)   results = results.filter(r => r.dharamshala);
  if (filterFacilities.bhojanshala)   results = results.filter(r => r.bhojanshala);
  if (filterFacilities.aayambilshala) results = results.filter(r => r.aayambilshala);

  // Sort
  results = sortRecords(results);

  filteredRecords = results;
  renderTable(filteredRecords);
  updateRecordCount();
}

// ── Sort ──────────────────────────────────────────────────
function setupTableSorting() {
  document.querySelectorAll("thead th[data-col]").forEach(th => {
    th.addEventListener("click", () => {
      const col = th.dataset.col;
      if (sortCol === col) {
        sortAsc = !sortAsc;
      } else {
        sortCol = col;
        sortAsc = true;
      }

      // Update aria-sort
      document.querySelectorAll("thead th[data-col]").forEach(t => {
        t.classList.remove("sorted");
        t.setAttribute("aria-sort", "none");
        const icon = t.querySelector(".sort-icon");
        if (icon) icon.textContent = "↕";
      });

      th.classList.add("sorted");
      th.setAttribute("aria-sort", sortAsc ? "ascending" : "descending");
      const icon = th.querySelector(".sort-icon");
      if (icon) icon.textContent = sortAsc ? "↑" : "↓";

      applyFiltersAndRender();
    });

    // Keyboard support
    th.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        th.click();
      }
    });
  });
}

function sortRecords(records) {
  return [...records].sort((a, b) => {
    let valA = a[sortCol] ?? "";
    let valB = b[sortCol] ?? "";

    // Numeric sort for id
    if (sortCol === "id") {
      valA = Number(valA);
      valB = Number(valB);
    } else if (sortCol === "created_at") {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });
}

// ── Render Table ──────────────────────────────────────────
function renderTable(records) {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return;

  if (!records || records.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="10">
        <div class="table-message">
          <div class="msg-icon">🔍</div>
          <p>${allRecords.length === 0 ? "No records found in database." : "No records match your search / filters."}</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = records.map((r, idx) => `
    <tr>
      <td class="td-sr">#${r.id}</td>
      <td class="td-name">${escHtml(r.name || "—")}</td>
      <td>${escHtml(r.address || "—")}</td>
      <td>${escHtml(r.city || "—")}</td>
      <td>${escHtml(r.district || "—")}</td>
      <td><a href="tel:${escHtml(r.contact_no || "")}" style="color:var(--vb-600);text-decoration:none;font-weight:500;">${escHtml(r.contact_no || "—")}</a></td>
      <td>
        ${facBadge("🏠", r.dharamshala)}
        ${facBadge("🍽️", r.bhojanshala)}
        ${facBadge("🧘", r.aayambilshala)}
      </td>
      <td class="td-history" title="${escHtml(r.history || "")}">${escHtml(r.history || "—")}</td>
      <td style="white-space:nowrap;font-size:0.77rem;color:var(--text-muted);">${formatDate(r.created_at)}</td>
      <td>
        <button class="filter-btn" style="padding:5px 10px;font-size:0.72rem;"
          onclick="openDetail(${r.id})" aria-label="View details for ${escHtml(r.name || "")}">
          <i class="fa-solid fa-eye" aria-hidden="true"></i> View
        </button>
      </td>
    </tr>
  `).join("");
}

function facBadge(emoji, value) {
  return value
    ? `<span class="fac-badge fac-yes">${emoji} Yes</span>`
    : `<span class="fac-badge fac-no">No</span>`;
}

function updateRecordCount() {
  const countEl = document.getElementById("recordCount");
  const filterEl = document.getElementById("filterIndicator");

  if (countEl) {
    countEl.textContent = `Showing ${filteredRecords.length} of ${allRecords.length} records`;
  }

  if (filterEl) {
    const activeFilters = [
      searchQuery && `"${searchQuery}"`,
      filterCity && `City: ${filterCity}`,
      filterDistrict && `District: ${filterDistrict}`,
      filterFacilities.dharamshala   && "Dharamshala",
      filterFacilities.bhojanshala   && "Bhojanshala",
      filterFacilities.aayambilshala && "Aayambilshala",
    ].filter(Boolean);

    filterEl.textContent = activeFilters.length
      ? `Filtered by: ${activeFilters.join(" · ")}`
      : "";
  }
}

// ── Detail Modal ──────────────────────────────────────────
function setupDetailModal() {
  const overlay = document.getElementById("detailOverlay");
  const close   = document.getElementById("detailClose");

  close?.addEventListener("click", closeDetail);
  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) closeDetail();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDetail();
  });
}

window.openDetail = function(id) {
  const record = allRecords.find(r => r.id === id);
  if (!record) return;

  const overlay = document.getElementById("detailOverlay");
  const title   = document.getElementById("detailTitle");
  const body    = document.getElementById("detailBody");

  if (title) title.textContent = record.name || "Entry #" + id;

  if (body) {
    body.innerHTML = `
      ${detailRow("Sr. No", `#${record.id}`)}
      ${detailRow("Name", record.name)}
      ${detailRow("Address", record.address)}
      ${detailRow("City", record.city)}
      ${detailRow("District", record.district)}
      ${detailRow("Contact", record.contact_no ? `<a href="tel:${escHtml(record.contact_no)}" style="color:var(--vb-600);">${escHtml(record.contact_no)}</a>` : "—")}
      ${detailRow("Dharamshala", record.dharamshala
          ? '<span class="badge badge-success">✅ Yes</span>'
          : '<span class="badge" style="background:#f3f4f6;color:#9ca3af;border:1px solid #e5e7eb;">No</span>')}
      ${detailRow("Bhojanshala", record.bhojanshala
          ? '<span class="badge badge-success">✅ Yes</span>'
          : '<span class="badge" style="background:#f3f4f6;color:#9ca3af;border:1px solid #e5e7eb;">No</span>')}
      ${detailRow("Aayambilshala", record.aayambilshala
          ? '<span class="badge badge-success">✅ Yes</span>'
          : '<span class="badge" style="background:#f3f4f6;color:#9ca3af;border:1px solid #e5e7eb;">No</span>')}
      ${detailRow("History", record.history
          ? `<div style="white-space:pre-wrap;line-height:1.6;font-size:0.85rem;">${escHtml(record.history)}</div>`
          : '<span style="color:var(--text-muted);font-style:italic;">No history recorded</span>')}
      ${detailRow("Submitted On", formatDateFull(record.created_at))}
    `;
  }

  overlay?.classList.add("open");
  document.body.style.overflow = "hidden";
};

function closeDetail() {
  const overlay = document.getElementById("detailOverlay");
  overlay?.classList.remove("open");
  document.body.style.overflow = "";
}

function detailRow(key, val) {
  return `
    <div class="detail-row">
      <div class="detail-key">${key}</div>
      <div class="detail-val">${val || "—"}</div>
    </div>`;
}

// ── CSV Export ────────────────────────────────────────────
function setupExportBtn() {
  document.getElementById("exportCsvBtn")?.addEventListener("click", exportCSV);
}

function exportCSV() {
  const records = filteredRecords.length > 0 ? filteredRecords : allRecords;
  if (!records.length) {
    alert("No records to export.");
    return;
  }

  const headers = [
    "Sr No", "Name", "Address", "City", "District", "Contact No",
    "Dharamshala", "Bhojanshala", "Aayambilshala", "History", "Submitted On"
  ];

  const rows = records.map(r => [
    r.id,
    csvEsc(r.name),
    csvEsc(r.address),
    csvEsc(r.city),
    csvEsc(r.district),
    csvEsc(r.contact_no),
    r.dharamshala   ? "Yes" : "No",
    r.bhojanshala   ? "Yes" : "No",
    r.aayambilshala ? "Yes" : "No",
    csvEsc(r.history),
    formatDateFull(r.created_at),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0,10);
  link.href     = url;
  link.download = `lvjst_research_${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Logout ────────────────────────────────────────────────
function setupLogoutBtn() {
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    sessionStorage.removeItem("lvjst_research_admin");
    location.reload();
  });
}

// ── Table Loading/Error Messages ──────────────────────────
function showTableMessage(type, msg) {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return;
  const icon = type === "loading" ? "⏳" : type === "error" ? "❌" : "🔍";
  tbody.innerHTML = `
    <tr><td colspan="10">
      <div class="table-message">
        <div class="msg-icon" aria-hidden="true">${icon}</div>
        <p>${msg}</p>
      </div>
    </td></tr>`;
}

// ── Utility Helpers ───────────────────────────────────────
function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function csvEsc(val) {
  const str = String(val || "").replace(/"/g, '""');
  return `"${str}"`;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateFull(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true
  });
}
