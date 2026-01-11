/******************************
 * SUPABASE CONFIG
 ******************************/
const SUPABASE_URL = "https://txorphhvewkhayehgaxr.supabase.co";
const SUPABASE_KEY = "sb_publishable_5XAIrP46ldT8nu5XdudUgA_bVOaQPYP";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

/******************************
 * HELPERS
 ******************************/
function showStatus(msg, isError = false, step = 1) {
  const el = step === 1 
    ? document.getElementById("form-status-step1") 
    : document.getElementById("form-status-step2");
  if (!el) return;
  el.textContent = msg;
  el.style.color = isError ? "crimson" : "green";
}

// ✅ AUTO-CAPITALIZE FUNCTION
function capitalizeText(str) {
  if (!str) return str;
  // Capitalize first letter of each word
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ✅ ADD AUTO-CAPITALIZE TO INPUT FIELD
function addAutoCapitalize(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  input.addEventListener("input", (e) => {
    e.target.value = capitalizeText(e.target.value);
  });
  
  input.addEventListener("blur", (e) => {
    e.target.value = capitalizeText(e.target.value);
  });
}

/******************************
 * FORM SUBMIT
 ******************************/
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("volunteer-form");
  const step1Section = document.getElementById("step-1-captain");
  const step2Section = document.getElementById("step-2-members");
  const nextBtn = document.getElementById("next-btn");
  const backBtn = document.getElementById("back-btn");
  const submitBtn = document.getElementById("submit-btn");
  const teamCountInput = document.getElementById("team_count");
  const teamMembersContainer = document.getElementById("team-members-container");
  const totalSurveysInput = document.getElementById("total_surveys");
  const surveySitesContainer = document.getElementById("survey-sites-container");

  if (!form) {
    console.error("Form not found: #volunteer-form");
    return;
  }

  // ✅ AUTO-CAPITALIZE ON CAPTAIN NAME INPUT
  addAutoCapitalize("captain_name");

  // ✅ DAY TOGGLE BUTTONS
  const dayToggleBtns = document.querySelectorAll(".toggle-btn");
  dayToggleBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const day = btn.getAttribute("data-day");
      
      // Remove active class from all buttons
      dayToggleBtns.forEach((b) => b.classList.remove("active"));
      
      // Add active class to clicked button
      btn.classList.add("active");
      
      // Set hidden input value
      document.getElementById("selected_day").value = day;
    });
  });

  // ✅ NEXT BUTTON - Validate Captain Info & Move to Step 2
  nextBtn.addEventListener("click", (e) => {
    e.preventDefault();

    // Validate captain info
    const captain_name = document.getElementById("captain_name").value.trim();
    const captain_number = document.getElementById("captain_number").value.trim();
    const team_count = parseInt(document.getElementById("team_count").value) || 0;
    const selected_day = document.getElementById("selected_day").value;
    const total_surveys = parseInt(document.getElementById("total_surveys").value) || 0;

    if (!captain_name) {
      showStatus("Please enter captain name", true, 1);
      return;
    }

    if (!captain_number) {
      showStatus("Please enter captain number", true, 1);
      return;
    }

    if (team_count < 1) {
      showStatus("Please enter number of team members", true, 1);
      return;
    }

    if (!selected_day) {
      showStatus("Please select a day (Day 1 or Day 2)", true, 1);
      return;
    }

    if (total_surveys < 0) {
      showStatus("Please enter total number of surveys", true, 1);
      return;
    }

    // All validations passed - Move to Step 2
    showStatus("", false, 1);
    step1Section.style.display = "none";
    step2Section.style.display = "block";

    // Display locked captain info
    document.getElementById("display-captain-name").textContent = captain_name;
    document.getElementById("display-captain-number").textContent = captain_number;
    document.getElementById("display-team-count").textContent = team_count;
    document.getElementById("display-selected-day").textContent = selected_day;
    document.getElementById("display-total-surveys").textContent = total_surveys;

    // Generate team member fields
    generateTeamMemberFields(team_count);
    // Also ensure survey site fields are shown in step1 summary display (if any)
  });

  // ✅ Generate survey site inputs dynamically as user types total_surveys
  function generateSurveySiteFields(count) {
    if (!surveySitesContainer) return;
    surveySitesContainer.innerHTML = "";
    const n = Math.max(0, Math.floor(count) || 0);
    if (n === 0) return;
    const heading = document.createElement('h4');
    heading.className = 'section-title';
    heading.innerHTML = '<i class="fas fa-map-marker-alt"></i> Survey Sites';
    surveySitesContainer.appendChild(heading);

    for (let i = 1; i <= n; i++) {
      const wrapper = document.createElement('div');
      wrapper.className = 'input-wrapper';
      wrapper.style.marginBottom = '6px';
      wrapper.innerHTML = `
        <label>Survey Site ${i} <span class="required-asterisk">*</span></label>
        <input type="text" id="survey_site_${i}" placeholder="Full site name with area" class="input-with-icon" />
      `;
      surveySitesContainer.appendChild(wrapper);
      addAutoCapitalize(`survey_site_${i}`);
    }
  }

  if (totalSurveysInput) {
    totalSurveysInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value) || 0;
      generateSurveySiteFields(val);
    });
  }

  // ✅ BACK BUTTON - Go back to Step 1
  backBtn.addEventListener("click", (e) => {
    e.preventDefault();
    step2Section.style.display = "none";
    step1Section.style.display = "block";
    showStatus("", false, 2);
  });

  // ✅ GENERATE TEAM MEMBER FIELDS
  function generateTeamMemberFields(teamCount) {
    teamMembersContainer.innerHTML = "";

    for (let i = 1; i <= teamCount; i++) {
      const memberSection = document.createElement("div");
      memberSection.className = "form-section";
      memberSection.innerHTML = `
        <h4 class="section-title">
          <i class="fas fa-user"></i> Team Member ${i}
        </h4>

        <!-- Member Name -->
        <label>
          <i class="fas fa-user"></i> Name of Team Member ${i} <span class="required-asterisk">*</span>
        </label>
        <div class="input-wrapper">
          <i class="fas fa-user input-icon"></i>
          <input
            type="text"
            id="member_name_${i}"
            placeholder="Enter team member's name"
            required
            class="input-with-icon"
          >
        </div>

        <!-- Member Contact -->
        <label>
          <i class="fas fa-mobile-alt"></i> Contact of Team Member ${i} <span class="required-asterisk">*</span>
        </label>
        <div class="input-wrapper">
          <i class="fas fa-phone input-icon"></i>
          <input
            type="tel"
            id="member_contact_${i}"
            placeholder="10-digit mobile number"
            required
            class="input-with-icon"
          >
        </div>

        <!-- Task Selection -->
        <label>
          <i class="fas fa-tasks"></i> Task Done <span class="required-asterisk">*</span>
        </label>
        <div class="task-buttons-wrapper">
          <button type="button" class="task-btn" data-task="Measuring Pratima" data-member="${i}">
            <i class="fas fa-ruler"></i> Measuring Pratima
          </button>
          <button type="button" class="task-btn" data-task="Form Filling" data-member="${i}">
            <i class="fas fa-pen-fancy"></i> Form Filling
          </button>
          <button type="button" class="task-btn" data-task="Photo/Video Capture" data-member="${i}">
            <i class="fas fa-camera"></i> Photo/Video Capture
          </button>
          <button type="button" class="task-btn" data-task="Other" data-member="${i}">
            <i class="fas fa-ellipsis-h"></i> Other
          </button>
        </div>

        <input type="hidden" id="task_${i}" value="">

        <!-- Other Task Input (Hidden by default) -->
        <div id="other-input-${i}" class="other-task-input" style="display: none;">
          <label>
            <i class="fas fa-pen"></i> Specify Other Task <span class="required-asterisk">*</span>
          </label>
          <div class="input-wrapper">
            <i class="fas fa-pen input-icon"></i>
            <input
              type="text"
              id="other_task_${i}"
              placeholder="Describe the task"
              class="input-with-icon"
            >
          </div>
        </div>
      `;

      teamMembersContainer.appendChild(memberSection);

      // ✅ ADD AUTO-CAPITALIZE TO MEMBER NAME AND OTHER TASK
      addAutoCapitalize(`member_name_${i}`);
      addAutoCapitalize(`other_task_${i}`);
    }

    // Attach task button listeners
    attachTaskButtonListeners();
  }

  // ✅ ATTACH TASK BUTTON LISTENERS
  function attachTaskButtonListeners() {
    const taskButtons = document.querySelectorAll(".task-btn");

    taskButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();

        const memberIndex = btn.getAttribute("data-member");
        const taskInput = document.getElementById(`task_${memberIndex}`);
        const otherInputDiv = document.getElementById(`other-input-${memberIndex}`);

        // Toggle active class for multi-select behavior
        btn.classList.toggle("active");

        // Collect selected tasks for this member
        const selected = Array.from(document.querySelectorAll(`.task-btn[data-member="${memberIndex}"]`))
          .filter(b => b.classList.contains('active'))
          .map(b => b.getAttribute('data-task'));

        // If Other is selected, show the other input, otherwise hide it
        if (selected.includes('Other')) {
          otherInputDiv.style.display = 'block';
          document.getElementById(`other_task_${memberIndex}`).required = true;
        } else {
          otherInputDiv.style.display = 'none';
          const otherEl = document.getElementById(`other_task_${memberIndex}`);
          if (otherEl) {
            otherEl.required = false;
            otherEl.value = '';
          }
        }

        // Store selected tasks as JSON in hidden input
        if (taskInput) taskInput.value = JSON.stringify(selected);
      });
    });
  }

  // ✅ FORM SUBMIT HANDLER
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate captain info
    const captain_name = document.getElementById("captain_name").value.trim();
    const captain_number = document.getElementById("captain_number").value.trim();
    const team_count = parseInt(document.getElementById("team_count").value);
    const selected_day = document.getElementById("selected_day").value;
    const total_surveys = parseInt(document.getElementById("total_surveys").value);

    if (!captain_name || !captain_number) {
      showStatus("Please enter captain name and number", true, 2);
      return;
    }

    if (team_count < 1) {
      showStatus("Please enter team count", true, 2);
      return;
    }

    if (!selected_day) {
      showStatus("Please select a day", true, 2);
      return;
    }

    if (total_surveys < 0 || isNaN(total_surveys)) {
      showStatus("Please enter total surveys", true, 2);
      return;
    }

    // Validate team members
    const teamMembers = [];
    for (let i = 1; i <= team_count; i++) {
      const member_name = document.getElementById(`member_name_${i}`).value.trim();
      const member_contact = document
        .getElementById(`member_contact_${i}`)
        .value.trim();
      const taskRaw = document.getElementById(`task_${i}`).value || '[]';
      let selectedTasks = [];
      try {
        selectedTasks = JSON.parse(taskRaw);
      } catch (err) {
        selectedTasks = taskRaw ? [taskRaw] : [];
      }

      if (!member_name || !member_contact || selectedTasks.length === 0) {
        showStatus(`Please fill all details for Team Member ${i}`, true, 2);
        return;
      }

      // If Other selected, require its description
      if (selectedTasks.includes('Other')) {
        const otherVal = document.getElementById(`other_task_${i}`).value.trim();
        if (!otherVal) {
          showStatus(`Please specify the task for Team Member ${i}`, true, 2);
          return;
        }
        // Replace 'Other' with provided text
        selectedTasks = selectedTasks.map(t => t === 'Other' ? otherVal : t);
      }

      teamMembers.push({
        member_name,
        member_contact,
        task: selectedTasks.join(' | '),
      });
    }

    submitBtn.disabled = true;
    showStatus("Saving team summary...", false, 2);

    // Insert team summary
    const { data, error } = await supabaseClient
      .from("bhavnagar_team_summary")
      .insert([
        {
          captain_name,
          captain_number,
          team_count,
          selected_day,
          total_surveys,
        },
      ])
      .select();

    if (error) {
      console.error(error);
      showStatus("Something went wrong. Please try again.", true, 2);
      submitBtn.disabled = false;
      return;
    }

    const summaryId = data[0].id;

    // Insert survey sites if provided
    try {
      const surveySites = [];
      const total = parseInt(document.getElementById('total_surveys').value) || 0;
      for (let s = 1; s <= total; s++) {
        const el = document.getElementById(`survey_site_${s}`);
        if (el && el.value.trim()) {
          surveySites.push({
            summary_id: summaryId,
            site_number: s,
            site_name_area: el.value.trim(),
          });
        }
      }

      if (surveySites.length > 0) {
        const { error: surveyError } = await supabaseClient.from('survey_sites').insert(surveySites);
        if (surveyError) {
          console.warn('Failed saving survey sites', surveyError);
          // not fatal — continue saving members
        }
      }
    } catch (err) {
      console.warn('Survey sites save error', err);
    }

    // Insert team members
    const membersData = teamMembers.map((member) => ({
      summary_id: summaryId,
      member_name: member.member_name,
      member_contact: member.member_contact,
      task_done: member.task,
    }));

    const { error: memberError } = await supabaseClient
      .from("team_members")
      .insert(membersData);

    if (memberError) {
      console.error(memberError);
      showStatus("Error saving team members. Please try again.", true, 2);
      submitBtn.disabled = false;
      return;
    }

    showStatus("🙏 Team summary saved successfully!", false, 2);
    submitBtn.disabled = false;

    // Pass team members to the success modal so we can display names
    showSuccessModal(captain_name, teamMembers);
  });
});

/******************************
 * SUCCESS MODAL
 ******************************/
function showSuccessModal(userName, teamMembers = []) {
  const modal = document.getElementById("success-modal");

  if (!modal) {
    console.error("Success modal not found");
    return;
  }

  // Build friendly message: Captain Name & my team Names ...
  const names = (teamMembers || []).map(m => m.member_name).filter(Boolean);
  const teamText = names.length ? names.join(', ') : 'my team';
  const message = `${userName} & ${teamText} have successfully completed LVJST Survey Trip of Bhavnagar.\nThank You`;

  // Update modal content
  const heading = modal.querySelector('h2');
  if (heading) heading.textContent = 'LVJST Survey Trip Completed!';

  const noteBox = modal.querySelector('.note-box');
  if (noteBox) {
    noteBox.innerHTML = `${message.replace(/\n/g, '<br>')}<br>`;
  }

  modal.classList.add("active");
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");

  // Keep modal visible (do not reload). Allow user to close by clicking overlay.
  // Wire share buttons
  const whatsappBtn = document.getElementById('whatsapp-share-btn');
const shareText = `${userName} & ${teamText} have successfully completed LVJST Survey Trip of Bhavnagar. Thank You`;

if (whatsappBtn) {
  whatsappBtn.onclick = async () => {
    const modalEl = document.querySelector('#success-modal .modal-content');
    if (!modalEl) {
      alert('Could not find modal content to capture.');
      return;
    }

    try {
      /* 1️⃣ Freeze animations & transitions */
      modalEl.classList.add('capture-mode');

      /* 2️⃣ Lock width for WhatsApp (1080px standard) */
      const originalWidth = modalEl.style.width;
      modalEl.style.width = '1080px';

      /* 3️⃣ Ensure fonts are fully loaded */
      await document.fonts.ready;

      /* 4️⃣ Capture with WhatsApp-optimized settings */
      const canvas = await html2canvas(modalEl, {
        scale: 3,                       // sharp image
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FAF7F2',     // SAME as card background
        logging: false,
      });

      /* 5️⃣ Cleanup UI state */
      modalEl.style.width = originalWidth;
      modalEl.classList.remove('capture-mode');

      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Capture failed.');
          return;
        }

        const file = new File([blob], 'lvjst-bhavnagar.png', {
          type: 'image/png',
          lastModified: Date.now(),
        });

        const textWithLink =
          shareText + '\n\nVisit: https://lvjst.org/bhavnagar-summary/';

        /* 6️⃣ Native WhatsApp share (Mobile) */
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              text: textWithLink,
            });
            return;
          } catch (err) {
            console.warn('Web Share failed', err);
          }
        }

        /* 7️⃣ Fallback: download + WhatsApp Web */
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lvjst-bhavnagar.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);

        const waUrl = `https://wa.me/?text=${encodeURIComponent(textWithLink)}`;
        window.open(waUrl, '_blank');

        alert('Image downloaded. Attach it in WhatsApp to share.');
      }, 'image/png');

    } catch (err) {
      console.error('Capture/share error', err);
      alert('Could not capture or share image.');
    }
  };
}

  // if (copyBtn) {
  //   copyBtn.onclick = async () => {
  //     try {
  //       await navigator.clipboard.writeText(shareText + '\n\nVisit: https://lvjst.org/bhavnagar-summary/');
  //       copyBtn.textContent = 'Copied!';
  //       setTimeout(() => copyBtn.textContent = 'Copy Share Text', 2000);
  //     } catch (err) {
  //       console.warn('Copy failed', err);
  //       alert('Could not copy to clipboard.');
  //     }
  //   };
  // }
}
