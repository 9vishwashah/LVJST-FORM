/* =====================================================
   LVJST Research Form — form.js
   Handles: Supabase init, duplicate check, submission
   ===================================================== */

// ── Supabase Config ─────────────────────────────────────
const SUPABASE_URL = "https://filyclgrctiyercthvmq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_WkPoLV_QIgETY8jxPVKJeg_Ap1GMyQo";

// ── DOM Refs ─────────────────────────────────────────────
let db;

document.addEventListener("DOMContentLoaded", () => {
  // Init Supabase
  try {
    db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("[Research Form] Supabase initialised");
  } catch (e) {
    console.error("[Research Form] Supabase init error:", e);
  }

  // ── Auto-Uppercase on all text/tel inputs & textarea ──
  setupAutoUppercase();

  // ── Facility Card Toggles ──────────────────────────────
  const facilities = ["dharamshala", "bhojanshala", "aayambilshala"];
  facilities.forEach(fac => {
    const checkbox = document.getElementById(fac);
    const card = document.getElementById(fac + "Card");
    const status = document.getElementById(fac + "Status");
    if (!checkbox || !card || !status) return;

    card.addEventListener("click", () => {
      // label default click already toggles checkbox; read AFTER toggle
      setTimeout(() => {
        updateFacilityCard(card, status, checkbox.checked);
        card.setAttribute("aria-checked", String(checkbox.checked));
      }, 0);
    });

    // Keyboard support
    card.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        checkbox.checked = !checkbox.checked;
        updateFacilityCard(card, status, checkbox.checked);
        card.setAttribute("aria-checked", String(checkbox.checked));
      }
    });
  });

  // ── Form Submit ────────────────────────────────────────
  const form = document.getElementById("researchForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearAlert();
    if (!validateForm()) return;

    setLoading(true);

    const data = collectFormData();

    try {
      // 1. Duplicate check
      const duplicate = await checkDuplicate(data.name, data.address);
      if (duplicate) {
        showAlert("duplicate", duplicate.id);
        setLoading(false);
        return;
      }

      // 2. Insert
      const newEntry = await insertEntry(data);

      // 3. Show toast + reset form
      showToast("success", "Entry Recorded!", `Sr No #${newEntry.id} saved successfully.`, newEntry.id);
      resetForm();

    } catch (err) {
      console.error("[Submit Error]", err);
      showAlert("error", null, err.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  });

  // ── Auto-clear field errors on input ──────────────────
  form.querySelectorAll("input, textarea").forEach(el => {
    el.addEventListener("input", () => el.classList.remove("error"));
  });

});

// ── Auto Uppercase ────────────────────────────────────────
// Forces all text/tel inputs and textareas to UPPERCASE as user types
function setupAutoUppercase() {
  const selector = [
    "input[type='text']",
    "input[type='tel']",
    "textarea"
  ].join(", ");

  document.querySelectorAll(selector).forEach(el => {
    el.addEventListener("input", function () {
      const pos = this.selectionStart; // preserve caret position
      this.value = this.value.toUpperCase();
      try { this.setSelectionRange(pos, pos); } catch (_) {}
    });

    // Also handle paste
    el.addEventListener("paste", function () {
      setTimeout(() => {
        this.value = this.value.toUpperCase();
      }, 0);
    });
  });
}

// ── Helpers ──────────────────────────────────────────────

function updateFacilityCard(card, status, checked) {
  if (checked) {
    card.classList.add("active");
    status.textContent = "Yes";
  } else {
    card.classList.remove("active");
    status.textContent = "No";
  }
}

function collectFormData() {
  return {
    name:          document.getElementById("name").value.trim(),
    address:       document.getElementById("address").value.trim(),
    city:          document.getElementById("city").value.trim(),
    district:      document.getElementById("district").value.trim(),
    contact_no:    document.getElementById("contact_no").value.trim(),
    dharamshala:   document.getElementById("dharamshala").checked,
    bhojanshala:   document.getElementById("bhojanshala").checked,
    aayambilshala: document.getElementById("aayambilshala").checked,
    history:       document.getElementById("history").value.trim(),
  };
}

function validateForm() {
  const required = [
    { id: "name",       label: "Name" },
    { id: "contact_no", label: "Contact No" },
    { id: "address",    label: "Address" },
    { id: "city",       label: "City" },
    { id: "district",   label: "District" },
  ];

  let valid = true;
  let firstError = null;

  required.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!el.value.trim()) {
      el.classList.add("error");
      if (!firstError) firstError = el;
      valid = false;
    }
  });

  if (!valid) {
    showAlert("warning", null, "Please fill in all required fields (marked with *).");
    if (firstError) {
      firstError.focus();
      firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  return valid;
}

async function checkDuplicate(name, address) {
  if (!db) throw new Error("Database not connected.");

  const { data, error } = await db
    .from("research_entries")
    .select("id, name, address")
    .ilike("name", name.trim())
    .ilike("address", address.trim())
    .limit(1);

  if (error) throw new Error(error.message);
  return data && data.length > 0 ? data[0] : null;
}

async function insertEntry(payload) {
  if (!db) throw new Error("Database not connected.");

  const { data, error } = await db
    .from("research_entries")
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

function setLoading(loading) {
  const btn = document.getElementById("submitBtn");
  if (!btn) return;

  if (loading) {
    btn.disabled = true;
    btn.innerHTML = `<div class="spinner"></div><span>Saving...</span>`;
  } else {
    btn.disabled = false;
    btn.innerHTML = `<span class="btn-icon">📋</span><span id="submitBtnText">Submit Entry</span>`;
  }
}

function clearAlert() {
  const area = document.getElementById("alertArea");
  if (area) area.innerHTML = "";
}

function showAlert(type, srNo, message) {
  const area = document.getElementById("alertArea");
  if (!area) return;

  let html = "";

  if (type === "duplicate") {
    html = `
      <div class="alert alert-duplicate" role="alert">
        <div class="alert-icon">⚠️</div>
        <div class="alert-content">
          <div class="alert-title">
            <span class="badge badge-error">DUPLICATE ENTRY</span>
          </div>
          <div class="alert-body">
            This <strong>Name</strong> and <strong>Address</strong> combination already exists in the database.
            <br>Existing record: <strong style="color:#b91c1c;">Sr No #${srNo}</strong>
          </div>
        </div>
      </div>`;
  } else if (type === "error") {
    html = `
      <div class="alert alert-duplicate" role="alert">
        <div class="alert-icon">❌</div>
        <div class="alert-content">
          <div class="alert-title">Submission Error</div>
          <div class="alert-body">${message || "Something went wrong."}</div>
        </div>
      </div>`;
  } else if (type === "warning") {
    html = `
      <div class="alert alert-warning" role="alert">
        <div class="alert-icon">⚠️</div>
        <div class="alert-content">
          <div class="alert-title">Required Fields Missing</div>
          <div class="alert-body">${message}</div>
        </div>
      </div>`;
  }

  area.innerHTML = html;
  area.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ── Toast ─────────────────────────────────────────────────
function showToast(type, title, body, srNo) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${type === "success" ? "✅" : "❌"}</div>
    <div class="toast-text">
      <strong>${title}</strong>
      ${body ? `<div style="font-weight:400;font-size:0.8rem;margin-top:1px;opacity:0.85;">${body}</div>` : ""}
    </div>
    ${srNo ? `<span class="toast-sr">#${srNo}</span>` : ""}
  `;

  container.appendChild(toast);

  // Auto-dismiss after 3.5s
  const duration = 3500;
  setTimeout(() => {
    toast.classList.add("toast-exit");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, duration);

  // Click to dismiss early
  toast.addEventListener("click", () => {
    toast.classList.add("toast-exit");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  });
}

// ── Reset Form ────────────────────────────────────────────
function resetForm() {
  const form = document.getElementById("researchForm");
  if (form) form.reset();

  // Reset facility cards
  ["dharamshala", "bhojanshala", "aayambilshala"].forEach(fac => {
    const card = document.getElementById(fac + "Card");
    const status = document.getElementById(fac + "Status");
    if (card) {
      card.classList.remove("active");
      card.setAttribute("aria-checked", "false");
    }
    if (status) status.textContent = "No";
  });

  clearAlert();
  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(() => document.getElementById("name")?.focus(), 400);
}
