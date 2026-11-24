(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  // Ano no rodapé
  $('#year').textContent = new Date().getFullYear();

  // Foto ausente -> mostra espaço tracejado com o nome do arquivo
  $$('.photo').forEach(f => {
    const img = $('img', f);
    const empty = () => { img.remove(); f.classList.add('empty'); };
    img.addEventListener('error', empty);
    if (img.complete && !img.naturalWidth) empty();
  });

  // Menu mobile
  const btn = $('#menuBtn'), menu = $('#menu');
  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
  $$('#menu a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('open'); btn.setAttribute('aria-expanded', false);
  }));

  // Barra de progresso + link ativo
  const bar = $('#progress');
  const links = $$('#menu a[href^="#"]');
  const sections = links.map(a => $(a.getAttribute('href')));
  addEventListener('scroll', () => {
    const h = document.documentElement;
    bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
    const y = scrollY + 140;
    sections.forEach((s, i) => links[i].classList.toggle('on', s.offsetTop <= y && s.offsetTop + s.offsetHeight > y));
  }, { passive: true });

  // Painel interativo: receita de novembro por grupo (dados ILUSTRATIVOS, nunca use dados reais do banco!)
  const groups = {
    top:    [['JBS', 4820000], ['Marfrig', 3960000], ['Cargill', 3150000], ['Ambev', 2480000], ['BRF', 1870000]],
    bottom: [['Aurora', 310000],  ['Yara Brasil', 240000],    ['Fertipar', 175000],  ['Piracanjuba', 120000],   ['Café do Sítio', 68000]]
  };
  const chart = $('#chart'), dName = $('#dName'), dValue = $('#dValue'), dMeta = $('#dMeta');
  let view = 'top', timer;

  const money = v => v >= 1e6
    ? 'R$ ' + (v / 1e6).toFixed(2).replace('.', ',') + ' mi'
    : 'R$ ' + Math.round(v / 1e3) + ' mil';

  function select(i) {
    const [name, value] = groups[view][i];
    const total = groups[view].reduce((s, g) => s + g[1], 0);
    $$('.gcol', chart).forEach((c, k) => c.classList.toggle('sel', k === i));
    dName.textContent = `Grupo Agro ${name} · receita em novembro`;
    dMeta.textContent = `${Math.round(value / total * 100)}% do ${view === 'top' ? 'Top' : 'Bottom'} 5 · ${i + 1}º do ranking`;
    // contagem animada do valor
    cancelAnimationFrame(timer);
    const t0 = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - t0) / 600);
      dValue.textContent = money(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) timer = requestAnimationFrame(tick);
    };
    timer = requestAnimationFrame(tick);
  }

  function render(v) {
    view = v;
    const max = Math.max(...groups[v].map(g => g[1]));
    chart.innerHTML = groups[v].map(([n, val], i) =>
      `<button class="gcol" data-i="${i}" aria-label="Grupo ${n}: ${money(val)}">
         <span class="gbar" data-h="${val / max * 100}"></span><span>${n}</span>
       </button>`).join('');
    $$('.gcol', chart).forEach(c => {
      c.addEventListener('click', () => select(+c.dataset.i));
      c.addEventListener('mouseenter', () => select(+c.dataset.i));
      c.addEventListener('focus', () => select(+c.dataset.i));
    });
    requestAnimationFrame(() => requestAnimationFrame(() =>
      $$('.gbar', chart).forEach(b => b.style.height = b.dataset.h + '%')));
    select(0);
  }
  $$('.tab').forEach(t => t.addEventListener('click', () => {
    $$('.tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active'); render(t.dataset.view);
  }));
  render('top');

  // Timeline expansível
  $$('.item-head').forEach(h => h.addEventListener('click', () => {
    const item = h.closest('.item'), body = $('.item-body', item);
    const open = item.classList.toggle('open');
    h.setAttribute('aria-expanded', open);
    body.style.maxHeight = open ? body.scrollHeight + 'px' : 0;
  }));
  const first = $('.item-head'); if (first) setTimeout(() => first.click(), 400);

  // Filtro de habilidades
  $$('.chip').forEach(c => c.addEventListener('click', () => {
    $$('.chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    $$('#skills li').forEach(li => li.classList.toggle('hide', c.dataset.f !== 'all' && li.dataset.c !== c.dataset.f));
  }));

  // Contadores + revelar ao rolar
  const count = el => {
    const end = +el.dataset.count, suf = el.dataset.suffix || '';
    let n = 0;
    const step = () => { n += Math.max(1, end / 40); el.textContent = Math.min(end, Math.round(n)) + suf; if (n < end) requestAnimationFrame(step); };
    step();
  };
  $$('.section, .contact').forEach(s => s.classList.add('reveal'));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    $$('[data-count]', e.target).forEach(count);
    io.unobserve(e.target);
  }), { threshold: .15 });
  $$('.reveal').forEach(el => io.observe(el));
})();
