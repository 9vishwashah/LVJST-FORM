
// Wrap all DOM init inside DOMContentLoaded for safety
document.addEventListener('DOMContentLoaded', () => {

  // -------------------------
  // Contact list (safe)
  // -------------------------
  const contacts = [
    { name: 'LVJST', phone: '8655449611', email: '', title: 'LVJST' },
    { name: 'LVJST', phone: '8655449612', email: '', title: 'LVJST' },
    { name: 'LVJST', phone: '8655449613', email: '', title: 'LVJST' }
  ];

  const contactList = document.getElementById('contact-list');
  if (contactList) {
    contacts.forEach((contact, index) => {
      const contactDiv = document.createElement('div');
      contactDiv.className = 'w-full py-3 px-6 rounded-full bg-green-500 text-white font-semibold shadow-lg hover:bg-green-600 transition-colors duration-200 cursor-pointer flex items-center gap-3 justify-center';
      contactDiv.setAttribute('data-contact-index', index);

      const icon = document.createElement('i');
      icon.className = 'fa-solid fa-user w-5 h-5';

      const span = document.createElement('span');
      span.textContent = `${contact.name}`;

      contactDiv.appendChild(icon);
      contactDiv.appendChild(span);
      contactList.appendChild(contactDiv);
    });

    contactList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-contact-index]');
      if (!button) return;

      const idx = Number(button.getAttribute('data-contact-index'));
      const contact = contacts[idx];
      if (!contact) return;

      const vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${contact.name}`,
        `TITLE:${contact.title}`,
        `TEL:${contact.phone}`,
        `EMAIL:${contact.email}`,
        'END:VCARD'
      ].join('\n');

      const blob = new Blob([vcard], { type: 'text/vcard' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${contact.name.replace(/\s/g, '_')}_contact.vcf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  } else {
    console.warn('#contact-list not found — skipping contact list population.');
  }

  // -------------------------
  // Brochure button tweak for iPhone — guarded
  // -------------------------
  const brochureBtn = document.querySelector('.brochure-button');
  if (brochureBtn) {
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // remove download attribute if present, ensure opens in new tab
      try {
        brochureBtn.removeAttribute('download');
        brochureBtn.setAttribute('target', '_blank');
      } catch (err) {
        console.warn('Error adjusting brochure button for iOS:', err);
      }
    }
  } else {
    console.warn('.brochure-button not found — skipping iOS tweak.');
  }

  // -------------------------
  // Main event countdown (guarded)
  // -------------------------
  (function initMainCountdown() {
    const countdownEl = document.getElementById('countdown');
    if (!countdownEl) {
      console.warn('#countdown element not found — main countdown skipped.');
      return;
    }

    const eventDate = new Date('2025-12-19T00:00:00').getTime();

    const update = () => {
      const now = Date.now();
      const distance = eventDate - now;

      if (distance < 0) {
        countdownEl.innerHTML = "<span class='event-live'>🌸 The festival has begun! 🌸</span>";
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      countdownEl.innerHTML = `
        <span data-label="days">${days}</span>
        <span data-label="hours">${hours}</span>
        <span data-label="mins">${minutes}</span>
        <span data-label="secs">${seconds}</span>
      `;
    };

    update();
    // Save interval ID in case you want to clear it later from console
    window._rushabhayan_main_countdown_interval = setInterval(update, 1000);
  })();

  // -------------------------
  // LVJST trip countdown (guarded)
  // -------------------------
  (function initTripCountdown() {
    const tripCountdown = document.getElementById('trip-days');
    if (!tripCountdown) {
      console.warn('#trip-days element not found — LVJST trip countdown skipped.');
      return;
    }

    const tripDate = new Date('2025-11-08T00:00:00').getTime();

    const updateTrip = () => {
      const now = Date.now();
      const diff = tripDate - now;

      if (diff < 0) {
        if (tripCountdown.parentElement) {
          tripCountdown.parentElement.innerHTML = '🙏 Trip Completed';
        } else {
          tripCountdown.innerText = '🙏 Trip Completed';
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      tripCountdown.textContent = days;
    };

    updateTrip();
    window._rushabhayan_trip_countdown_interval = setInterval(updateTrip, 1000);
  })();

  // -------------------------
  // Multilingual title/flag rotation (guarded)
  // -------------------------
  (function initLanguageRotation() {
    const translations = [
      { lang: "en", title: "Rushabhayan 2.0", desc: "The Pioneer of Indic Civilization", flag: "in" },
      { lang: "fr", title: "Rishabhayan 2.0", desc: "Le pionnier de la civilisation indienne", flag: "fr" },
      { lang: "zh", title: "里沙巴彦 2.0", desc: "印度文明的先驱", flag: "cn" },
      { lang: "hi", title: "ऋषभायन २.०", desc: "भारतीय सभ्यता के प्रवर्तक की विरासत", flag: "in" },
      { lang: "ru", title: "Ришабхаян 2.0", desc: "Первопроходец индийской цивилизации", flag: "ru" },
      { lang: "gu", title: "ઋષભાયન ૨.૦", desc: "ભારતીય સંસ્કૃતિના પુરોધા", flag: "in" },
      { lang: "bn", title: "ঋষভায়ন ২.০", desc: "ভারতীয় সভ্যতার অগ্রদূত", flag: "in" },
      { lang: "ar", title: "رشابهان 2.0", desc: "رائد الحضارة الهندية", flag: "sa" },
      { lang: "te", title: "ఋషభాయన ౨.౦", desc: "భారత నాగరికత యొక్క పూర్వగామి", flag: "in" },
      { lang: "ko", title: "리샤바얀 2.0", desc: "인도 문명의 선구자", flag: "kr" },
      { lang: "mr", title: "ऋषभायन २.०", desc: "भारतीय सभ्यतेचे प्रवर्तक", flag: "in" },
      { lang: "pa", title: "ਰਿਸ਼ਭਾਯਨ ੨.੦", desc: "ਭਾਰਤੀ ਸਭਿਅਤਾ ਦਾ ਅਗਵਾਨ", flag: "in" },
      { lang: "it", title: "Rishabhayan 2.0", desc: "Il pioniere della civiltà indiana", flag: "it" },
      { lang: "de", title: "Rishabhayan 2.0", desc: "Der Wegbereiter der indischen Zivilisation", flag: "de" },
      { lang: "ja", title: "リシャバヤン 2.0", desc: "インド文明の先駆者", flag: "jp" },
    ];

    const nameEl = document.getElementById('org-name');
    const descEl = document.getElementById('org-description');
    const flagEl = document.getElementById('flag-img');

    if (!nameEl || !descEl || !flagEl) {
      console.warn('Language rotation skipped — one or more elements (#org-name, #org-description, #flag-img) not found.');
      return;
    }

    let index = 0;
    function rotateLanguage() {
      // add fade-out safely
      nameEl.classList.add('fade-out');
      descEl.classList.add('fade-out');
      flagEl.classList.add('fade-out');

      setTimeout(() => {
        const current = translations[index];
        nameEl.textContent = current.title;
        descEl.innerHTML = `<strong>${current.desc}</strong>`;
        // flagcdn uses two-letter codes in lowercase; ensure value safe
        flagEl.src = `https://flagcdn.com/w80/${current.flag}.png`;
        flagEl.alt = `${current.flag.toUpperCase()} Flag`;
        flagEl.loading = 'lazy';

        // fade-in animation classes
        [flagEl, nameEl, descEl].forEach(el => {
          el.classList.remove('fade-out');
          el.classList.add('fade-in');
          el.style.opacity = '1';
        });

        index = (index + 1) % translations.length;
      }, 400);
    }

    rotateLanguage();
    window._rushabhayan_lang_rotate_interval = setInterval(rotateLanguage, 3000);
  })();

  // -------------------------
  // Optional: Safe form wiring if a linktree form exists (guarded)
  // -------------------------
  (function setupLinktreeForm() {
    const linktreeForm = document.getElementById('linktree-form');
    if (!linktreeForm) {
      // Not present on every page; that's fine
      return;
    }

    const submitBtn = document.getElementById('submit-button');
    const formStatus = document.getElementById('form-status');

    linktreeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (submitBtn) submitBtn.disabled = true;
      if (formStatus) {
        formStatus.textContent = 'Submitting...';
        formStatus.classList.remove('text-green-500', 'text-red-500');
        formStatus.classList.add('text-blue-500');
      }

      try {
        const formData = new FormData(linktreeForm);
        const payload = Object.fromEntries(formData.entries());

        // If you have supabase table insertion, you can do it here
        if (supabaseClient) {
          // Example: await supabaseClient.from('linktree').insert([payload])
          // (uncomment and adapt when your table exists)
        }

        if (formStatus) {
          formStatus.textContent = 'Submitted successfully!';
          formStatus.classList.remove('text-blue-500');
          formStatus.classList.add('text-green-500');
        }
        linktreeForm.reset();
      } catch (err) {
        console.error('Form submit error:', err);
        if (formStatus) {
          formStatus.textContent = 'Submission failed. Try again.';
          formStatus.classList.remove('text-blue-500');
          formStatus.classList.add('text-red-500');
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  })();

}); // end DOMContentLoaded
