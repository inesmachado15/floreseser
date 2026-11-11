(function () {
  const C = window.SITE_CONFIG || {};

  // ---- Aplicar configuração (email, telefone, morada) ----
  document.querySelectorAll('[data-cfg="email"]').forEach(a => { a.textContent = C.email; a.href = 'mailto:' + C.email; });
  document.querySelectorAll('[data-cfg="phone"]').forEach(a => { a.textContent = C.phoneDisplay; a.href = 'tel:+' + C.phoneIntl; });
  document.querySelectorAll('[data-cfg="address"]').forEach(p => { p.innerHTML = C.address; });
  const wa = document.getElementById('whatsapp');
  if (wa) wa.href = 'https://wa.me/' + C.phoneIntl + '?text=' + encodeURIComponent('Olá! Gostaria de pedir um orçamento.');
  document.getElementById('year').textContent = new Date().getFullYear();

  // ---- Menu telemóvel ----
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open);
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  }

  // ---- Cabeçalho ao fazer scroll ----
  const topbar = document.querySelector('.topbar');
  const onScroll = () => topbar.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // ---- Slideshow do topo ----
  const slides = document.querySelectorAll('.hero-slide');
  let s = 0;
  if (slides.length > 1) setInterval(() => { slides[s].classList.remove('active'); s = (s + 1) % slides.length; slides[s].classList.add('active'); }, 6000);

  // ---- Animação ao aparecer + contadores ----
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      e.target.querySelectorAll('[data-count]').forEach(el => {
        const end = +el.dataset.count; let n = 0; const step = Math.max(1, Math.round(end / 40));
        const t = setInterval(() => { n = Math.min(end, n + step); el.textContent = '+' + n; if (n >= end) clearInterval(t); }, 30);
      });
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.services:not(.rail) .service, .about-grid, .g, .steps li, .steps.grow-h, .quote-grid, .reveal-me').forEach(el => { el.classList.add('reveal'); io.observe(el); });

  // ---- Faixas para arrastar (serviços) ----
  document.querySelectorAll('.rail').forEach(rail => {
    rail.querySelectorAll('img').forEach(i => { i.draggable = false; });
    let down = false, x0 = 0, s0 = 0, moved = false;
    rail.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; x0 = e.clientX; s0 = rail.scrollLeft;
    });
    window.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - x0;
      if (!moved && Math.abs(dx) > 5) { moved = true; rail.classList.add('drag'); }
      if (moved) rail.scrollLeft = s0 - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return; down = false;
      if (moved) {
        // larga no cartão mais próximo
        const w = rail.querySelector(':scope > *').getBoundingClientRect().width + 20;
        const target = Math.round(rail.scrollLeft / w) * w;
        rail.classList.remove('drag');
        rail.scrollTo({ left: target, behavior: 'smooth' });
      }
    });
    // um clique depois de arrastar não abre o link
    rail.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

    const arrows = document.querySelector(`[data-rail="${rail.id}"]`);
    if (arrows) {
      const [prev, next] = arrows.querySelectorAll('button');
      const step = () => rail.querySelector(':scope > *').getBoundingClientRect().width + 20;
      prev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
      next.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
      const upd = () => {
        prev.disabled = rail.scrollLeft < 5;
        next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 5;
      };
      rail.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); upd();
    }
    rail.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') rail.scrollBy({ left: 300, behavior: 'smooth' });
      if (e.key === 'ArrowLeft') rail.scrollBy({ left: -300, behavior: 'smooth' });
    });
  });

  // ---- Galeria / lightbox ----
  const items = [...document.querySelectorAll('#gallery .g img')];
  const lb = document.getElementById('lightbox');
  if (lb && items.length) {
  const lbImg = lb.querySelector('img');
  let idx = 0;
  const show = i => { idx = (i + items.length) % items.length; lbImg.src = items[idx].src.replace(/w=\d+/, 'w=1800'); lbImg.alt = items[idx].alt; };
  items.forEach((img, i) => img.parentElement.addEventListener('click', () => { show(i); lb.hidden = false; document.body.style.overflow = 'hidden'; }));
  const close = () => { lb.hidden = true; document.body.style.overflow = ''; };
  lb.querySelector('.lb-close').onclick = close;
  lb.querySelector('.lb-prev').onclick = () => show(idx - 1);
  lb.querySelector('.lb-next').onclick = () => show(idx + 1);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
  }

  // ---- "Pedir orçamento" num serviço pré-seleciona esse serviço ----
  document.querySelectorAll('[data-servico]').forEach(a => a.addEventListener('click', () => {
    const cb = document.querySelector(`input[name="servicos"][value="${a.dataset.servico}"]`);
    if (cb) cb.checked = true;
  }));

  // ---- Formulário de orçamento → email ----
  const form = document.getElementById('quoteForm');
  if (!form) return; // páginas sem formulário
  // Vindo de outra página com ?servico=... marca esse serviço
  try {
    const pre = new URLSearchParams(location.search).get('servico');
    if (pre) { const cb = form.querySelector(`input[name="servicos"][value="${pre.replace(/"/g, '')}"]`); if (cb) cb.checked = true; }
  } catch (e) {}
  const status = document.getElementById('formStatus');
  const btn = document.getElementById('submitBtn');

  function validate() {
    let ok = true;
    form.querySelectorAll('.field input[required]').forEach(inp => {
      const bad = !inp.checkValidity() || !inp.value.trim();
      inp.closest('.field').classList.toggle('invalid', bad);
      if (bad) ok = false;
    });
    const anyService = form.querySelectorAll('input[name="servicos"]:checked').length > 0;
    form.querySelector('[data-for="servicos"]').classList.toggle('show', !anyService);
    const consent = form.consentimento.checked;
    form.querySelector('[data-for="consentimento"]').classList.toggle('show', !consent);
    if (!anyService || !consent) ok = false;
    return ok;
  }
  form.addEventListener('input', e => { if (e.target.closest('.field')) e.target.closest('.field').classList.remove('invalid'); });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form._honey.value) return; // anti-spam
    if (!validate()) { const first = form.querySelector('.invalid input, .err.show'); first && first.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }

    const fd = new FormData(form);
    const servicos = fd.getAll('servicos').join(', ');
    const data = {
      _subject: `Novo pedido de orçamento: ${fd.get('nome')} (${fd.get('localidade')})`,
      _template: 'table',
      _captcha: 'false',
      _replyto: fd.get('email'),
      _autoresponse: 'Obrigado pelo seu pedido! Recebemos a sua mensagem e a equipa FloresESer responde em até 24 horas úteis.',
      'Nome': fd.get('nome'),
      'Email': fd.get('email'),
      'Telefone': fd.get('telefone'),
      'Localidade': fd.get('localidade'),
      'Serviços pedidos': servicos,
      'Tipo de espaço': fd.get('tipo_espaco'),
      'Frequência': fd.get('frequencia'),
      'Área aproximada (m²)': fd.get('area') || '—',
      'Mensagem': fd.get('mensagem') || '—',
    };

    btn.disabled = true; btn.textContent = 'A enviar…';
    status.className = 'form-status';
    try {
      const res = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(C.email), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === 'false' || json.success === false) throw new Error(json.message || 'Erro');
      form.reset();
      status.className = 'form-status ok';
      status.innerHTML = '<strong>Pedido enviado!</strong> Obrigado, vamos responder por email em até 24 horas úteis.';
    } catch (err) {
      // Alternativa: abrir o programa de email com o pedido já escrito
      const body = Object.entries(data).filter(([k]) => !k.startsWith('_')).map(([k, v]) => `${k}: ${v}`).join('\n');
      const mailto = `mailto:${C.email}?subject=${encodeURIComponent(data._subject)}&body=${encodeURIComponent(body)}`;
      status.className = 'form-status fail';
      status.innerHTML = `Não foi possível enviar automaticamente. <a href="${mailto}">Clique aqui para enviar por email</a> ou ligue-nos para ${C.phoneDisplay}.`;
    } finally {
      btn.disabled = false; btn.textContent = 'Enviar pedido de orçamento';
    }
  });
})();
