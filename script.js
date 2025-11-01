// This file will handle the survey form logic.
const SUPABASE_URL = 'https://exuwgrqeecccowoymxxs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Ov-hEYH3LoEzkQtvzq1URg_TKf5QdeR';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 1. Form Elements ---
const volunteerForm = document.getElementById('volunteer-form');
const formStatus = document.getElementById('form-status');
const successModal = document.getElementById('success-modal');
const closeSuccessModalBtn = document.getElementById('save-btn');
const shareBtn = document.getElementById('share-btn');

const skillsCheckboxes = document.querySelectorAll('input[name="skills"]');

// Map skill values to experience container IDs
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

// --- 2. Conditional Logic ---
skillsCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
        const value = e.target.value;
        const containerId = skillFieldsConfig[value];
        const isChecked = e.target.checked;
        const container = document.getElementById(containerId);

        // Conditional logic for skills: show experience field if checked
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

// --- 3. Form Submission ---
volunteerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(volunteerForm);
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    formStatus.textContent = 'Submitting...';

    // Collect skills data with experience
    const skills = {};
    const selectedSkills = Array.from(skillsCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => {
            const skillName = cb.value;
            const experienceFieldName = `${skillName.toLowerCase()}_experience`;
            const experience = formData.get(experienceFieldName) || null;
            skills[skillName] = {
                selected: true,
                experience: experience
            };
            return skillName;
        });

    // Form validation checks for skills only
    if (selectedSkills.length === 0) {
        alert('Please select at least one skill or interest to proceed.');
        submitBtn.disabled = false;
        formStatus.textContent = '';
        return;
    }
    if (selectedSkills.includes('Other') && !formData.get('other_experience')?.trim()) {
        alert('Please specify your "Other" skill experience.');
        submitBtn.disabled = false;
        formStatus.textContent = '';
        return;
    }

    // Validate age (replaces DOB)
    const ageValue = parseInt(formData.get('age'), 10);
    if (Number.isNaN(ageValue) || ageValue < 1 || ageValue > 120) {
        alert('Please enter a valid age between 1 and 120.');
        submitBtn.disabled = false;
        formStatus.textContent = '';
        return;
    }

    // Create volunteer data object (use age instead of date_of_birth)
    const volunteerData = {
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        mobile_number: formData.get('mobile_no'),
        gender: formData.get('gender'),
        age: ageValue,
        education: formData.get('education'),
        city: formData.get('city'),
        address: formData.get('address'),
        skills: skills,
        // contribution_text: formData.get('contribution'),
        reference: formData.get('reference'),
    };

    // Insert data into Supabase
    const { data, error } = await supabaseClient
        .from('volunteers')
        .insert([volunteerData])
        .select();

    if (error) {
        console.error('Error submitting form:', error);
        formStatus.textContent = `Error: ${error.message}`;
        submitBtn.disabled = false;
        return;
    }

    const userName = formData.get('full_name');
    document.getElementById('user-name-placeholder').textContent = userName;
    // Show success message
    formStatus.textContent = '';
    volunteerForm.reset();
    if (!error) {
        // Trigger confirmation email
        try {
            await fetch("/.netlify/functions/send_email", {
                method: "POST",
                body: JSON.stringify({
                    email: volunteerData.email,
                    name: volunteerData.full_name
                })
            });
        } catch (err) {
            console.error("Email send failed:", err);
        }
    }
    // Reset conditional fields
    const allSkillContainers = Object.values(skillFieldsConfig).map(id => document.getElementById(id)).filter(el => el);
    allSkillContainers.forEach(container => container.innerHTML = '');

    submitBtn.disabled = false;
    successModal.classList.add('active');
    document.getElementById('user-name-placeholder').textContent = volunteerData.full_name;

    // Handle WhatsApp redirect
    // setTimeout(() => {
    //     // const volunteerNumber = "";
    //     const whatsappGroupLink = "https://chat.whatsapp.com/9594503214"; // <-- Replace with your actual WhatsApp Group link
    //     const messageText = `Hello! I've just successfully registered as a LVJST member.`;
    //     const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(messageText)}&link=${whatsappGroupLink}`;
    //     window.open(whatsappUrl, "_blank");
    // }, 2000);
    setTimeout(() => {
            const volunteerNumber = "919594503214";
            const messageText = `Jai Jinendra! I've just successfully registered as a LVJST member. From Submitted by ${userName}.\n`;
            const whatsappUrl = `https://wa.me/${volunteerNumber}?text=${encodeURIComponent(messageText)}`;
            window.open(whatsappUrl, "_blank");
        }, 2000);
});

// --- 4. Share & Modal ---
shareBtn.addEventListener('click', async () => {
    const originalText = 'Share';
    shareBtn.innerHTML = 'Success';
    shareBtn.disabled = true;

    try {
        const shareMessage =
            `RUSHABHAYAN 2.0, A cultural event that celebrates our Indian knowledge systems and the explore Teachings of Raja Rushabh. 

Join the Team not just for work, but also learn and grow knowledge. You won't just be working but learn valuable Facts and hands-on Team experience.  

✨ Deeply connect with our roots of Jainism and understand the Importance of Jain Knowledge Base in Indian Civilization  
✨ Connect with Kalyanmitras and share your Ideas & Perspectives  
✨ Gain real experience in teamwork, event planning, and creative work  

Various teams:  
📢 Social Media & Promotions – posters, designs, marketing  
🔎 Research Team – collect scripts and letter drafting  
🤝 Connections & Outreach – Meet with scholars and Communities

Fill Form : https://rushabhayan.netlify.app/
`;

        if (navigator.share) {
            await navigator.share({
                title: 'Rushabhayan 2.0 Invitation',
                text: shareMessage
            });
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

// --- 5. Save Button (Download Card Image) ---
const saveBtn = document.getElementById('save-btn');

saveBtn.addEventListener('click', async () => {
    try {
        const elementToCapture = document.querySelector('#success-modal .modal-content');
        if (!elementToCapture) throw new Error("Modal content not found!");

        const canvas = await html2canvas(elementToCapture, { scale: 2, useCORS: true, backgroundColor: null });
        const link = document.createElement('a');
        link.download = 'rushabhayan_card.png';
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
        countElement.textContent = Math.floor(currentCount);
    }, stepDuration);
});

successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
        successModal.classList.remove('active');
    }
});