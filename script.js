// script.js — volunteer form with reCAPTCHA v3 integration
// 1) Set your reCAPTCHA site key here (or set to null to disable)
const RECAPTCHA_SITE_KEY = '6LemHQ8sAAAAABuB7GU5VRpLw7dMFxxGE1zDkMMH'; // <-- replace with your site key (public). If null, recaptcha is skipped.

const SUPABASE_URL = 'https://exuwgrqeecccowoymxxs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Ov-hEYH3LoEzkQtvzq1URg_TKf5QdeR';

// Keep supabase client for other read-only usage on client if needed.
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- DOM references ---
const volunteerForm = document.getElementById('volunteer-form');
const formStatus = document.getElementById('form-status');
const successModal = document.getElementById('success-modal');
const shareBtn = document.getElementById('share-btn');
const skillsCheckboxes = document.querySelectorAll('input[name="skills"]');
const saveBtn = document.getElementById('save-btn');

// Skill -> experience container mapping (unchanged)
const skillFieldsConfig = {
    'History': 'history-experience-container',
    'Exploration': 'exploration-experience-container',
    'Paper_Work': 'paper_work-experience-container',
    'Social_Media': 'social_media-experience-container',
    'Web_Interest': 'web_interest-experience-container',
    'Content_Writing': 'content_writing-experience-container',
    'PPT': 'ppt-experience-container',
    'Public_Speaking': 'public_speaking-experience-container',
    'Literature': 'literature-experience-container',
    'Illustration': 'illustration-experience-container',
    'Photography': 'photography-experience-container',
    'Excel': 'excel-experience-container',
    'Other': 'other-experience-container'
};

// --- Conditional skill experience fields ---
skillsCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
        const value = e.target.value;
        const containerId = skillFieldsConfig[value];
        const isChecked = e.target.checked;
        const container = document.getElementById(containerId);
        if (!container) return;

        if (isChecked) {
            container.innerHTML = `
                <div class="conditional-fields">
                    <label for="${value.toLowerCase()}_experience">Any Experience <small>(optional)</small></label>
                    <input type="text" id="${value.toLowerCase()}_experience" name="${value.toLowerCase()}_experience" placeholder="Describe your experience">
                </div>
            `;
        } else {
            container.innerHTML = '';
        }
    });
});

// --- recaptcha helper (v3) ---
// Returns token string or null if not configured or failed.
async function getRecaptchaToken(action = 'submit_volunteer') {
    try {
        if (!RECAPTCHA_SITE_KEY) return null;
        if (!window.grecaptcha || typeof window.grecaptcha.execute !== 'function') {
            console.warn('grecaptcha not loaded or execute not available.');
            return null;
        }
        // execute returns a Promise for token
        const token = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
        return token || null;
    } catch (err) {
        console.warn('recaptcha error', err);
        return null;
    }
}

// --- call server function ---
async function callSubmitVolunteerFunction(volunteerData, recaptchaToken = null) {
    const payload = { ...volunteerData, recaptchaToken };
    const url = '/.netlify/functions/submitVolunteer'; // change if using another host
    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const body = await resp.json().catch(() => null);
    if (!resp.ok) {
        const message = body?.error || body?.message || `HTTP ${resp.status}`;
        const details = body?.details ? ` - ${JSON.stringify(body.details)}` : '';
        throw new Error(message + details);
    }
    return body;
}

// --- Form submit handler ---
volunteerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(volunteerForm);
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    formStatus.textContent = 'Submitting...';

    if (!validateMandatoryFields(volunteerForm)) {
    return; // ⛔ stop submission
    }
    
    // Collect skills & experiences
    const skills = {};
    const selectedSkills = Array.from(skillsCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => {
            const skillName = cb.value;
            const experienceFieldName = `${skillName.toLowerCase()}_experience`;
            const experience = (formData.get(experienceFieldName) || '').toString().trim() || null;
            skills[skillName] = {
                selected: true,
                experience: experience
            };
            return skillName;
        });

    // Validation
    if (selectedSkills.length === 0) {
        alert('Please select at least one skill or interest to proceed.');
        submitBtn.disabled = false;
        formStatus.textContent = '';
        return;
    }
    if (selectedSkills.includes('Other') && !formData.get('other_experience')?.toString().trim()) {
        alert('Please specify your "Other" skill experience.');
        submitBtn.disabled = false;
        formStatus.textContent = '';
        return;
    }

    const ageValue = parseInt(formData.get('age'), 10);
    if (Number.isNaN(ageValue) || ageValue < 1 || ageValue > 120) {
        alert('Please enter a valid age between 1 and 120.');
        submitBtn.disabled = false;
        formStatus.textContent = '';
        return;
    }

    const volunteerData = {
        full_name: formData.get('full_name')?.toString().trim(),
        email: formData.get('email')?.toString().trim(),
        mobile_number: formData.get('mobile_no')?.toString().trim(),
        gender: formData.get('gender')?.toString().trim(),
        age: ageValue,
        education: formData.get('education')?.toString().trim(),
        city: formData.get('city')?.toString().trim(),
        address: formData.get('address')?.toString().trim(),
        skills,
        contribution_text: null,
        reference: formData.get('reference')?.toString().trim()
    };

    try {
        // Acquire fresh token right before submit. If SITE_KEY is null, token will be null and server
        // must allow missing token only if RECAPTCHA_SECRET not configured.
        const recaptchaToken = await getRecaptchaToken();
        console.log('recaptchaToken:', recaptchaToken);
        if (RECAPTCHA_SITE_KEY && !recaptchaToken) console.warn('reCAPTCHA token missing — check site key and allowed origins.');

        // If you require recaptcha on client, you may choose to block submission here when token is null.
        // For now we pass null to server if not available (server will validate if RECAPTCHA_SECRET set).
        const result = await callSubmitVolunteerFunction(volunteerData, recaptchaToken);
        console.log('Server returned', result);

        // Success UI & email send (unchanged)
        const userName = volunteerData.full_name;
        document.getElementById('user-name-placeholder').textContent = userName;
        formStatus.textContent = '';
        volunteerForm.reset();

        // NOTE: email is sent server-side by `submitVolunteer` function.
        // Removed client-side call to avoid duplicate confirmation emails.

        // Reset conditional fields
        const allSkillContainers = Object.values(skillFieldsConfig).map(id => document.getElementById(id)).filter(Boolean);
        allSkillContainers.forEach(container => container.innerHTML = '');

        submitBtn.disabled = false;
        successModal.classList.add('active');
        document.getElementById('user-name-placeholder').textContent = volunteerData.full_name;

        // WhatsApp redirect
        setTimeout(() => {
            const volunteerNumber = "919594503214";
            const messageText = `Jai Jinendra! I've just successfully registered as a LVJST member. Form Submitted by ${userName}.\n`;
            const whatsappUrl = `https://wa.me/${volunteerNumber}?text=${encodeURIComponent(messageText)}`;
            window.open(whatsappUrl, "_blank");
        }, 2000);

    } catch (err) {
        console.error('Submission error', err);
        alert('Submission failed: ' + (err.message || 'server error'));
        formStatus.textContent = `Error: ${err.message || 'Submission failed'}`;
        submitBtn.disabled = false;
    }
});
function validateMandatoryFields(form) {
  let firstInvalidField = null;
  let errors = [];

  // Clear previous errors
  document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));

  // 1️⃣ Text / input / textarea fields
  const requiredFields = form.querySelectorAll('.required-field');
  requiredFields.forEach(field => {
    if (!field.value || !field.value.trim()) {
      field.classList.add('field-error');
      errors.push(field.previousElementSibling?.innerText || field.name);
      if (!firstInvalidField) firstInvalidField = field;
    }
  });

  // 2️⃣ Gender (radio)
  const genderChecked = form.querySelector('input[name="gender"]:checked');
  if (!genderChecked) {
    const genderGroup = document.getElementById('gender-group');
    if (genderGroup) genderGroup.classList.add('field-error');
    errors.push('Gender');
    if (!firstInvalidField) firstInvalidField = genderGroup;
  }

  // 3️⃣ Skills (checkbox group)
  const skillsChecked = form.querySelectorAll('input[name="skills"]:checked');
  if (skillsChecked.length === 0) {
    const skillsGroup = document.getElementById('skills-checkbox-group');
    if (skillsGroup) skillsGroup.classList.add('field-error');
    errors.push('Skills / Interest');
    if (!firstInvalidField) firstInvalidField = skillsGroup;
  }

  // 4️⃣ Other skill validation
  const otherChecked = Array.from(skillsChecked).some(cb => cb.value === 'Other');
  if (otherChecked) {
    const otherExp = document.querySelector('input[name="other_experience"]');
    if (!otherExp || !otherExp.value.trim()) {
      otherExp?.classList.add('field-error');
      errors.push('Other skill description');
      if (!firstInvalidField) firstInvalidField = otherExp;
    }
  }

  // ❌ If errors found
  if (errors.length > 0) {
    alert(`Please complete the following mandatory fields:\n\n• ${errors.join('\n• ')}`);
    firstInvalidField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    firstInvalidField?.focus?.();
    return false;
  }

  return true;
}

const instagramBtn = document.getElementById('instagramFollowBtn');

if (instagramBtn) {
  instagramBtn.addEventListener('click', () => {
    window.open('https://www.instagram.com/lvjst_org/', '_blank');
  });
}


// Share button, save button, counter, modal click — unchanged (copied from your original script)
shareBtn.addEventListener('click', async () => {
    const originalText = 'Share';
    shareBtn.innerHTML = 'Success';
    shareBtn.disabled = true;

    try {
        const shareMessage =
`🌿 LABDHI VIKRAM JANSEVA TRUST (LVJST)
Preserving Heritage | Inspiring Values | Serving Society

LVJST is a national cultural and social organization working to protect India’s ancient heritage, spiritual wisdom, and compassionate traditions, while creating meaningful social impact across communities.

Our Key Work Areas:
🔹 Heritage Protection: Restoration, research & documentation of ancient Jain and Indic sites
🔹 Shrutodhar: Manuscript digitization, value education & knowledge dissemination
🔹 RUSHABHAYAN: National & global conclave honoring Lord Rushabhdev 
🔹 Jeevdaya: Panjrapoles, bird hospitals & animal welfare initiatives
🔹 Vaiyavacha: 600+ volunteers serving saints; medical kit distribution

🤝 Join us in this collective mission to preserve India’s civilizational legacy.

👉 Member Registration Link:
https://lvjstregister.netlify.app/`;
        if (navigator.share) {
            await navigator.share({ title: 'LVJST', text: shareMessage });
        } else {
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
            window.open(whatsappUrl, "_blank");
        }
    } catch (err) {
        console.error('Share failed:', err);
        alert('Could not share the message.');
    } finally {
        shareBtn.innerHTML = originalText;
        shareBtn.disabled = false;
    }
});

saveBtn.addEventListener('click', async () => {
    try {
        const elementToCapture = document.querySelector('#success-modal .modal-content');
        if (!elementToCapture) throw new Error("Modal content not found!");
        const canvas = await html2canvas(elementToCapture, { scale: 2, useCORS: true, backgroundColor: null });
        const link = document.createElement('a');
        link.download = 'lvjst_card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        console.error('Save failed:', err);
        alert('Could not save the card image.');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const countElement = document.getElementById('templesCount');
    const targetCount = 999;
    const duration = 4000;
    const steps = 40;
    let currentCount = 0;
    const increment = targetCount / steps;
    const stepDuration = duration / steps;

    const counter = setInterval(() => {
        currentCount += increment;
        if (currentCount >= targetCount) {
            currentCount = targetCount;
            clearInterval(counter);
        }
        if (countElement) countElement.textContent = Math.floor(currentCount);
    }, stepDuration);
});

successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
        successModal.classList.remove('active');
    }
});
