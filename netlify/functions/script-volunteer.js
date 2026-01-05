// script-volunteer.js
// Client-side submission that calls the server function.
// If you have reCAPTCHA, set RECAPTCHA_SITE_KEY; otherwise set to null.

const RECAPTCHA_SITE_KEY = '6LemHQ8sAAAAABuB7GU5VRpLw7dMFxxGE1zDkMMH'; // replace or set to null

// For recaptcha v3: load script in index.html when RECAPTCHA_SITE_KEY is set:
// <script src="https://www.google.com/recaptcha/api.js?render=YOUR_RECAPTCHA_SITE_KEY"></script>

async function getRecaptchaToken(action = 'submit_volunteer') {
  if (!RECAPTCHA_SITE_KEY) return null;
  if (!window.grecaptcha) {
    console.warn('grecaptcha not loaded');
    return null;
  }
  try {
    const token = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
    return token;
  } catch (e) {
    console.warn('recaptcha execute failed', e);
    return null;
  }
}

async function submitVolunteerForm(e) {
  e.preventDefault();
  const submitBtn = document.querySelector('#submitBtn') || e.target.querySelector('button[type=submit]');
  if (submitBtn) submitBtn.disabled = true;

  // adapt selectors to your form
  const full_name = document.querySelector('#full_name')?.value || document.querySelector('[name="full_name"]')?.value;
  const email = document.querySelector('#email')?.value || document.querySelector('[name="email"]')?.value;
  const mobile_number = document.querySelector('#mobile_number')?.value || document.querySelector('[name="mobile_number"]')?.value;
  const gender = document.querySelector('#gender')?.value || document.querySelector('[name="gender"]')?.value;
  const occupation_type = (document.querySelector('input[name="occupation_type"]:checked')?.value) || null;
  const occupation_detail = document.querySelector('#occupation_student_detail')?.value || document.querySelector('#occupation_working_detail')?.value || document.querySelector('[name="occupation_detail"]')?.value || null;
  const city = document.querySelector('#city')?.value || document.querySelector('[name="city"]')?.value;
  const address = document.querySelector('#address')?.value || document.querySelector('[name="address"]')?.value;
  const contribution_text = document.querySelector('#contribution_text')?.value || document.querySelector('[name="contribution_text"]')?.value;
  const reference = document.querySelector('#reference')?.value || document.querySelector('[name="reference"]')?.value;
  const ageValue = document.querySelector('#age')?.value || document.querySelector('[name="age"]')?.value;

  // Example: building skills JSON from checkboxes named "skill"
  const skillNodes = Array.from(document.querySelectorAll('input[name="skill"]:checked') || []);
  // store as array of values or an object with more details
  const skills = skillNodes.map(n => n.value);

  // basic client-side validation
  if (!full_name || !email || !mobile_number || !reference) {
    alert('Please fill required fields: name, email, mobile number, reference.');
    if (submitBtn) submitBtn.disabled = false;
    return;
  }

  const recaptchaToken = await getRecaptchaToken();

  const body = {
    full_name,
    email,
    mobile_number,
    gender,
    occupation_type,
    occupation_detail,
    city,
    address,
    skills,
    contribution_text,
    reference,
    age: ageValue ? Number(ageValue) : null,
    recaptchaToken
  };

  try {
    const res = await fetch('/.netlify/functions/submitVolunteer', { // change URL if using another host
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const resJson = await res.json().catch(() => null);

    if (!res.ok) {
      console.error('server error', resJson);
      alert('Submission failed: ' + (resJson?.error || res.statusText));
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    // success
    alert('Thank you! Your volunteer registration was submitted.');
    // optionally reset the form
    (e.target || document.querySelector('#volunteerForm'))?.reset();
  } catch (err) {
    console.error('submit error', err);
    alert('Submission failed. Try again later.');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

// wiring - replace '#volunteerForm' with your form id
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#volunteerForm');
  if (form) form.addEventListener('submit', submitVolunteerForm);
});
