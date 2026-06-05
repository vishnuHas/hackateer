/**
 * Hackateer — Premium Landing Page Interactions v2.0
 * Particle canvas, smooth cursor, scroll reveals, interactive widgets
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ========================================================================
     1. PARTICLE CANVAS BACKGROUND
     ======================================================================== */
  const canvas = document.getElementById('particles-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H, particles = [], animId;

    const config = {
      count: 80,
      speed: 0.3,
      size: { min: 1, max: 2.5 },
      color: '#6366f1',
      lineColor: 'rgba(99,102,241,',
      maxDist: 140,
      mouse: { x: -999, y: -999, radius: 100 }
    };

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function createParticle() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * config.speed,
        vy: (Math.random() - 0.5) * config.speed,
        size: config.size.min + Math.random() * (config.size.max - config.size.min),
        opacity: 0.3 + Math.random() * 0.5
      };
    }

    function init() {
      resize();
      particles = Array.from({ length: config.count }, createParticle);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      particles.forEach((p, i) => {
        // Update
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${p.opacity})`;
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dist = Math.hypot(p.x - q.x, p.y - q.y);
          if (dist < config.maxDist) {
            const alpha = (1 - dist / config.maxDist) * 0.15;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = config.lineColor + alpha + ')';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      });

      animId = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', () => {
      resize();
      particles = Array.from({ length: config.count }, createParticle);
    });

    init();
    draw();
  }

  /* ========================================================================
     2. CUSTOM CURSOR
     ======================================================================== */
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');

  let mx = 0, my = 0, rx = 0, ry = 0;

  window.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    if (dot) {
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
    }
  });

  function followRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    if (ring) {
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
    }
    requestAnimationFrame(followRing);
  }
  followRing();

  document.querySelectorAll('a, button, input, .faq-q, .tt-btn, .cli-tab, .ma-btn').forEach(el => {
    el.addEventListener('mouseenter', () => ring?.classList.add('hovered'));
    el.addEventListener('mouseleave', () => ring?.classList.remove('hovered'));
  });

  /* ========================================================================
     3. NAVIGATION — SCROLL & HAMBURGER
     ======================================================================== */
  const header = document.getElementById('site-header');
  const hamburger = document.getElementById('hamburger');
  const drawer = document.getElementById('mobile-drawer');

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY > 40;
    header?.classList.toggle('scrolled', scrolled);
    
    const canvasBg = document.getElementById('particles-canvas');
    if (canvasBg) {
      if (window.scrollY > window.innerHeight * 0.6) {
        canvasBg.classList.add('active');
      } else {
        canvasBg.classList.remove('active');
      }
    }
  }, { passive: true });

  function toggleDrawer(open) {
    hamburger?.classList.toggle('open', open);
    drawer?.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  hamburger?.addEventListener('click', () => {
    const isOpen = drawer?.classList.contains('open');
    toggleDrawer(!isOpen);
  });

  drawer?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => toggleDrawer(false));
  });

  /* ========================================================================
     4. SCROLL REVEAL — INTERSECTION OBSERVER
     ======================================================================== */
  const revealEls = document.querySelectorAll('.reveal-fade, .reveal-up, .reveal-slide-right');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  revealEls.forEach(el => observer.observe(el));

  /* ========================================================================
     5. STATS COUNTER ANIMATION
     ======================================================================== */
  const statVals = document.querySelectorAll('.hackateer-stat-val');

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const target = parseInt(el.getAttribute('data-target'));
        const duration = 1800;
        const start = performance.now();

        function update(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target).toLocaleString();
          if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statVals.forEach(el => counterObserver.observe(el));

  /* ========================================================================
     6. TRACKS — SLIDER INTERACTION
     ======================================================================== */
  const sliders = {
    design: { slider: document.getElementById('slider-design'), val: document.getElementById('val-design'), fill: document.getElementById('fill-design'), mf: document.getElementById('mf-design') },
    eng:    { slider: document.getElementById('slider-eng'),    val: document.getElementById('val-eng'),    fill: document.getElementById('fill-eng'),    mf: document.getElementById('mf-eng')    },
    ai:     { slider: document.getElementById('slider-ai'),     val: document.getElementById('val-ai'),     fill: document.getElementById('fill-ai'),     mf: document.getElementById('mf-ai')     }
  };

  const tracksData = {
    ai: {
      icon: 'fa-brain',
      title: 'Cognitive Intelligence',
      desc: 'For developers building scalable ML, LLM-driven workflows, autonomous agents, and neural interface pipelines. Perfect for tech-heavy backends.',
      tags: ['#MachineLearning', '#LLMs', '#AutonomousAgents', '#Python'],
      gradient: 'linear-gradient(135deg, #6366f1, #ec4899)'
    },
    design: {
      icon: 'fa-wand-magic-sparkles',
      title: 'Immersive UI/UX & WebGL',
      desc: 'Built for visual engineering pioneers. Design dynamic systems, canvas-based widgets, WebGL/three.js spatial layers, and reactive components.',
      tags: ['#WebGL', '#CanvasAPI', '#InteractiveDesign', '#Figma'],
      gradient: 'linear-gradient(135deg, #ec4899, #f97316)'
    },
    eng: {
      icon: 'fa-server',
      title: 'Distributed Engines & WASM',
      desc: 'Perfect for core systems engineers. Build lightweight compilers, WASM microkernels, decentralized systems, or custom DB engines.',
      tags: ['#WASM', '#Rust', '#DistributedSystems', '#Compilers'],
      gradient: 'linear-gradient(135deg, #6366f1, #a855f7)'
    }
  };

  const trackIcon = document.getElementById('track-icon');
  const trackTitle = document.getElementById('track-title');
  const trackDesc = document.getElementById('track-desc');
  const trackTags = document.getElementById('track-tags');

  // Track list cards on the left
  const trackCards = {
    design: document.getElementById('card-design'),
    eng:    document.getElementById('card-eng'),
    ai:     document.getElementById('card-ai')
  };

  function updateTrack() {
    const d = parseInt(sliders.design.slider?.value || 60);
    const e = parseInt(sliders.eng.slider?.value || 80);
    const a = parseInt(sliders.ai.slider?.value || 40);

    // Update values
    if (sliders.design.val) sliders.design.val.textContent = d + '%';
    if (sliders.eng.val)    sliders.eng.val.textContent    = e + '%';
    if (sliders.ai.val)     sliders.ai.val.textContent     = a + '%';

    // Update fills
    if (sliders.design.fill) sliders.design.fill.style.width = d + '%';
    if (sliders.eng.fill)    sliders.eng.fill.style.width    = e + '%';
    if (sliders.ai.fill)     sliders.ai.fill.style.width     = a + '%';

    // Update meters
    if (sliders.design.mf) sliders.design.mf.style.width = d + '%';
    if (sliders.eng.mf)    sliders.eng.mf.style.width    = e + '%';
    if (sliders.ai.mf)     sliders.ai.mf.style.width     = a + '%';

    // Determine winner
    let category = 'eng';
    if (d >= e && d >= a) category = 'design';
    else if (a >= e && a >= d) category = 'ai';

    const track = tracksData[category];

    // Update active class on left sidebar cards
    Object.entries(trackCards).forEach(([cat, card]) => {
      if (card) {
        if (cat === category) {
          card.classList.add('track-list-card--active');
        } else {
          card.classList.remove('track-list-card--active');
        }
      }
    });

    // Fade out → update → fade in
    [trackTitle, trackDesc, trackTags].forEach(el => el && (el.style.opacity = '0'));

    setTimeout(() => {
      if (trackIcon) {
        trackIcon.style.background = track.gradient;
        trackIcon.innerHTML = `<i class="fa-solid ${track.icon}"></i>`;
      }
      if (trackTitle) trackTitle.textContent = track.title;
      if (trackDesc)  trackDesc.textContent  = track.desc;
      if (trackTags) {
        trackTags.innerHTML = track.tags.map(t => `<span>${t}</span>`).join('');
      }
      [trackTitle, trackDesc, trackTags].forEach(el => el && (el.style.opacity = '1'));
    }, 160);
  }

  // Predefined slider presets for each track category
  const trackPresets = {
    design: { design: 95, eng: 50, ai: 30 },
    eng:    { design: 30, eng: 95, ai: 40 },
    ai:     { design: 40, eng: 60, ai: 95 }
  };

  // Add slider input events
  Object.values(sliders).forEach(({ slider }) => {
    slider?.addEventListener('input', updateTrack);
  });

  // Slider preset card click events
  Object.entries(trackCards).forEach(([cat, card]) => {
    card?.addEventListener('click', () => {
      const preset = trackPresets[cat];
      if (preset) {
        if (sliders.design.slider) sliders.design.slider.value = preset.design;
        if (sliders.eng.slider)    sliders.eng.slider.value    = preset.eng;
        if (sliders.ai.slider)     sliders.ai.slider.value     = preset.ai;
        updateTrack();
      }
    });
  });

  // Workspace Network Canvas Animation
  const tracksCanvas = document.getElementById('tracks-network-canvas');
  if (tracksCanvas) {
    const tCtx = tracksCanvas.getContext('2d');
    let tW, tH, tFrame = 0;

    const tNodes = [];
    const numNodes = 14;
    for (let i = 0; i < numNodes; i++) {
      tNodes.push({
        xFrac: 0.15 + Math.random() * 0.7,
        yFrac: 0.15 + Math.random() * 0.7,
        vx: (Math.random() - 0.5) * 0.0008,
        vy: (Math.random() - 0.5) * 0.0008,
        radius: Math.random() * 2.5 + 2.5,
        offset: Math.random() * Math.PI * 2
      });
    }

    const primaryNode = {
      xFrac: 0.35,
      yFrac: 0.60,
      radius: 18,
      vx: 0,
      vy: 0
    };
    tNodes.push(primaryNode);

    function resizeTracksNet() {
      if (tracksCanvas) {
        tracksCanvas.width  = tW = tracksCanvas.offsetWidth;
        tracksCanvas.height = tH = tracksCanvas.offsetHeight;
      }
    }

    function drawTracksNet() {
      if (!tCtx) return;
      tCtx.clearRect(0, 0, tW, tH);
      tFrame++;

      // Update positions
      tNodes.forEach(n => {
        if (n === primaryNode) {
          n.x = tW * (primaryNode.xFrac + 0.02 * Math.sin(tFrame * 0.008));
          n.y = tH * (primaryNode.yFrac + 0.02 * Math.cos(tFrame * 0.006));
          return;
        }
        n.xFrac += n.vx;
        n.yFrac += n.vy;

        if (n.xFrac < 0.08 || n.xFrac > 0.92) n.vx *= -1;
        if (n.yFrac < 0.08 || n.yFrac > 0.92) n.vy *= -1;

        n.x = n.xFrac * tW;
        n.y = n.yFrac * tH;
      });

      // Draw connections
      tCtx.beginPath();
      for (let i = 0; i < tNodes.length; i++) {
        const ni = tNodes[i];
        for (let j = i + 1; j < tNodes.length; j++) {
          const nj = tNodes[j];
          const dx = ni.x - nj.x;
          const dy = ni.y - nj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const maxDist = Math.min(tW, tH) * 0.28;
          if (dist < maxDist) {
            const alpha = 0.15 * (1 - dist / maxDist);
            tCtx.moveTo(ni.x, ni.y);
            tCtx.lineTo(nj.x, nj.y);
            tCtx.strokeStyle = `rgba(21, 31, 87, ${alpha})`;
          }
        }
      }
      tCtx.lineWidth = 0.8;
      tCtx.stroke();

      // Draw normal nodes
      tNodes.forEach(n => {
        if (n === primaryNode) return;
        tCtx.beginPath();
        tCtx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        tCtx.fillStyle = '#151F57';
        tCtx.globalAlpha = 0.35 + 0.2 * Math.sin(tFrame * 0.02 + n.offset);
        tCtx.fill();
        tCtx.globalAlpha = 1.0;
      });

      // Draw primary active node
      tCtx.beginPath();
      tCtx.arc(primaryNode.x, primaryNode.y, primaryNode.radius, 0, Math.PI * 2);
      tCtx.fillStyle = '#151F57';
      tCtx.shadowColor = 'rgba(21, 31, 87, 0.4)';
      tCtx.shadowBlur = 15;
      tCtx.fill();
      tCtx.shadowBlur = 0;

      // Draw Lock Symbol
      tCtx.beginPath();
      tCtx.arc(primaryNode.x, primaryNode.y - 3, 4, 0, Math.PI * 2);
      tCtx.fillStyle = '#ffffff';
      tCtx.fill();
      tCtx.beginPath();
      tCtx.moveTo(primaryNode.x - 5, primaryNode.y + 6);
      tCtx.lineTo(primaryNode.x + 5, primaryNode.y + 6);
      tCtx.lineTo(primaryNode.x + 3, primaryNode.y - 1);
      tCtx.lineTo(primaryNode.x - 3, primaryNode.y - 1);
      tCtx.closePath();
      tCtx.fill();

      requestAnimationFrame(drawTracksNet);
    }

    resizeTracksNet();
    window.addEventListener('resize', resizeTracksNet);
    drawTracksNet();
  }


  /* ========================================================================
     7. BENTO: TIMELINE TABS
     ======================================================================== */
  const ttBtns = document.querySelectorAll('.tt-btn');
  const tpPanels = document.querySelectorAll('.tp-panel');

  ttBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      ttBtns.forEach(b => b.classList.remove('active'));
      tpPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const step = btn.getAttribute('data-step');
      document.getElementById('tp-' + step)?.classList.add('active');
    });
  });

  /* ========================================================================
     8. BENTO: TEAM MATCHER
     ======================================================================== */
  const profiles = [
    {
      name: 'Maya Patel',
      id: '15967550',
      role: 'Coach · Crioting · fssttine',
      bio: '"This soienta friux-anthna/xs-estico:he opaotoassine/filttest wrinkwei ed tuioapitions h: the ioesioa theremp clone frsw lomacts..."',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&q=80'
    },
    {
      name: 'Marcus Aurel',
      id: '28967881',
      role: 'Arch · Systems · Compilers',
      bio: '"Pean prolxaefevator ia or rpe fso fIatve panir lerse boohe reitist arcof he hagotez filvoinrg."',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&q=80'
    },
    {
      name: 'Sophia Chen',
      id: '39021774',
      role: 'ML · LLM · VectorDBs',
      bio: '"Fean prolxaefevator rpe fso fIatve panir boohe reitist arcof hagotez a filvoinrg g\'leuil."',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&q=80'
    },
    {
      name: 'Elena Rostova',
      id: '47156302',
      role: 'Design · Figma · Spline',
      bio: '"Soienta friux-anthna/xs-estico:he opaotoassine filttest wrinkwei ed tuioapitions h: the ioesioa theremp."',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&q=80'
    }
  ];

  let profileIdx = 0;
  const mCard  = document.getElementById('matcher-card');
  const mAvatar = document.getElementById('m-avatar');
  const mName  = document.getElementById('m-name');
  const mIdEl  = document.getElementById('m-id');
  const mRole  = document.getElementById('m-role');
  const mBio   = document.getElementById('m-bio');
  const maSkip = document.getElementById('ma-skip');
  const maLike = document.getElementById('ma-like');
  const mToast = document.getElementById('match-toast');

  function loadProfile(idx) {
    const p = profiles[idx % profiles.length];
    if (mAvatar) mAvatar.src = p.avatar;
    if (mName)   mName.textContent = p.name;
    if (mIdEl)   mIdEl.textContent = p.id;
    if (mRole)   mRole.textContent = p.role;
    if (mBio)    mBio.textContent  = p.bio;
  }

  function swipe(dir) {
    if (!mCard) return;
    mCard.classList.add(dir === 'like' ? 'swipe-right' : 'swipe-left');

    if (dir === 'like') {
      mToast?.classList.add('show');
      setTimeout(() => mToast?.classList.remove('show'), 1500);
    }

    setTimeout(() => {
      mCard.classList.remove('swipe-right', 'swipe-left');
      profileIdx++;
      loadProfile(profileIdx);
    }, 420);
  }

  if (mCard) {
    maSkip?.addEventListener('click', () => swipe('skip'));
    maLike?.addEventListener('click', () => swipe('like'));
    loadProfile(0);
  }

  /* ========================================================================
     9. BENTO: CLI CONSOLE
     ======================================================================== */
  const cliTabs = document.querySelectorAll('.cli-tab');
  const cliCmd  = document.getElementById('cli-cmd');
  const cliOut  = document.getElementById('cli-out');

  const cliData = {
    init:   { cmd: 'hackateer init',   out: '✓ Workspace ready. Type "dev" to begin.' },
    dev:    { cmd: 'hackateer dev',    out: '⚙ Spinning bundlers...\n✓ Dev server on :3000\n✓ Watching files... [OK]' },
    deploy: { cmd: 'hackateer deploy', out: '⚡ Analyzing assets...\n✓ Verification: passed\n🚀 Live → https://app.hackateer.dev/hck-2026x' }
  };

  cliTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      cliTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const key = tab.getAttribute('data-cmd');
      if (cliOut) cliOut.style.opacity = '0';
      setTimeout(() => {
        if (cliCmd) cliCmd.textContent = cliData[key].cmd;
        if (cliOut) { cliOut.textContent = cliData[key].out; cliOut.style.opacity = '1'; }
      }, 150);
    });
  });

  /* ========================================================================
     10. FAQ ACCORDION
     ======================================================================== */
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));

      // Open clicked if was closed
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ========================================================================
     11. 3D CARD TILT (Desktop only)
     ======================================================================== */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.glass-panel').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
        const y = -((e.clientY - rect.top) / rect.height - 0.5) * 10;
        card.style.transform = `perspective(1200px) rotateX(${y}deg) rotateY(${x}deg) scale3d(1.01,1.01,1.01)`;
        card.style.transition = 'transform 0.06s ease-out';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
        card.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
      });
    });
  }

  /* ========================================================================
     12. HERO PARALLAX ON SCROLL (HACKATEER THEME)
     ======================================================================== */
  const hackateerHeroInner = document.querySelector('.hero-hackateer-inner');

  window.addEventListener('scroll', () => {
    const sy = window.scrollY;
    if (sy < window.innerHeight) {
      if (hackateerHeroInner) {
        hackateerHeroInner.style.transform = `translateY(${sy * 0.25}px)`;
      }
    }
  }, { passive: true });

  /* ========================================================================
     13. MARQUEE PAUSE ON HOVER
     ======================================================================== */
  const marqueeTrack = document.querySelector('.marquee-track');
  if (marqueeTrack) {
    marqueeTrack.addEventListener('mouseenter', () => {
      marqueeTrack.style.animationPlayState = 'paused';
    });
    marqueeTrack.addEventListener('mouseleave', () => {
      marqueeTrack.style.animationPlayState = 'running';
    });
  }

  /* ========================================================================
     14. SMOOTH ANCHOR LINKS
     ======================================================================== */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const targetId = a.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ========================================================================
     15. 3D ROTATING PARTICLE NEBULA (HACKATEER HERO)
     ======================================================================== */
  const nebulaCanvas = document.getElementById('nebula-canvas');
  if (nebulaCanvas) {
    const nCtx = nebulaCanvas.getContext('2d');
    let nW, nH;
    let nParticles = [];
    const particleCount = 280;
    const focalLength = 140;
    
    function resizeNebula() {
      nW = nebulaCanvas.width = nebulaCanvas.clientWidth;
      nH = nebulaCanvas.height = nebulaCanvas.clientHeight;
    }
    resizeNebula();
    
    // Generate organic 3D shape (hourglass cloud shape)
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 80;
      const tRadius = 15 + Math.abs(height) * 0.4 + Math.sin(angle * 3) * 4;
      
      nParticles.push({
        x: tRadius * Math.cos(angle),
        y: height,
        z: tRadius * Math.sin(angle),
        size: 0.8 + Math.random() * 1.6,
        colorType: Math.random() > 0.35 ? 'plum' : 'indigo'
      });
    }

    let rotY = 0.007;
    let rotX = 0.004;
    let targetRotY = 0.007;
    let targetRotX = 0.004;

    window.addEventListener('mousemove', (e) => {
      const rect = nebulaCanvas.getBoundingClientRect();
      const mx = e.clientX - (rect.left + rect.width / 2);
      const my = e.clientY - (rect.top + rect.height / 2);
      
      const dist = Math.hypot(mx, my);
      if (dist < 220) {
        targetRotY = 0.007 + (mx * 0.0001);
        targetRotX = 0.004 + (my * 0.0001);
      } else {
        targetRotY = 0.007;
        targetRotX = 0.004;
      }
    });

    function drawNebula() {
      nCtx.clearRect(0, 0, nW, nH);
      
      rotY += (targetRotY - rotY) * 0.05;
      rotX += (targetRotX - rotX) * 0.05;
      
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      nParticles.sort((a, b) => b.z - a.z);

      nParticles.forEach(p => {
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;
        
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;
        
        p.x = x1;
        p.y = y1;
        p.z = z2;

        const scale = focalLength / (focalLength + p.z);
        const projX = nW / 2 + p.x * scale;
        const projY = nH / 2 + p.y * scale;

        const depthAlpha = 0.2 + 0.65 * ((focalLength - p.z) / (2 * focalLength));
        const finalAlpha = Math.max(0.15, Math.min(0.9, depthAlpha));

        if (projX >= 0 && projX <= nW && projY >= 0 && projY <= nH) {
          nCtx.beginPath();
          nCtx.arc(projX, projY, p.size * scale, 0, Math.PI * 2);
          
          if (p.colorType === 'indigo') {
            nCtx.fillStyle = `rgba(99, 102, 241, ${finalAlpha})`;
          } else {
            nCtx.fillStyle = `rgba(26, 22, 43, ${finalAlpha * 0.8})`;
          }
          
          nCtx.fill();
        }
      });

      requestAnimationFrame(drawNebula);
    }
    
    window.addEventListener('resize', resizeNebula);
    drawNebula();
  }



}); // end DOMContentLoaded
