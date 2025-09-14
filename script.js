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
const otherSkillInputContainer = document.getElementById('other-skill-input');
const connectionsCheckboxes = document.querySelectorAll('input[name="connections"]');
const otherConnectionInputContainer = document.getElementById('other-connection-input');

// Map of connection values to container IDs
const connectionFieldsConfig = {
    'Politician': 'politician-input-container',
    'Business Person / Entrepreneur': 'business-person-input-container',
    'Celebrity / Cricketer': 'celebrity-input-container',
    'Influencer': 'influencer-input-container',
    'Podcast Host / Platform': 'podcast-input-container',
    'Jain Classical Performer': 'performer-input-container',
    'Hostel / College / University': 'college-input-container',
    'Exhibition Stall Partner / Sponsor': 'sponsor-input-container',
    'Media / Press / Journalist': 'media-input-container',
    'Jain Pathshala': 'pathshala-input-container',
    'Jain Sangh': 'sangh-input-container'
};

// A helper function to sanitize values for database column names
function sanitizeValue(value) {
    return value.replace(/\s*\/\s*/g, '_')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '')
        .toLowerCase();
}

// --- 2. Conditional Logic ---
skillsCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        const otherChecked = document.querySelector('input[name="skills"][value="Other"]').checked;
        otherSkillInputContainer.innerHTML = otherChecked
            ? `<input type="text" name="other_skill_text" placeholder="Please specify your skill" required>`
            : '';
    });
});

connectionsCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
        const value = e.target.value;
        const containerId = connectionFieldsConfig[value];
        const isOther = value === 'Other';
        const isSelected = e.target.checked;

        if (isOther) {
            otherConnectionInputContainer.innerHTML = isSelected
                ? `<label for="other_connection_text">Please specify your connection <small>(required)</small></label>
                   <input type="text" id="other_connection_text" name="other_connection_text" required>`
                : '';
        } else if (containerId && isSelected) {
            const sanitizedValue = sanitizeValue(value);
            const container = document.getElementById(containerId);
            container.innerHTML = `
                <div class="conditional-fields">
                    <label for="${sanitizedValue}_name">Name <small>(optional)</small></label>
                    <input type="text" id="${sanitizedValue}_name" name="${sanitizedValue}_name">
                    <label for="${sanitizedValue}_contact">Contact No <small>(optional)</small></label>
                    <input type="tel" id="${sanitizedValue}_contact" name="${sanitizedValue}_contact">
                </div>
            `;
        } else if (containerId && !isSelected) {
            const container = document.getElementById(containerId);
            if (container) container.innerHTML = '';
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
            let experience = null;

            if (skillName === 'Excel') {
                experience = formData.get('excel_experience') || null;
            } else if (skillName === 'Other') {
                experience = formData.get('other_skill') || null;
            }

            skills[skillName] = {
                selected: true,
                experience: experience
            };

            return skillName;
        });

    if (selectedSkills.length === 0) {
        alert('Please select at least one skill or interest to proceed.');
        submitBtn.disabled = false;
        formStatus.textContent = '';
        return;
    }

    // Handle file upload
    let photoUrl = '';
    const photoFile = formData.get('photo');
    if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabaseClient
            .storage
            .from('volunteer-photos')
            .upload(fileName, photoFile);

        if (uploadError) {
            console.error('Error uploading photo:', uploadError);
            formStatus.textContent = 'Error uploading photo';
            submitBtn.disabled = false;
            return;
        }

        photoUrl = fileName;
    }

    // Create volunteer data object
    const volunteerData = {
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        mobile_number: formData.get('mobile_no'),
        gender: formData.get('gender'),
        date_of_birth: formData.get('dob'),
        address: formData.get('address'),
        photo_url: photoUrl,
        education: formData.get('education'),
        skills: skills, // Store the skills object as JSONB
        contribution_text: formData.get('contribution'),
        reference: formData.get('reference')
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

    // Show success message
    formStatus.textContent = '';
    volunteerForm.reset();
    skillExcelContainer.innerHTML = '';
    skillOtherContainer.innerHTML = '';
    submitBtn.disabled = false;
    successModal.classList.add('active');
    document.getElementById('user-name-placeholder').textContent = volunteerData.full_name;

    // Handle WhatsApp redirect
    setTimeout(() => {
        const volunteerNumber = "919594503214";
        const messageText = `📌 LVJST Members Registration\n\nA response has been submitted by ${volunteerData.full_name}.\n`;
        const whatsappUrl = `https://wa.me/${volunteerNumber}?text=${encodeURIComponent(messageText)}`;
        window.open(whatsappUrl, "_blank");
    }, 2000);
});

// --- 4. Share & Modal --- (TEXT ONLY, no image)
shareBtn.addEventListener('click', async () => {
    const originalText = 'Share';
    shareBtn.innerHTML = 'Success';
    shareBtn.disabled = true;

    try {
        // Long custom message
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
            // Fallback: open WhatsApp with prefilled text
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
const saveBtn = document.getElementById('save-btn'); // <- replace old close button id with this

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
