// script.js — volunteer form with reCAPTCHA v3 integration
const RECAPTCHA_SITE_KEY = '6LemHQ8sAAAAABuB7GU5VRpLw7dMFxxGE1zDkMMH'; 

const SUPABASE_URL = 'https://exuwgrqeecccowoymxxs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Ov-hEYH3LoEzkQtvzq1URg_TKf5QdeR';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- DOM references ---
const volunteerForm = document.getElementById('volunteer-form');
const formStatus = document.getElementById('form-status');
const successModal = document.getElementById('success-modal');
const shareBtn = document.getElementById('share-btn');
const skillsCheckboxes = document.querySelectorAll('input[name="skills"]');
const saveBtn = document.getElementById('save-btn');
const occupationRadios = document.querySelectorAll('input[name="occupation_type"]');
const occupationStudentContainer = document.getElementById('occupation-student-container');
const occupationWorkingContainer = document.getElementById('occupation-working-container');

// Wizard Refs
const steps = document.querySelectorAll('.form-step');
const stepIndicators = document.querySelectorAll('.step-indicator .step');
const nextBtn = document.getElementById('next-btn');
const backBtn = document.getElementById('back-btn');
const submitBtn = document.getElementById('submit-btn');

// Event Modal Refs
const eventModal = document.getElementById('event-modal');
const viewEventBtn = document.getElementById('view-event-btn');
const closeEventBtn = document.getElementById('close-event-btn');

let currentStep = 1;
const totalSteps = 4;

// Skill -> experience container mapping
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

// --- Wizard Navigation Logic ---

function showStep(step) {
    // Show/Hide Steps
    steps.forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${step}`).classList.add('active');

    // Update Indicators
    stepIndicators.forEach(el => {
        const s = parseInt(el.getAttribute('data-step'));
        if (s === step) el.classList.add('active');
        else el.classList.remove('active');
    });

    // Buttons Visibility
    if (step === 1) {
        backBtn.style.display = 'none';
    } else {
        backBtn.style.display = 'block';
    }

    if (step === totalSteps) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        nextBtn.innerText = `Continue`;
        submitBtn.style.display = 'none';
    }

    // Scroll to top of form
    const card = document.querySelector('.registration-card');
    if (card) {
        const rect = card.getBoundingClientRect();
        if (rect.top < 0) card.scrollIntoView({behavior: 'smooth'});
    }
}

nextBtn.addEventListener('click', () => {
    // Validate current step
    const currentStepEl = document.getElementById(`step-${currentStep}`);
    if (validateStep(currentStepEl)) {
        if (currentStep < totalSteps) {
            currentStep++;
            showStep(currentStep);
        }
    }
});

backBtn.addEventListener('click', () => {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
});

function validateStep(stepEl) {
    let isValid = true;
    let errors = [];
    document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));

    // Check generic inputs in this step
    const inputs = stepEl.querySelectorAll('input[required], textarea[required]');
    inputs.forEach(field => {
        if (!field.value || !field.value.trim()) {
            field.classList.add('field-error');
            isValid = false;
        }
    });

    // Step 1: Personal (Gender)
    if (currentStep === 1) {
        const gender = stepEl.querySelector('input[name="gender"]:checked');
        if (!gender) {
            isValid = false;
            alert('Please select your Gender.');
            return false;
        }
    }

    // Step 2: Professional & Location (Occupation, City, Address)
    if (currentStep === 2) {
        const occType = stepEl.querySelector('input[name="occupation_type"]:checked');
        if (!occType) {
            alert('Please select Occupation Type.');
            return false;
        }
        // Conditional detail check
        const detailInput = stepEl.querySelector('input[name="occupation_detail"]');
        if (detailInput && !detailInput.value.trim()) {
            detailInput.classList.add('field-error');
            isValid = false;
        }
        // City and Address checks are handled by generic input loop above
    }

    // Step 3: Skills
    if (currentStep === 3) {
        const skillsChecked = stepEl.querySelectorAll('input[name="skills"]:checked');
        if (skillsChecked.length === 0) {
            alert('Please select at least one Area of Interest.');
            return false;
        }
    }

    // Step 4: Finalize (Attendance)
    if (currentStep === 4) {
        const attend = stepEl.querySelector('input[name="attend_orientation"]:checked');
        if (!attend) {
            alert('Please confirm Orientation attendance.');
            return false;
        }
    }

    if (!isValid) {
        alert('Please fill in all mandatory fields marked with *');
        return false;
    }

    return true;
}

// --- Event Modal Logic ---
if (viewEventBtn) {
    viewEventBtn.addEventListener('click', () => {
        eventModal.classList.add('active');
    });
}
if (closeEventBtn) {
    closeEventBtn.addEventListener('click', () => {
        eventModal.classList.remove('active');
    });
}
if (eventModal) {
    eventModal.addEventListener('click', (e) => {
        if (e.target === eventModal) {
            eventModal.classList.remove('active');
        }
    });
}

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
                <div class="conditional-wrapper">
                    <input type="text" id="${value.toLowerCase()}_experience" name="${value.toLowerCase()}_experience" placeholder="Describe your experience in ${value} (Optional)">
                </div>
            `;
        } else {
            container.innerHTML = '';
        }
    });
});

// --- Occupation toggle handling ---
if (occupationRadios && occupationRadios.length) {
    occupationRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const val = e.target.value;
            // Clear both containers
            if (occupationStudentContainer) occupationStudentContainer.innerHTML = '';
            if (occupationWorkingContainer) occupationWorkingContainer.innerHTML = '';

            if (val === 'Student') {
                if (occupationStudentContainer) {
                    occupationStudentContainer.innerHTML = `
                        <div class="field-block">
                            <label class="micro-label">DEGREE / COURSE *</label>
                            <input type="text" id="occupation_student_detail" name="occupation_detail" required placeholder="e.g., B.Arch, Engineering">
                        </div>
                    `;
                }
            } else if (val === 'Working') {
                if (occupationWorkingContainer) {
                    occupationWorkingContainer.innerHTML = `
                        <div class="field-block">
                            <label class="micro-label">JOB ROLE / BUSINESS *</label>
                            <input type="text" id="occupation_working_detail" name="occupation_detail" required placeholder="e.g., Senior Architect, Business Owner">
                        </div>
                    `;
                }
            }
        });
    });
}

// --- recaptcha helper (v3) ---
async function getRecaptchaToken(action = 'submit_volunteer') {
    try {
        if (!RECAPTCHA_SITE_KEY) return null;
        if (!window.grecaptcha || typeof window.grecaptcha.execute !== 'function') {
            return null;
        }
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
    const url = '/.netlify/functions/submitVolunteer'; 
    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const body = await resp.json().catch(() => null);
    if (!resp.ok) {
        const message = body?.error || body?.message || `HTTP ${resp.status}`;
        throw new Error(message);
    }
    return body;
}

// --- Form submit handler ---
volunteerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateStep(document.getElementById('step-4'))) return;

    const formData = new FormData(volunteerForm);
    const originalBtnText = submitBtn.innerText;
    
    submitBtn.disabled = true;
    submitBtn.innerText = 'PROCESSING...';
    formStatus.textContent = '';
    
    // Collect skills & experiences
    const skills = {};
    Array.from(skillsCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => {
            const skillName = cb.value;
            const experienceFieldName = `${skillName.toLowerCase()}_experience`;
            const experience = (formData.get(experienceFieldName) || '').toString().trim() || null;
            skills[skillName] = {
                selected: true,
                experience: experience
            };
        });

    const ageValue = parseInt(formData.get('age'), 10);
    const volunteerData = {
        full_name: formData.get('full_name')?.toString().trim(),
        email: formData.get('email')?.toString().trim(),
        mobile_number: formData.get('mobile_no')?.toString().trim(),
        gender: formData.get('gender')?.toString().trim(),
        age: ageValue,
        occupation_type: formData.get('occupation_type')?.toString().trim(),
        occupation_detail: formData.get('occupation_detail')?.toString().trim() || null,
        city: formData.get('city')?.toString().trim(),
        address: formData.get('address')?.toString().trim(),
        skills,
        attend_orientation: formData.get('attend_orientation')?.toString().trim(),
        contribution_text: null,
        reference: formData.get('reference')?.toString().trim()
    };

    try {
        const recaptchaToken = await getRecaptchaToken();
        await callSubmitVolunteerFunction(volunteerData, recaptchaToken);
        
        // Success UI
        const userName = volunteerData.full_name;
        document.getElementById('user-name-placeholder').textContent = userName;
        formStatus.textContent = '';
        volunteerForm.reset();

        // Reset UI
        currentStep = 1;
        showStep(1);
        
        // Reset dynamic fields
        const allSkillContainers = Object.values(skillFieldsConfig).map(id => document.getElementById(id)).filter(Boolean);
        allSkillContainers.forEach(container => container.innerHTML = '');
        if (occupationStudentContainer) occupationStudentContainer.innerHTML = '';
        if (occupationWorkingContainer) occupationWorkingContainer.innerHTML = '';

        submitBtn.disabled = false;
        submitBtn.innerText = originalBtnText;
        successModal.classList.add('active');

    } catch (err) {
        console.error('Submission error', err);
        alert('Submission failed: ' + (err.message || 'server error'));
        formStatus.textContent = `Error: ${err.message || 'Submission failed'}`;
        submitBtn.disabled = false;
        submitBtn.innerText = originalBtnText;
    }
});

// Success Modal Close
successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
        successModal.classList.remove('active');
    }
});

// Share button
shareBtn.addEventListener('click', async () => {
    const shareMessage = `🌿 LABDHI VIKRAM JANSEVA TRUST (LVJST)\nPreserving Heritage | Inspiring Values\n\nRegister here: https://lvjstregister.netlify.app/`;
    if (navigator.share) {
        await navigator.share({ title: 'LVJST', text: shareMessage });
    } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank");
    }
});

saveBtn.addEventListener('click', async () => {
    try {
        const elementToCapture = document.querySelector('#success-modal .modal-content');
        const canvas = await html2canvas(elementToCapture, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        link.download = 'lvjst_registration_card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        alert('Could not save image.');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    showStep(1);
});