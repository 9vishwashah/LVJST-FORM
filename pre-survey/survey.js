const SUPABASE_URL = "https://filyclgrctiyercthvmq.supabase.co";
const SUPABASE_KEY = "sb_publishable_WkPoLV_QIgETY8jxPVKJeg_Ap1GMyQo";
let supabaseClient = null;

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
    console.log("Survey JS Loaded");

    // Initialize Supabase safely
    try {
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log("Supabase Initialized");
        } else {
            console.error("Supabase SDK not found!");
            alert("Error: Supabase SDK not loaded. Please refresh the page.");
        }
    } catch (err) {
        console.error("Supabase Init Error:", err);
    }

    const form = document.getElementById("survey-form");
    if (!form) {
        console.error("Form element 'survey-form' not found!");
        return;
    }

    const SUBMIT_BTN = document.getElementById("submit-btn");
    const NEXT_BTN = document.getElementById("next-btn");
    const BACK_BTN = document.getElementById("back-btn");
    const STEPS = document.querySelectorAll(".form-step");
    const INDICATORS = document.querySelectorAll(".step");

    if (!SUBMIT_BTN || !NEXT_BTN || !BACK_BTN || STEPS.length === 0) {
        console.error("Critical DOM elements missing");
        return;
    }

    let currentStep = 1;
    const totalSteps = STEPS.length;

    // Mobile Menu Toggle
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            navLinks.classList.toggle("active");
            const icon = menuToggle.querySelector("i");
            if (navLinks.classList.contains("active")) {
                icon.classList.remove("fa-bars");
                icon.classList.add("fa-xmark");
            } else {
                icon.classList.remove("fa-xmark");
                icon.classList.add("fa-bars");
            }
        });
    }

    // --- Core Functions ---

    // Trustee Add
    window.addTrustee = function () {
        const container = document.getElementById("trustee-container");
        const div = document.createElement("div");
        div.className = "trustee-item";
        div.innerHTML = `
            <button type="button" class="delete-trustee-btn" onclick="this.parentElement.remove()" title="Remove Trustee">
                <i class="fa-solid fa-trash"></i>
            </button>
            <div class="row">
                <div class="col">
                    <div class="input-group">
                        <label class="field-label">Trustee Name</label>
                        <input type="text" name="trustee_name[]" placeholder="Full Name">
                    </div>
                </div>
                <div class="col">
                    <div class="input-group">
                        <label class="field-label">Trustee Mobile</label>
                        <input type="tel" name="trustee_mobile[]" placeholder="Mobile Number">
                    </div>
                </div>
            </div>
        `;
        container.appendChild(div);
    };

    // File Upload UI Feedback logic
    function setupFileUploadUI(inputId, containerId) {
        const fileInput = document.getElementById(inputId);
        const container = document.getElementById(containerId);

        if (!fileInput || !container) return;

        fileInput.addEventListener('change', function (e) {
            const fileNameSpan = container.querySelector('.file-name');
            const icon = container.querySelector('i');
            const text = container.querySelector('.upload-text');

            if (this.files && this.files[0]) {
                const file = this.files[0];
                container.classList.add('success');
                fileNameSpan.innerText = file.name;
                text.innerText = "Photo Selected";

                // Change Icon to Check
                icon.className = "fa-solid fa-circle-check";
            } else {
                container.classList.remove('success');
                fileNameSpan.innerText = "";
                text.innerText = "Click to Upload Photo";
                icon.className = "fa-solid fa-cloud-arrow-up";
            }
        });
    }

    // Initialize File UIs
    setupFileUploadUI('file-mulnayak', 'upload-mulnayak');
    setupFileUploadUI('file-jinalay', 'upload-jinalay');

    // Upload Image Helper
    async function uploadFile(file, folder) {
        if (!supabaseClient) throw new Error("Supabase client not initialized");

        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { data, error } = await supabaseClient.storage
            .from("temple-photos")
            .upload(`${folder}/${fileName}`, file);

        if (error) throw error;

        // Construct Public URL (Assuming bucket is public)
        return `${SUPABASE_URL}/storage/v1/object/public/temple-photos/${folder}/${fileName}`;
    }

    // --- Geolocation Logic ---
    window.getCurrentLocation = function () {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        const btn = document.querySelector(".get-location-btn");
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Locating...`;
        btn.disabled = true;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const gmapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

                const input = document.querySelector("input[name='gmaps_link']");
                if (input) {
                    input.value = gmapsUrl;
                    input.classList.add("success-border"); // Optional: styling for success
                }

                btn.innerHTML = `<i class="fa-solid fa-check"></i> Found`;
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }, 2000);
            },
            (error) => {
                console.error("Error getting location:", error);
                alert("Unable to retrieve location. Please check your permissions.");
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        );
    };

    // --- Navigation Logic ---

    // Update UI (Show/Hide Steps & Buttons)
    function updateStepUI() {
        console.log("Updating UI for Step:", currentStep);

        // Show/Hide Form Steps
        STEPS.forEach((step, index) => {
            if (index + 1 === currentStep) {
                step.classList.add("active");
            } else {
                step.classList.remove("active");
            }
        });

        // Update Indicators
        INDICATORS.forEach((indicator, index) => {
            if (index + 1 <= currentStep) {
                indicator.classList.add("active");
            } else {
                indicator.classList.remove("active");
            }
        });

        // Button Visibility
        // Back Button
        if (currentStep === 1) {
            BACK_BTN.style.display = "none";
        } else {
            BACK_BTN.style.display = "inline-block";
        }

        // Next/Submit Button
        if (currentStep === totalSteps) {
            NEXT_BTN.style.display = "none";
            SUBMIT_BTN.style.display = "inline-block";
        } else {
            NEXT_BTN.style.display = "inline-block";
            SUBMIT_BTN.style.display = "none";
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Simple Validation
    function validateStep(step) {
        const currentStepEl = document.getElementById(`step-${step}`);
        if (!currentStepEl) return true;

        const requiredInputs = currentStepEl.querySelectorAll("input[required], textarea[required], select[required]");

        let isValid = true;
        let firstErrorInput = null;

        requiredInputs.forEach(input => {
            // Check if filled
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add("error-border");
                if (!firstErrorInput) firstErrorInput = input;

                // Remove error on input
                input.addEventListener('input', function () {
                    this.classList.remove("error-border");
                }, { once: true });
            } else {
                input.classList.remove("error-border");
            }

            // Optional: Basic Email/Tel format check if needed
        });

        if (!isValid) {
            alert("Please fill in all required fields.");
            if (firstErrorInput) {
                firstErrorInput.focus();
                firstErrorInput.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }

        return isValid;
    }

    // Next Button Click
    NEXT_BTN.addEventListener("click", () => {
        console.log("Next Clicked. Current:", currentStep);
        if (validateStep(currentStep)) {
            if (currentStep < totalSteps) {
                currentStep++;
                updateStepUI();
            }
        }
    });

    // Back Button Click
    BACK_BTN.addEventListener("click", () => {
        if (currentStep > 1) {
            currentStep--;
            updateStepUI();
        }
    });

    // --- reCAPTCHA Helper ---
    async function getRecaptchaToken(action = 'submit_survey') {
        const SITE_KEY = '6LemHQ8sAAAAABuB7GU5VRpLw7dMFxxGE1zDkMMH'; // Same as registration
        try {
            if (!window.grecaptcha || typeof window.grecaptcha.execute !== 'function') {
                console.warn("reCAPTCHA validation skipped (lib not loaded)");
                return null;
            }
            const token = await grecaptcha.execute(SITE_KEY, { action });
            return token || null;
        } catch (err) {
            console.warn('reCAPTCHA error', err);
            return null;
        }
    }

    // --- Submit Logic ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        console.log("Form Submitting...");

        // Ensure Supabase is ready for file uploads (if needed)
        if (!supabaseClient) {
            console.warn("Supabase client not ready for uploads, but proceeding with submission check.");
        }

        // Loading State
        const originalBtnText = SUBMIT_BTN.innerHTML;
        SUBMIT_BTN.disabled = true;
        SUBMIT_BTN.classList.add("submitting");
        SUBMIT_BTN.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;

        try {
            const formData = new FormData(form);

            // Trustees
            const trusteeNames = formData.getAll("trustee_name[]");
            const trusteeMobiles = formData.getAll("trustee_mobile[]");
            const trustees = trusteeNames.map((name, i) => ({
                name,
                mobile: trusteeMobiles[i]
            })).filter(t => t.name.trim() !== "");

            // Upload photos (Still client-side)
            let mulnayakUrl = null;
            let jinalayUrl = null;

            if (supabaseClient) {
                const mulnayakFile = formData.get("mulnayak_photo");
                if (mulnayakFile && mulnayakFile.size > 0) {
                    console.log("Uploading Mulnayak...");
                    mulnayakUrl = await uploadFile(mulnayakFile, "mulnayak");
                }

                const jinalayFile = formData.get("jinalay_photo");
                if (jinalayFile && jinalayFile.size > 0) {
                    console.log("Uploading Jinalay...");
                    jinalayUrl = await uploadFile(jinalayFile, "jinalay");
                }
            }

            // Get reCAPTCHA Token
            const token = await getRecaptchaToken('submit_survey');

            // Construct Payload
            const payload = {
                filler_name: formData.get("filler_name"),
                filler_mobile: formData.get("filler_mobile"),
                filler_city: formData.get("filler_city"),
                filler_taluka: formData.get("filler_taluka"),
                filler_address: formData.get("filler_address"),
                derasar_name: formData.get("derasar_name"),
                location_name: formData.get("location_name"),
                full_address: formData.get("full_address"),
                state: formData.get("state"),
                district: formData.get("district"),
                taluka: formData.get("taluka"),
                gmaps_link: formData.get("gmaps_link"),
                trustees,
                pedhi_manager_name: formData.get("pedhi_manager_name"),
                pedhi_manager_mobile: formData.get("pedhi_manager_mobile"),
                poojari_name: formData.get("poojari_name"),
                poojari_mobile: formData.get("poojari_mobile"),
                mulnayak_name: formData.get("mulnayak_name"),
                mulnayak_photo_url: mulnayakUrl,
                jinalay_photo_url: jinalayUrl,
                recaptchaToken: token
            };

            // Call Netlify Function
            const response = await fetch('/.netlify/functions/submitSurvey', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Server submission failed");
            }

            // Success
            console.log("Success!");
            const successModal = document.getElementById("success-modal");
            if (successModal) successModal.classList.add("active");

            // Update user name in modal
            const fillerName = formData.get("filler_name");
            const namePlaceholder = document.getElementById("user-name-placeholder");
            if (namePlaceholder) namePlaceholder.innerText = fillerName;

            // WhatsApp Share Logic
            const shareBtn = document.getElementById("share-btn");
            if (shareBtn) {
                shareBtn.onclick = () => {
                    const shareText = `*LVJST Pre-Survey Successful* ✅\n\nSurvey filled by: *${fillerName}*\nDerasar: *${formData.get("derasar_name")}*\nLocation: *${formData.get("location_name")}*\n\nThank you for your contribution to preserving our heritage! 🙏`;
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
                    window.open(whatsappUrl, '_blank');
                };
            }

            form.reset();
            currentStep = 1;
            updateStepUI();

        } catch (error) {
            console.error("Submission Error:", error);
            alert("Error submitting form: " + error.message);
        } finally {
            SUBMIT_BTN.disabled = false;
            SUBMIT_BTN.classList.remove("submitting");
            SUBMIT_BTN.innerHTML = originalBtnText;
        }
    });

    // Close Modal on Outside Click
    const successModal = document.getElementById("success-modal");
    if (successModal) {
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                successModal.classList.remove("active");
            }
        });
    }

    // Initial UI Update
    updateStepUI();

});

