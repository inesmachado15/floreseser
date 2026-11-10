(function () {
  'use strict';
  const C = window.SITE_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Configuração (email, telefone, morada) ----------
  $$('[data-cfg="email"]').forEach(a => { a.textContent = C.email; a.href = 'mailto:' + C.email; });
  $$('[data-cfg="phone"]').forEach(a => { a.textContent = C.phoneDisplay; a.href = 'tel:+' + C.phoneIntl; });
  $$('[data-cfg="address"]').forEach(p => { p.innerHTML = C.address; });
  const waLink = 'https://wa.me/' + C.phoneIntl + '?text=' + encodeURIComponent('Olá! Gostaria de pedir um orçamento.');
  $$('#whatsapp, [data-wa]').forEach(a => { a.href = waLink; a.target = '_blank'; a.rel = 'noopener'; });
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  // ---------- Menu e cabeçalho ----------
  const menuBtn = $('#menuBtn'), nav = $('#nav'), topbar = $('.topbar');
  menuBtn.addEventListener('click', () => menuBtn.setAttribute('aria-expanded', nav.classList.toggle('open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  const onScroll = () => topbar.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // ---------- Cesto de serviços (partilhado entre secções) ----------
  const basket = new Set();
  const basketListeners = [];
  function setService(name, on) {
    on ? basket.add(name) : basket.delete(name);
    basketListeners.forEach(fn => fn());
  }
  basketListeners.push(() => {
    const n = basket.size;
    $$('[data-basket-count]').forEach(el => { el.textContent = n; el.hidden = n === 0; });
    $$('[data-basket-text]').forEach(el => { el.textContent = n ? [...basket].join(', ') : 'nenhum serviço'; });
    $$('#wizard input[name="servicos"]').forEach(cb => { cb.checked = basket.has(cb.value); });
  });

  // =========================================================
  // 1. ESTAÇÕES
  // =========================================================
  const SEASONS = {
    primavera: { name: 'na primavera', title: 'Na primavera: preparar o jardim para crescer',
      items: ['Plantações de flores, arbustos e hortas', 'Adubação e arejamento do relvado', 'Revisão e arranque da rega automática'],
      services: ['Plantações e hortas', 'Manutenção de jardins', 'Sistemas de rega'], flowers: ['#f28cb1', '#ffd36b', '#ffffff', '#c792ea'], count: 46, particle: 'petal' },
    verao: { name: 'no verão', title: 'No verão: piscina perfeita e relva verde',
      items: ['Manutenção semanal da piscina e da água', 'Corte de relva frequente', 'Rega afinada para poupar água'],
      services: ['Manutenção de piscinas', 'Manutenção de jardins', 'Sistemas de rega'], flowers: ['#e8553e', '#ffb03b', '#ffe36b'], count: 34, particle: 'sun' },
    outono: { name: 'no outono', title: 'No outono: limpar e podar',
      items: ['Recolha de folhas e limpeza de canteiros', 'Poda de árvores e sebes', 'Limpeza de terrenos antes das chuvas'],
      services: ['Poda de árvores', 'Limpeza de terrenos', 'Manutenção de jardins'], flowers: ['#e0892e', '#c8693f'], count: 14, particle: 'leaf' },
    inverno: { name: 'no inverno', title: 'No inverno: proteger e planear',
      items: ['Fecho e proteção da piscina', 'Proteção das plantas mais sensíveis ao frio', 'Planear o jardim novo para a primavera'],
      services: ['Manutenção de piscinas', 'Construção de jardins', 'Construção de piscinas'], flowers: ['#ffffff'], count: 6, particle: 'rain' },
  };
  const sx = $('#estacoes');
  const flowersG = $('#flowers');
  let current = 'outono';

  function drawFlowers(cfg) {
    const NS = 'http://www.w3.org/2000/svg';
    flowersG.innerHTML = '';
    for (let i = 0; i < cfg.count; i++) {
      const x = 20 + Math.random() * 1400, y = 700 + Math.random() * 90;
      if (x > 740 && x < 1200 && y > 700) continue; // não pôr flores dentro da piscina
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'flower');
      g.style.animationDelay = (Math.random() * 0.8).toFixed(2) + 's';
      const h = 10 + Math.random() * 14;
      g.innerHTML = `<path d="M${x} ${y} v-${h}" stroke="#4d7a3c" stroke-width="2"/>` +
        `<circle cx="${x}" cy="${y - h}" r="${4 + Math.random() * 3}" fill="${cfg.flowers[i % cfg.flowers.length]}"/>`;
      flowersG.appendChild(g);
    }
  }

  function setSeason(key, user) {
    current = key;
    const cfg = SEASONS[key];
    sx.dataset.season = key;
    $$('.sx-tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.s === key));
    $('.sx-name').textContent = cfg.name;
    $('.sx-card-title').textContent = cfg.title;
    $('.sx-card-list').innerHTML = cfg.items.map(t => `<li>${t}</li>`).join('');
    drawFlowers(cfg);
    particles.mode = cfg.particle;
    if (user) try { localStorage.setItem('fs-season', key); } catch (e) {}
  }
  $$('.sx-tabs button').forEach(b => b.addEventListener('click', () => setSeason(b.dataset.s, true)));
  $('#seasonPlan').addEventListener('click', () => {
    SEASONS[current].services.forEach(s => setService(s, true));
    $('#orcamento').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });

  // Partículas: pétalas, folhas, chuva, brilhos de sol
  const particles = (() => {
    const cv = $('.sx-particles'), ctx = cv.getContext('2d');
    let W, H, list = [], mode = 'leaf', visible = true;
    const resize = () => { const d = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    addEventListener('resize', resize); resize();
    const make = () => ({ x: Math.random() * W, y: -20 - Math.random() * H, s: 4 + Math.random() * 6, v: .4 + Math.random() * .9, a: Math.random() * 6.28, w: .01 + Math.random() * .02 });
    for (let i = 0; i < 40; i++) list.push(make());
    const colors = { petal: ['#f7b6cf', '#fde2ec'], leaf: ['#d0702e', '#e3a23c', '#b4541f'], rain: ['rgba(255,255,255,.55)'], sun: ['rgba(255,236,170,.7)'] };
    function frame() {
      if (visible) {
        ctx.clearRect(0, 0, W, H);
        const col = colors[mode];
        list.forEach((p, i) => {
          if (mode === 'rain') { p.y += p.v * 9; p.x -= 1.2; }
          else if (mode === 'sun') { p.y -= p.v * .35; p.x += Math.sin(p.a += p.w) * .3; }
          else { p.y += p.v; p.x += Math.sin(p.a += p.w) * 1.1; }
          if (p.y > H + 20 || p.x < -20 || p.x > W + 20 || (mode === 'sun' && p.y < -20)) { list[i] = make(); if (mode === 'sun') list[i].y = H * (.3 + Math.random() * .7); }
          ctx.fillStyle = col[i % col.length];
          ctx.save(); ctx.translate(p.x, p.y);
          if (mode === 'rain') { ctx.fillRect(0, 0, 1.4, 14); }
          else if (mode === 'sun') { ctx.globalAlpha = .5 + Math.sin(p.a * 3) * .4; ctx.beginPath(); ctx.arc(0, 0, p.s * .35, 0, 6.28); ctx.fill(); }
          else { ctx.rotate(p.a); ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * .5, 0, 0, 6.28); ctx.fill(); }
          ctx.restore();
        });
      }
      requestAnimationFrame(frame);
    }
    if (!reduce) requestAnimationFrame(frame);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(cv);
    return { set mode(m) { mode = m; } };
  })();

  let start = ['inverno', 'inverno', 'primavera', 'primavera', 'primavera', 'verao', 'verao', 'verao', 'outono', 'outono', 'outono', 'inverno'][new Date().getMonth()];
  try { start = localStorage.getItem('fs-season') || start; } catch (e) {}
  setSeason(start);

  // =========================================================
  // 2. EXPLORAR O JARDIM (pontos na fotografia)
  // =========================================================
  const ZONES = {
    piscina: { zone: 'Piscina', title: 'Manutenção de piscinas', service: 'Manutenção de piscinas',
      text: 'Água limpa e equilibrada durante todo o ano, sem ter de se preocupar.',
      list: ['Limpeza e aspiração', 'Controlo do pH e do cloro', 'Verificação de bombas e filtros', 'Abertura e fecho de época'] },
    relva: { zone: 'Relvado', title: 'Manutenção de jardins', service: 'Manutenção de jardins',
      text: 'Relva verde e cuidada, com visitas regulares ao ritmo que escolher.',
      list: ['Corte e recorte de relva', 'Adubação e arejamento', 'Tratamento de ervas daninhas'] },
    poda: { zone: 'Árvores e palmeiras', title: 'Poda e abate de árvores', service: 'Poda de árvores',
      text: 'Árvores saudáveis e seguras, com a forma certa para o seu jardim.',
      list: ['Poda de formação e manutenção', 'Limpeza de palmeiras', 'Abate controlado e remoção'] },
    plantas: { zone: 'Plantas e vasos', title: 'Plantações e hortas', service: 'Plantações e hortas',
      text: 'Escolhemos e plantamos as espécies certas para o clima e para a exposição ao sol.',
      list: ['Árvores, arbustos e flores', 'Vasos e floreiras', 'Hortas e aromáticas'] },
    rega: { zone: 'Floreiras e canteiros', title: 'Sistemas de rega', service: 'Sistemas de rega',
      text: 'Rega automática que poupa água e tempo, mesmo quando está fora.',
      list: ['Gota-a-gota e aspersão', 'Programadores automáticos', 'Reparação de fugas'] },
    construcao: { zone: 'Pavimentos e zonas de estar', title: 'Construção e paisagismo', service: 'Construção de jardins',
      text: 'Projetamos e construímos o jardim de raiz, ou renovamos o que já existe.',
      list: ['Projeto de paisagismo', 'Caminhos, muros e pavimentos', 'Iluminação exterior'] },
  };
  let zoneKey = null;
  const addBtn = $('.ex-add');
  function showZone(k) {
    zoneKey = k;
    const z = ZONES[k];
    $$('.hs').forEach(h => h.classList.toggle('on', h.dataset.k === k));
    $('.ex-empty').hidden = true;
    const info = $('.ex-info'); info.hidden = false;
    info.style.animation = 'none'; void info.offsetWidth; info.style.animation = '';
    $('.ex-zone').textContent = z.zone;
    $('.ex-title').textContent = z.title;
    $('.ex-text').textContent = z.text;
    $('.ex-list').innerHTML = z.list.map(t => `<li>${t}</li>`).join('');
    refreshAdd();
  }
  function refreshAdd() {
    if (zoneKey) {
      const on = basket.has(ZONES[zoneKey].service);
      addBtn.classList.toggle('added', on);
      addBtn.textContent = on ? '✓ No orçamento (remover)' : '+ Adicionar ao orçamento';
    }
    $$('.hs').forEach(h => h.classList.toggle('added', basket.has(ZONES[h.dataset.k].service)));
  }
  basketListeners.push(refreshAdd);
  $$('.hs').forEach(h => h.addEventListener('click', () => showZone(h.dataset.k)));
  addBtn.addEventListener('click', () => { const s = ZONES[zoneKey].service; setService(s, !basket.has(s)); });

  // =========================================================
  // 3. NÚMEROS, CAULE, ANTES/DEPOIS, GALERIA
  // =========================================================
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    $$('[data-count]', e.target).forEach(el => {
      const end = +el.dataset.count, suf = el.dataset.suffix || '', pre = suf ? '' : '+';
      if (reduce) { el.textContent = pre + end + suf; return; }
      let n = 0; const step = Math.max(1, Math.round(end / 40));
      const t = setInterval(() => { n = Math.min(end, n + step); el.textContent = pre + n + suf; if (n >= end) clearInterval(t); }, 30);
    });
    io.unobserve(e.target);
  }), { threshold: .3 });
  io.observe($('.nums'));

  const track = $('.grow-track'), steps = $$('.gstep');
  function grow() {
    const r = track.getBoundingClientRect(), vh = innerHeight;
    const p = Math.max(0, Math.min(1, (vh * .7 - r.top) / r.height));
    track.style.setProperty('--grow', (p * 100).toFixed(1) + '%');
    steps.forEach(s => { const sr = s.getBoundingClientRect(); s.classList.toggle('lit', sr.top < vh * .72); });
  }
  addEventListener('scroll', grow, { passive: true }); addEventListener('resize', grow); grow();

  const ba = $('#ba');
  if (ba) { const r = $('input', ba); const set = () => ba.style.setProperty('--pos', r.value + '%'); r.addEventListener('input', set); set(); }

  const rail = $('#rail');
  let down = false, sx0 = 0, sl0 = 0, moved = false;
  rail.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx0 = e.clientX; sl0 = rail.scrollLeft; rail.classList.add('drag'); });
  addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx0; if (Math.abs(dx) > 3) moved = true; rail.scrollLeft = sl0 - dx; });
  addEventListener('pointerup', () => { if (!down) return; down = false; rail.classList.remove('drag'); });
  $$('.gal-arrows button').forEach(b => b.addEventListener('click', () => {
    const w = rail.querySelector('figure').getBoundingClientRect().width + 16;
    rail.scrollBy({ left: w * +b.dataset.dir, behavior: 'smooth' });
  }));

  // =========================================================
  // 4. ORÇAMENTO EM 4 PASSOS → email (FormSubmit)
  // =========================================================
  const form = $('#wizard');
  const stepsEls = $$('.wz-step', form), prog = $$('.wz-progress li', form);
  const back = $('#wzBack'), next = $('#wzNext'), send = $('#wzSend'), status = $('#formStatus');
  let step = 1;

  // área: escala não linear de 20 m² a 10 000 m²
  const areaIn = $('#area'), areaOut = $('#areaOut'), areaBox = $('#areaBox'), areaHint = $('#areaHint');
  const areaVal = v => Math.round(20 * Math.pow(500, v / 100) / 10) * 10 || 20;
  const HINTS = [[60, 'um pátio ou varanda grande'], [200, 'um jardim pequeno'], [400, '≈ um campo de ténis'], [1200, 'um jardim grande'], [3500, 'um jardim muito grande'], [8000, '≈ um campo de futebol'], [Infinity, 'uma quinta ou terreno grande']];
  function updArea() {
    const m = areaVal(+areaIn.value);
    areaOut.textContent = m.toLocaleString('pt-PT') + ' m²';
    areaHint.textContent = HINTS.find(h => m <= h[0])[1];
    const px = 14 + Math.sqrt(m) * .5; areaBox.style.width = areaBox.style.height = Math.min(64, px) + 'px';
    summary();
  }
  areaIn.addEventListener('input', updArea);

  function summary() {
    const fd = new FormData(form);
    const sv = fd.getAll('servicos');
    $('[data-sum="servicos"]').textContent = sv.length ? sv.join(', ') : '—';
    $('[data-sum="espaco"]').textContent = `${fd.get('tipo_espaco')} · ${areaOut.textContent}`;
    $('[data-sum="localidade"]').textContent = fd.get('localidade') || '—';
    $('[data-sum="frequencia"]').textContent = form.querySelector('input[name="frequencia"]:checked + span').textContent;
  }
  form.addEventListener('input', e => {
    if (e.target.name === 'servicos') { setService(e.target.value, e.target.checked); $('[data-err="1"]').classList.remove('show'); }
    const f = e.target.closest('.field'); if (f) f.classList.remove('invalid');
    summary();
  });

  function valid(n) {
    let ok = true;
    if (n === 1) { ok = basket.size > 0; $('[data-err="1"]').classList.toggle('show', !ok); }
    $$('.field input[required]', stepsEls[n - 1]).forEach(inp => {
      const bad = !inp.checkValidity() || !inp.value.trim();
      inp.closest('.field').classList.toggle('invalid', bad); if (bad) ok = false;
    });
    if (n === 4) { const c = form.consentimento.checked; $('[data-err="consent"]').classList.toggle('show', !c); if (!c) ok = false; }
    return ok;
  }
  function go(n) {
    step = n;
    stepsEls.forEach((s, i) => s.classList.toggle('on', i === n - 1));
    prog.forEach((p, i) => { p.classList.toggle('on', i === n - 1); p.classList.toggle('done', i < n - 1); });
    back.hidden = n === 1; next.hidden = n === 4; send.hidden = n !== 4;
    const top = form.getBoundingClientRect().top + scrollY - 90;
    if (scrollY > top) scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    const first = $('input:not([type=hidden]):not(.honey), textarea', stepsEls[n - 1]);
    if (first && n > 1) setTimeout(() => first.focus({ preventScroll: true }), 50);
  }
  next.addEventListener('click', () => { if (valid(step)) go(step + 1); });
  back.addEventListener('click', () => go(step - 1));
  form.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && step < 4) { e.preventDefault(); next.click(); } });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form._honey.value) return;
    if (!valid(4)) return;
    const fd = new FormData(form);
    const data = {
      _subject: `Novo pedido de orçamento: ${fd.get('nome')} (${fd.get('localidade')})`,
      _template: 'table', _captcha: 'false', _replyto: fd.get('email'),
      _autoresponse: 'Obrigado pelo seu pedido! Recebemos a sua mensagem e a equipa FloresESer responde em até 24 horas úteis.',
      'Nome': fd.get('nome'), 'Email': fd.get('email'), 'Telefone': fd.get('telefone'),
      'Localidade': fd.get('localidade'), 'Serviços pedidos': fd.getAll('servicos').join(', '),
      'Tipo de espaço': fd.get('tipo_espaco'), 'Área aproximada': areaOut.textContent,
      'Frequência': fd.get('frequencia'), 'Mensagem': fd.get('mensagem') || '—',
    };
    send.disabled = true; send.textContent = 'A enviar…'; status.className = 'form-status';
    try {
      const res = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(C.email), {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === 'false' || json.success === false) throw new Error(json.message || 'Erro');
      form.innerHTML = `<div class="wz-done"><div class="big">🌱</div><h3>Pedido enviado!</h3><p>Obrigado, ${fd.get('nome').split(' ')[0]}. Vamos responder para ${fd.get('email')} em até 24 horas úteis.</p></div>`;
    } catch (err) {
      const body = Object.entries(data).filter(([k]) => !k.startsWith('_')).map(([k, v]) => `${k}: ${v}`).join('\n');
      const mailto = `mailto:${C.email}?subject=${encodeURIComponent(data._subject)}&body=${encodeURIComponent(body)}`;
      status.className = 'form-status fail';
      status.innerHTML = `Não foi possível enviar automaticamente. <a href="${mailto}">Clique aqui para enviar por email</a> ou ligue-nos para ${C.phoneDisplay}.`;
      send.disabled = false; send.textContent = 'Enviar pedido';
    }
  });

  updArea(); summary();
})();
