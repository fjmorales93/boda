/* ============================================================
   Pau & Fran — interacciones
   ============================================================ */
(function () {
  'use strict';

  /* ---- Config editable ------------------------------------ */
  const WEDDING_DATE = new Date('2027-04-24T12:30:00+02:00');
  // Sustituye por la URL real de vuestro Google Form
  const GOOGLE_FORM_URL = 'https://forms.gle/REEMPLAZA-CON-TU-FORMULARIO';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---- Nav: estado scroll + menú móvil -------------------- */
  const nav = $('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = $('.nav__burger');
  if (burger) {
    burger.addEventListener('click', () =>
      document.body.classList.toggle('menu-open'));
  }
  $$('.nav__links a').forEach((a) =>
    a.addEventListener('click', () => document.body.classList.remove('menu-open')));

  /* ---- Cuenta atrás --------------------------------------- */
  const cd = $('#countdown');
  if (cd) {
    const cells = {
      d: $('[data-cd="d"]'), h: $('[data-cd="h"]'),
      m: $('[data-cd="m"]'), s: $('[data-cd="s"]'),
    };
    const pad = (n) => String(n).padStart(2, '0');
    const tick = () => {
      let diff = Math.max(0, WEDDING_DATE - new Date());
      const d = Math.floor(diff / 864e5); diff -= d * 864e5;
      const h = Math.floor(diff / 36e5); diff -= h * 36e5;
      const m = Math.floor(diff / 6e4); diff -= m * 6e4;
      const s = Math.floor(diff / 1e3);
      if (cells.d) cells.d.textContent = d;
      if (cells.h) cells.h.textContent = pad(h);
      if (cells.m) cells.m.textContent = pad(m);
      if (cells.s) cells.s.textContent = pad(s);
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---- Reveal on scroll ----------------------------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach((el) => io.observe(el));

  /* ---- Galería: lightbox ---------------------------------- */
  const lb = $('#lightbox');
  if (lb) {
    const lbInner = $('.lightbox__inner', lb);
    $$('.gallery__grid .ph').forEach((cell) => {
      cell.addEventListener('click', () => {
        lbInner.setAttribute('data-label', cell.getAttribute('data-label') || 'Foto');
        lb.classList.add('show');
      });
    });
    lb.addEventListener('click', () => lb.classList.remove('show'));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') lb.classList.remove('show');
    });
  }

  /* ---- Regalos: copiar IBAN ------------------------------- */
  const copyBtn = $('#copyIban');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const iban = $('#ibanValue').textContent.replace(/\s+/g, ' ').trim();
      try { await navigator.clipboard.writeText(iban); }
      catch (_) {
        const t = document.createElement('textarea');
        t.value = iban; document.body.appendChild(t); t.select();
        document.execCommand('copy'); t.remove();
      }
      const original = copyBtn.textContent;
      copyBtn.textContent = 'Copiado ✓';
      copyBtn.classList.add('done');
      setTimeout(() => { copyBtn.textContent = original; copyBtn.classList.remove('done'); }, 1800);
    });
  }

  /* ============================================================
     RSVP — formulario interactivo
     ============================================================ */
  const form = $('#rsvpForm');
  if (!form) return;

  const altLink = $('#gformLink');
  if (altLink) altLink.href = GOOGLE_FORM_URL;

  // Asiste sí / no
  let attending = null;
  const attendBtns = $$('[data-attend]');
  const bodyAttend = $('#rsvpBody');
  const declineMsg = $('#declineMsg');
  attendBtns.forEach((b) => {
    b.addEventListener('click', () => {
      attending = b.dataset.attend === 'yes';
      attendBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      bodyAttend.style.display = attending ? '' : 'none';
      declineMsg.classList.toggle('show', !attending);
      hideError();
    });
  });

  // Stepper acompañantes -> filas dinámicas
  const guestsWrap = $('#guests');
  const countEl = $('#guestCount');
  let guestCount = 0;
  const MENU_OPTS = ['Normal', 'Vegetariano', 'Vegano', 'Sin gluten', 'Infantil'];

  function renderGuests() {
    countEl.textContent = guestCount;
    const have = $$('.guest-row', guestsWrap).length;
    if (guestCount > have) {
      for (let i = have; i < guestCount; i++) {
        const row = document.createElement('div');
        row.className = 'guest-row';
        row.innerHTML = `
          <div>
            <span class="gi">Nombre del acompañante ${i + 1}</span>
            <input class="input" type="text" name="acompanante_${i + 1}" placeholder="Nombre y apellidos" autocomplete="off">
          </div>
          <div>
            <span class="gi">Menú</span>
            <select class="select" name="menu_acomp_${i + 1}">
              ${MENU_OPTS.map((o) => `<option>${o}</option>`).join('')}
            </select>
          </div>`;
        guestsWrap.appendChild(row);
      }
    } else {
      while ($$('.guest-row', guestsWrap).length > guestCount) {
        guestsWrap.lastElementChild.remove();
      }
    }
  }
  $('#guestMinus').addEventListener('click', () => {
    if (guestCount > 0) { guestCount--; renderGuests(); }
  });
  $('#guestPlus').addEventListener('click', () => {
    if (guestCount < 8) { guestCount++; renderGuests(); }
  });

  // ¿Necesita autobús? -> parada condicional
  let needsBus = null;
  const busBtns = $$('[data-bus]');
  const busStop = $('#busStop');
  busBtns.forEach((b) => {
    b.addEventListener('click', () => {
      needsBus = b.dataset.bus === 'yes';
      busBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      busStop.classList.toggle('show', needsBus);
    });
  });

  // Validación + envío
  const errEl = $('#formError');
  function showError(msg) { errEl.textContent = msg; errEl.classList.add('show'); }
  function hideError() { errEl.classList.remove('show'); }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    hideError();
    const name = $('#fName').value.trim();
    const contact = $('#fContact').value.trim();

    if (attending === null) return showError('Indícanos si podrás asistir, por favor.');
    if (!name) return showError('No olvides escribir tu nombre.');
    if (attending) {
      if (!contact) return showError('Déjanos un teléfono o email de contacto.');
      if (needsBus === null) return showError('¿Necesitarás el autobús? Indícanoslo, por favor.');
    }

    // Mostrar confirmación
    const thanks = $('#rsvpThanks');
    const thanksName = $('#thanksName');
    const thanksMsg = $('#thanksMsg');
    thanksName.textContent = name.split(' ')[0];
    thanksMsg.textContent = attending
      ? '¡Qué ganas de celebrarlo contigo! Hemos guardado tu confirmación. Si algo cambia, vuelve a escribirnos por aquí.'
      : 'Te echaremos de menos ese día. Gracias por avisarnos con cariño.';
    form.style.display = 'none';
    thanks.classList.add('show');
    window.scrollTo({ top: thanks.getBoundingClientRect().top + window.scrollY - 110, behavior: 'smooth' });
  });

  // Reset (volver a editar)
  const editAgain = $('#editAgain');
  if (editAgain) {
    editAgain.addEventListener('click', () => {
      $('#rsvpThanks').classList.remove('show');
      form.style.display = '';
    });
  }
})();
