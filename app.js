/**
 * AETHER Landing Page Interactions
 * Implements high-fidelity, fluid UI animations, interactive widgets, and 3D effects.
 */

document.addEventListener('DOMContentLoaded', () => {
  
  /* ==========================================================================
     1. CUSTOM CURSOR TRACKING
     ========================================================================== */
  const cursor = document.querySelector('.custom-cursor');
  const follower = document.querySelector('.custom-cursor-follower');
  
  let mouseX = 0, mouseY = 0;
  let followerX = 0, followerY = 0;
  
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Immediate cursor follow
    if (cursor) {
      cursor.style.left = `${mouseX}px`;
      cursor.style.top = `${mouseY}px`;
    }
  });
  
  // Follower with elastic interpolation lag
  function updateFollower() {
    followerX += (mouseX - followerX) * 0.15;
    followerY += (mouseY - followerY) * 0.15;
    
    if (follower) {
      follower.style.left = `${followerX}px`;
      follower.style.top = `${followerY}px`;
    }
    
    requestAnimationFrame(updateFollower);
  }
  updateFollower();
  
  // Hover states expansion
  const hoverElements = document.querySelectorAll('a, button, input, textarea, select, .slider, .timeline-step, .legend-item, .accordion-header, .chart-segment');
  
  hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor?.classList.add('hovered');
      follower?.classList.add('hovered');
    });
    
    el.addEventListener('mouseleave', () => {
      cursor?.classList.remove('hovered');
      follower?.classList.remove('hovered');
    });
  });

  /* ==========================================================================
     2. NAVBAR & PARALLAX SCROLL CONTROL
     ========================================================================== */
  const header = document.querySelector('.navbar-container');
  const heroTitleContainer = document.querySelector('.hero-title-container');
  const heroBg = document.querySelector('.hero-bg-grid');
  const heroOrb = document.querySelector('.hero-glowing-orb');
  const heroCtas = document.querySelector('.hero-ctas');
  const scrollIndicator = document.querySelector('.scroll-indicator');
  
  let lastScrollY = 0;
  let ticking = false;
  
  window.addEventListener('scroll', () => {
    lastScrollY = window.scrollY;
    
    if (!ticking) {
      window.requestAnimationFrame(() => {
        // Navbar Shrink
        if (lastScrollY > 40) {
          header?.classList.add('scrolled');
        } else {
          header?.classList.remove('scrolled');
        }
        
        // Hero Section Parallax (Only runs when hero viewport is active)
        if (lastScrollY < window.innerHeight) {
          if (heroTitleContainer) {
            heroTitleContainer.style.transform = `translateY(${lastScrollY * 0.4}px)`;
            heroTitleContainer.style.opacity = `${1 - (lastScrollY / 550)}`;
          }
          if (heroCtas) {
            heroCtas.style.transform = `translateY(${lastScrollY * 0.28}px)`;
            heroCtas.style.opacity = `${1 - (lastScrollY / 450)}`;
          }
          if (scrollIndicator) {
            scrollIndicator.style.transform = `translateY(${lastScrollY * 0.15}px)`;
            scrollIndicator.style.opacity = `${1 - (lastScrollY / 180)}`;
          }
          if (heroBg) {
            heroBg.style.transform = `translateY(${lastScrollY * 0.12}px)`;
          }
          if (heroOrb) {
            heroOrb.style.transform = `translateX(-50%) translateY(${lastScrollY * 0.25}px)`;
          }
        }
        
        // Dynamic parallax drift for other sections
        const scrollRevealSections = document.querySelectorAll('.scroll-reveal');
        scrollRevealSections.forEach(section => {
          const rect = section.getBoundingClientRect();
          const viewHeight = window.innerHeight;
          
          if (rect.top < viewHeight && rect.bottom > 0) {
            const speed = 0.06; // smooth parallax speed
            const relativeScroll = (rect.top - viewHeight / 2) * speed;
            const content = section.querySelector('.container');
            if (content) {
              content.style.transform = `translateY(${relativeScroll}px)`;
              content.style.transition = 'transform 0.05s ease-out';
            }
          }
        });
        
        ticking = false;
      });
      ticking = true;
    }
  });

  // Mobile menu toggle
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link, .mobile-btn');
  
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      document.body.classList.toggle('scroll-locked');
    });
    
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.classList.remove('scroll-locked');
      });
    });
  }

  /* ==========================================================================
     3. SCROLL REVEAL (Intersection Observer)
     ========================================================================== */
  const revealElements = document.querySelectorAll('.scroll-reveal');
  
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-active');
        observer.unobserve(entry.target); // Keep it visible once entered
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px' // Triggers slightly before entry
  });
  
  revealElements.forEach(el => {
    revealObserver.observe(el);
  });

  /* ==========================================================================
     4. VARIABLE TRACKS CONTROLLER
     ========================================================================== */
  const sliderDesign = document.getElementById('slider-design');
  const sliderEng = document.getElementById('slider-eng');
  const sliderAI = document.getElementById('slider-ai');
  
  const valDesign = document.getElementById('val-design');
  const valEng = document.getElementById('val-eng');
  const valAI = document.getElementById('val-ai');
  
  const fillDesign = document.getElementById('fill-design');
  const fillEng = document.getElementById('fill-eng');
  const fillAI = document.getElementById('fill-ai');
  
  // Track Recomendations Output Nodes
  const trackTitle = document.getElementById('track-title');
  const trackDesc = document.getElementById('track-desc');
  const trackTags = document.getElementById('track-tags');
  const trackIcon = document.getElementById('track-icon');
  const trackRecommBadge = document.getElementById('track-recomm-badge');

  const tracksData = {
    ai: {
      title: "Cognitive Intelligence",
      description: "Focuses on scalable machine learning, LLM-driven dev workflows, autonomous agent networks, and neural interface pipelines. Perfect for tech-heavy backends.",
      icon: '<i class="fa-solid fa-brain"></i>',
      tags: ["#MachineLearning", "#LLMs", "#AutonomousAgents", "#Python"],
      color: "#2563eb"
    },
    design: {
      title: "Immersive UI/UX & WebGL",
      description: "Built for visual engineering pioneers. Design dynamic systems, canvas-based widgets, complex WebGL/three.js spatial layers, and smooth reactive components.",
      icon: '<i class="fa-solid fa-wand-magic-sparkles"></i>',
      tags: ["#WebGL", "#CanvasAPI", "#InteractiveDesign", "#Figma"],
      color: "#db2777"
    },
    eng: {
      title: "Distributed Engines & WASM",
      description: "Perfect for core system engineers. Construct lightweight compilers, WASM microkernels, decentralized systems, WebSockets servers, or custom DB engines.",
      icon: '<i class="fa-solid fa-server"></i>',
      tags: ["#WASM", "#Rust", "#DistributedSystems", "#Compilers"],
      color: "#7c3aed"
    }
  };

  function updateTrackRecommendation() {
    const wDesign = parseInt(sliderDesign.value);
    const wEng = parseInt(sliderEng.value);
    const wAI = parseInt(sliderAI.value);
    
    // Update textual indicators
    valDesign.textContent = `${wDesign}%`;
    valEng.textContent = `${wEng}%`;
    valAI.textContent = `${wAI}%`;
    
    // Update indicator fills
    fillDesign.style.width = `${wDesign}%`;
    fillEng.style.width = `${wEng}%`;
    fillAI.style.width = `${wAI}%`;
    
    // Decide which category holds highest score
    let maxCategory = 'eng';
    let maxVal = wEng;
    
    if (wDesign > maxVal) {
      maxVal = wDesign;
      maxCategory = 'design';
    }
    if (wAI > maxVal) {
      maxVal = wAI;
      maxCategory = 'ai';
    }
    
    // Apply changes with quick transition
    const selectedTrack = tracksData[maxCategory];
    
    trackTitle.style.opacity = '0';
    trackDesc.style.opacity = '0';
    trackTags.style.opacity = '0';
    
    setTimeout(() => {
      trackTitle.textContent = selectedTrack.title;
      trackDesc.textContent = selectedTrack.description;
      trackIcon.innerHTML = selectedTrack.icon;
      trackIcon.style.color = selectedTrack.color;
      trackRecommBadge.style.color = selectedTrack.color;
      trackRecommBadge.style.backgroundColor = `${selectedTrack.color}15`;
      
      // Update Tags
      trackTags.innerHTML = '';
      selectedTrack.tags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = tag;
        trackTags.appendChild(span);
      });
      
      // Animate back in
      trackTitle.style.opacity = '1';
      trackDesc.style.opacity = '1';
      trackTags.style.opacity = '1';
    }, 150);
  }

  // Bind input listeners
  [sliderDesign, sliderEng, sliderAI].forEach(slider => {
    if (slider) {
      slider.addEventListener('input', updateTrackRecommendation);
    }
  });

  /* ==========================================================================
     5. BENTO: TIMELINE SECTION SWITCHER
     ========================================================================== */
  const steps = document.querySelectorAll('.timeline-step');
  const details = document.querySelectorAll('.details-item');
  
  steps.forEach(step => {
    step.addEventListener('click', () => {
      // Remove active states
      steps.forEach(s => s.classList.remove('active'));
      details.forEach(d => d.classList.remove('active'));
      
      // Set active to current
      step.classList.add('active');
      const targetStep = step.getAttribute('data-step');
      const activeDetails = document.getElementById(`details-step-${targetStep}`);
      if (activeDetails) {
        activeDetails.classList.add('active');
      }
    });
  });

  /* ==========================================================================
     6. BENTO: TEAM MATCHER (TINDER SIMULATOR)
     ========================================================================== */
  const matchersList = [
    {
      name: "Marcus Aurel",
      role: "Backend Architect",
      skills: ["Rust", "WASM", "Postgres", "Docker"],
      bio: "Systems nerd writing compiler integrations. Looking to build developer tool plugins with instant compilation metrics.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop"
    },
    {
      name: "Sophia Chen",
      role: "AI Researcher",
      skills: ["PyTorch", "Python", "LangChain", "VectorDBs"],
      bio: "M.S. in Machine Learning. Designing lightweight local LLM execution rigs for browser tabs. Want a UI collaborator.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop"
    },
    {
      name: "Liam O'Connor",
      role: "Fullstack Web",
      skills: ["NextJS", "TypeScript", "Tailwind", "Vercel"],
      bio: "Freelance creator. Built 4 production SaaS products. Fast iterator, seeking code designers to build fine-tuned CSS arts.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop"
    },
    {
      name: "Elena Rostova",
      role: "Product Designer",
      skills: ["Figma", "WebGL", "Spline", "CSS3"],
      bio: "Figma community creator. Designing high-fidelity interactive glassmorphism systems. Let's make something beautiful.",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop"
    }
  ];

  let currentProfileIndex = 0;
  const matchCard = document.getElementById('matcher-card');
  const matchImg = document.getElementById('matcher-img');
  const matchName = document.getElementById('matcher-name');
  const matchRole = document.getElementById('matcher-role');
  const matchSkills = document.getElementById('matcher-skills');
  const matchBio = document.getElementById('matcher-bio');
  
  const likeBtn = document.getElementById('matcher-like');
  const dislikeBtn = document.getElementById('matcher-dislike');
  const matchAlert = document.getElementById('matcher-match-alert');

  function renderProfile(index) {
    const profile = matchersList[index % matchersList.length];
    
    // Set text details
    matchImg.src = profile.avatar;
    matchName.textContent = profile.name;
    matchRole.textContent = profile.role;
    matchBio.textContent = profile.bio;
    
    // Render Skills tags
    matchSkills.innerHTML = '';
    profile.skills.forEach(skill => {
      const span = document.createElement('span');
      span.textContent = skill;
      matchSkills.appendChild(span);
    });
  }

  function handleSwipe(direction) {
    if (!matchCard) return;
    
    // Apply swipe class transform
    if (direction === 'like') {
      matchCard.classList.add('swipe-right-anim');
      
      // Trigger a visual Match notification randomly or for certain cards
      setTimeout(() => {
        matchAlert?.classList.add('active');
      }, 200);
      
      setTimeout(() => {
        matchAlert?.classList.remove('active');
        currentProfileIndex++;
        renderProfile(currentProfileIndex);
        matchCard.className = 'matcher-swipe-card'; // Reset
      }, 1400);
      
    } else {
      matchCard.classList.add('swipe-left-anim');
      
      setTimeout(() => {
        currentProfileIndex++;
        renderProfile(currentProfileIndex);
        matchCard.className = 'matcher-swipe-card'; // Reset
      }, 400);
    }
  }

  if (likeBtn && dislikeBtn && matchCard) {
    likeBtn.addEventListener('click', () => handleSwipe('like'));
    dislikeBtn.addEventListener('click', () => handleSwipe('dislike'));
  }

  /* ==========================================================================
     7. BENTO: CLI CONSOLE INTERACTION
     ========================================================================== */
  const cliBtns = document.querySelectorAll('.cli-btn');
  const cliCommand = document.getElementById('cli-command');
  const cliOutput = document.getElementById('cli-output');

  const cliCommandsData = {
    init: {
      cmd: "aether init",
      output: "✓ Workspace successfully setup! Type \"dev\" to begin."
    },
    dev: {
      cmd: "aether dev",
      output: "⚙ Spinning up local bundlers...\n✓ Dev server listening on port 3000.\n✓ Watching files for changes... [OK]"
    },
    deploy: {
      cmd: "aether deploy",
      output: "⚡ Analysing assets structure...\n✓ Verification pipeline: passed\n🚀 Shipped to Aether Edge: https://aether.build/ae-9402x"
    }
  };

  cliBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active classes
      cliBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const cmdKey = btn.getAttribute('data-cmd');
      const data = cliCommandsData[cmdKey];
      
      if (cliCommand && cliOutput && data) {
        // Quick visual blink animation for output
        cliOutput.style.opacity = '0';
        cliCommand.textContent = data.cmd;
        
        setTimeout(() => {
          cliOutput.textContent = data.output;
          cliOutput.style.opacity = '1';
        }, 150);
      }
    });
  });

  /* ==========================================================================
     8. 3D CARD PARALLAX TILT EFFECT
     ========================================================================== */
  const tiltCards = document.querySelectorAll('.tilt-target, .project-card, .control-panel');
  
  // Process only if mouse interactions are enabled/supported
  if (window.matchMedia('(hover: hover)').matches) {
    tiltCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        
        // Mouse coordinate offsets relative to center
        const x = e.clientX - rect.left - rect.width/2;
        const y = e.clientY - rect.top - rect.height/2;
        
        // Degrees mapping
        const rotateY = (x / (rect.width/2)) * 6; // Max 6deg
        const rotateX = -(y / (rect.height/2)) * 6; // Max 6deg
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        card.style.transition = 'transform 0.08s ease-out';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      });
    });
  }

  /* ==========================================================================
     9. ACCORDION / FAQ EXPAND CONTROLS
     ========================================================================== */
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const body = item.querySelector('.accordion-body');
      const isOpen = item.classList.contains('active');
      
      // Close all items
      document.querySelectorAll('.accordion-item').forEach(acc => {
        acc.classList.remove('active');
        acc.querySelector('.accordion-body').style.maxHeight = null;
      });
      
      // If it wasn't open, open it
      if (!isOpen) {
        item.classList.add('active');
        // Set dynamic height from content scrollHeight
        body.style.maxHeight = `${body.scrollHeight}px`;
      }
    });
  });

  /* ==========================================================================
     10. HISTORIC SUBMISSIONS FILTERS
     ========================================================================== */
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Set active button
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filterCategory = btn.getAttribute('data-filter');
      
      projectCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        
        if (filterCategory === 'all' || cardCategory === filterCategory) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });
});
