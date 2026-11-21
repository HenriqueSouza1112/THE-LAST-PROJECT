/* ============================================================
   script.js — Comportamento e interatividade do site
   Organização:
   1. Preloader
   2. Fundo animado (canvas)
   3. Cabeçalho, menu e barra de progresso
   4. Animação de digitação do título
   5. Contadores animados
   6. Revelar elementos ao rolar a página
   7. Linha do tempo (abrir/fechar e filtros)
   8. Galeria com lightbox
   9. Redações (cards, busca, filtro e modal)
   10. Tema claro/escuro, voltar ao topo e ano do rodapé
   ============================================================ */

(function () {
  'use strict';

  /* Atalhos para não repetir document.querySelector o tempo todo */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));


  /* ===== 1. PRELOADER ===== */
  window.addEventListener('load', () => {
    const pre = $('#preloader');
    if (pre) setTimeout(() => pre.classList.add('is-done'), 450);
  });


  /* ===== 2. FUNDO ANIMADO (pontinhos flutuando) ===== */
  function iniciarFundo() {
    const canvas = $('#starfield');
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    let pontos = [];
    let largura, altura;

    function dimensionar() {
      largura = canvas.width  = window.innerWidth;
      altura  = canvas.height = window.innerHeight;
      const quantidade = Math.min(90, Math.floor(largura / 16));
      pontos = Array.from({ length: quantidade }, () => ({
        x: Math.random() * largura,
        y: Math.random() * altura,
        r: Math.random() * 1.6 + 0.4,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        a: Math.random() * 0.5 + 0.2
      }));
    }

    function desenhar() {
      ctx.clearRect(0, 0, largura, altura);
      const claro = document.body.classList.contains('light');
      pontos.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = largura; if (p.x > largura) p.x = 0;
        if (p.y < 0) p.y = altura;  if (p.y > altura)  p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = claro
          ? `rgba(60, 90, 140, ${p.a})`
          : `rgba(150, 200, 255, ${p.a})`;
        ctx.fill();
      });
      requestAnimationFrame(desenhar);
    }

    dimensionar();
    desenhar();
    window.addEventListener('resize', dimensionar);
  }
  iniciarFundo();


  /* ===== 3. CABEÇALHO, MENU E BARRA DE PROGRESSO ===== */
  const header   = $('#header');
  const progress = $('#scrollProgress');
  const toTop    = $('#toTop');
  const navLinks = $$('.nav__link');
  const secoes   = $$('main section[id]');

  function aoRolar() {
    const y = window.scrollY;

    if (header) header.classList.toggle('is-stuck', y > 20);
    if (toTop)  toTop.classList.toggle('is-visible', y > 500);

    if (progress) {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = total > 0 ? (y / total) * 100 + '%' : '0%';
    }

    /* Marca no menu a seção que está na tela */
    let atual = '';
    secoes.forEach(sec => {
      if (y >= sec.offsetTop - 140) atual = sec.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + atual);
    });
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  /* Menu sanduíche no celular */
  const navToggle = $('#navToggle');
  const navMenu   = $('#navMenu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const aberto = navMenu.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', aberto);
      navToggle.setAttribute('aria-expanded', String(aberto));
    });
    navLinks.forEach(link => link.addEventListener('click', () => {
      navMenu.classList.remove('is-open');
      navToggle.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }));
  }


  /* ===== 4. ANIMAÇÃO DE DIGITAÇÃO ===== */
  function digitar() {
    const alvo = $('#typed');
    if (!alvo) return;
    const frases = ['mudaram tudo.', 'passaram voando.', 'valeram a pena.', 'eu nunca esqueço.'];
    let i = 0, j = 0, apagando = false;

    (function passo() {
      const frase = frases[i];
      alvo.textContent = apagando ? frase.slice(0, --j) : frase.slice(0, ++j);

      let espera = apagando ? 45 : 85;
      if (!apagando && j === frase.length) { espera = 2200; apagando = true; }
      else if (apagando && j === 0)        { apagando = false; i = (i + 1) % frases.length; espera = 400; }

      setTimeout(passo, espera);
    })();
  }
  digitar();


  /* ===== 5. CONTADORES ANIMADOS ===== */
  function animarNumero(el) {
    const alvo = Number(el.dataset.target) || 0;
    const duracao = 1200;
    const inicio = performance.now();

    function tique(agora) {
      const p = Math.min((agora - inicio) / duracao, 1);
      const suave = 1 - Math.pow(1 - p, 3);          /* desacelera no fim */
      el.textContent = Math.round(alvo * suave);
      if (p < 1) requestAnimationFrame(tique);
    }
    requestAnimationFrame(tique);
  }

  const statsBox = $('#stats');
  if (statsBox) {
    const obsStats = new IntersectionObserver((entradas, obs) => {
      entradas.forEach(e => {
        if (!e.isIntersecting) return;
        $$('.stat__num', statsBox).forEach(animarNumero);
        obs.disconnect();
      });
    }, { threshold: 0.4 });
    obsStats.observe(statsBox);
  }


  /* ===== 6. REVELAR AO ROLAR ===== */
  const obsReveal = new IntersectionObserver((entradas) => {
    entradas.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        obsReveal.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  function observarReveals() {
    $$('.reveal:not(.is-visible)').forEach(el => obsReveal.observe(el));
  }
  observarReveals();


  /* ===== 7. LINHA DO TEMPO ===== */
  $$('.tl-more').forEach(botao => {
    botao.addEventListener('click', () => {
      const item = botao.closest('.tl-item');
      const aberto = item.classList.toggle('is-open');
      botao.firstChild.textContent = aberto ? 'Ler menos ' : 'Ler mais ';
    });
  });

  const tlTabs = $('#tlTabs');
  if (tlTabs) {
    tlTabs.addEventListener('click', (ev) => {
      const botao = ev.target.closest('.tl-tab');
      if (!botao) return;
      $$('.tl-tab', tlTabs).forEach(b => b.classList.remove('is-active'));
      botao.classList.add('is-active');

      const filtro = botao.dataset.filter;
      $$('.tl-item').forEach(item => {
        const mostra = filtro === 'todos' || item.dataset.cat === filtro;
        item.classList.toggle('is-hidden', !mostra);
      });
    });
  }


  /* ===== 8. GALERIA COM LIGHTBOX ===== */
  const galItems  = $$('.gal-item');
  const lightbox  = $('#lightbox');
  const lbImage   = $('#lbImage');
  const lbCaption = $('#lbCaption');
  let indiceFoto  = 0;

  function abrirFoto(i) {
    indiceFoto = (i + galItems.length) % galItems.length;
    const item = galItems[indiceFoto];
    const img  = $('img', item);
    lbImage.src = img.src;
    lbImage.alt = img.alt;
    lbCaption.innerHTML = item.dataset.caption || '';
    lightbox.hidden = false;
    document.body.classList.add('no-scroll');
  }
  function fecharFoto() {
    lightbox.hidden = true;
    document.body.classList.remove('no-scroll');
  }

  galItems.forEach((item, i) => item.addEventListener('click', () => abrirFoto(i)));
  if (lightbox) {
    $('#lbPrev').addEventListener('click', () => abrirFoto(indiceFoto - 1));
    $('#lbNext').addEventListener('click', () => abrirFoto(indiceFoto + 1));
    lightbox.addEventListener('click', (ev) => {
      if (ev.target === lightbox || ev.target.hasAttribute('data-lb-close')) fecharFoto();
    });
  }


  /* ===== 9. REDAÇÕES ===== */
  const grid        = $('#cardsGrid');
  const inputBusca  = $('#searchInput');
  const filtros     = $('#filters');
  const contagem    = $('#resultCount');
  const vazio       = $('#emptyState');

  const modal       = $('#modal');
  const modalCat    = $('#modalCat');
  const modalTitle  = $('#modalTitle');
  const modalTheme  = $('#modalTheme');
  const modalMeta   = $('#modalMeta');
  const modalBody   = $('#modalBody');

  let categoriaAtual = 'todas';
  let termoBusca     = '';
  let listaVisivel   = [];
  let indiceAberto   = 0;

  const dados = (typeof REDACOES !== 'undefined') ? REDACOES : [];

  /* Tira acentos para a busca funcionar mesmo sem acento */
  function normalizar(txt) {
    return txt.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function contarPalavras(red) {
    return red.paragrafos.join(' ').trim().split(/\s+/).length;
  }

  function filtrar() {
    const termo = normalizar(termoBusca);
    listaVisivel = dados.filter(red => {
      const casaCategoria = categoriaAtual === 'todas' || red.categoria === categoriaAtual;
      if (!casaCategoria) return false;
      if (!termo) return true;
      const textoCompleto = normalizar(
        red.titulo + ' ' + red.tema + ' ' + red.categoria + ' ' +
        red.repertorio.join(' ') + ' ' + red.paragrafos.join(' ')
      );
      return textoCompleto.includes(termo);
    });
    desenharCards();
  }

  function desenharCards() {
    if (!grid) return;
    grid.innerHTML = '';

    listaVisivel.forEach((red, i) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.style.animationDelay = (i * 45) + 'ms';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', 'Abrir redação: ' + red.titulo);

      card.innerHTML = `
        <div class="card__top">
          <span class="card__num">#${String(red.id).padStart(2, '0')}</span>
          <span class="badge">${red.categoria}</span>
        </div>
        <h3 class="card__title">${red.titulo}</h3>
        <p class="card__theme">${red.tema}</p>
        <div class="card__foot">
          <span>${contarPalavras(red)} palavras</span>
          <span class="card__read">Ler &rarr;</span>
        </div>`;

      card.addEventListener('click', () => abrirModal(i));
      card.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); abrirModal(i); }
      });

      grid.appendChild(card);
    });

    if (contagem) {
      const n = listaVisivel.length;
      contagem.textContent = n === dados.length
        ? `Mostrando todas as ${n} redações.`
        : `${n} ${n === 1 ? 'redação encontrada' : 'redações encontradas'} de ${dados.length}.`;
    }
    if (vazio) vazio.hidden = listaVisivel.length !== 0;
  }

  function abrirModal(i) {
    if (!modal || !listaVisivel.length) return;
    indiceAberto = (i + listaVisivel.length) % listaVisivel.length;
    const red = listaVisivel[indiceAberto];

    modalCat.textContent   = red.categoria;
    modalTitle.textContent = red.titulo;
    modalTheme.textContent = red.tema;
    modalMeta.textContent  = `Redação #${String(red.id).padStart(2, '0')} · ` +
                             `${contarPalavras(red)} palavras · ` +
                             `Repertório: ${red.repertorio.join(' • ')}`;
    modalBody.innerHTML    = red.paragrafos.map(p => `<p>${p}</p>`).join('');
    modalBody.scrollTop    = 0;

    modal.hidden = false;
    document.body.classList.add('no-scroll');
    $('.modal__close', modal).focus();
  }

  function fecharModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('no-scroll');
  }

  if (modal) {
    modal.addEventListener('click', (ev) => {
      if (ev.target.hasAttribute('data-close')) fecharModal();
    });
    $('#prevBtn').addEventListener('click', () => abrirModal(indiceAberto - 1));
    $('#nextBtn').addEventListener('click', () => abrirModal(indiceAberto + 1));

    $('#copyBtn').addEventListener('click', async (ev) => {
      const red = listaVisivel[indiceAberto];
      const texto = red.titulo + '\n\n' + red.paragrafos.join('\n\n');
      try {
        await navigator.clipboard.writeText(texto);
        ev.target.textContent = 'Copiado!';
      } catch (e) {
        ev.target.textContent = 'Não foi possível copiar';
      }
      setTimeout(() => { ev.target.textContent = 'Copiar texto'; }, 1800);
    });
  }

  if (inputBusca) {
    inputBusca.addEventListener('input', (ev) => {
      termoBusca = ev.target.value;
      filtrar();
    });
  }

  if (filtros) {
    filtros.addEventListener('click', (ev) => {
      const botao = ev.target.closest('.filter-btn');
      if (!botao) return;
      $$('.filter-btn', filtros).forEach(b => b.classList.remove('is-active'));
      botao.classList.add('is-active');
      categoriaAtual = botao.dataset.cat;
      filtrar();
    });
  }

  /* Teclado: Esc fecha, setas navegam */
  document.addEventListener('keydown', (ev) => {
    if (modal && !modal.hidden) {
      if (ev.key === 'Escape')     fecharModal();
      if (ev.key === 'ArrowLeft')  abrirModal(indiceAberto - 1);
      if (ev.key === 'ArrowRight') abrirModal(indiceAberto + 1);
      return;
    }
    if (lightbox && !lightbox.hidden) {
      if (ev.key === 'Escape')     fecharFoto();
      if (ev.key === 'ArrowLeft')  abrirFoto(indiceFoto - 1);
      if (ev.key === 'ArrowRight') abrirFoto(indiceFoto + 1);
    }
  });

  filtrar();   /* desenha os cards assim que a página carrega */


  /* ===== 10. TEMA, TOPO E ANO ===== */
  const temaBtn = $('#themeToggle');

  /* localStorage pode falhar em alguns navegadores: por isso o try/catch */
  function lerTema() {
    try { return localStorage.getItem('tema'); } catch (e) { return null; }
  }
  function salvarTema(valor) {
    try { localStorage.setItem('tema', valor); } catch (e) { /* ignora */ }
  }

  if (lerTema() === 'claro') document.body.classList.add('light');

  if (temaBtn) {
    temaBtn.addEventListener('click', () => {
      const claro = document.body.classList.toggle('light');
      salvarTema(claro ? 'claro' : 'escuro');
    });
  }

  if (toTop) {
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  const anoEl = $('#year');
  if (anoEl) anoEl.textContent = new Date().getFullYear();

})();
