/**
 * HACKATEER Explore Hacks Page Logic
 * Implements category filtering, blueprints grid banner slides, clocks, and RSVP modals.
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // Auth Guard Guarding Explore Portal
  HackateerAuth.checkAuthState(
    (user) => {
      // Show screen
      document.body.style.display = 'block';
      loadCustomHackathons();
    },
    () => {
      // Not authenticated -> send to gateway
      window.location.href = 'login.html';
    }
  );
  
  // Load and render custom hackathons from Supabase
  async function loadCustomHackathons() {
    const grid = document.getElementById('explore-grid-container');
    if (!grid) return;
    
    const { data: customHacks, error } = await supabaseClient
      .from('hackathons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching hackathons:', error);
      return;
    }

    // Dynamic count initializer is removed

    grid.innerHTML = ''; // clear initial content

    function formatRegistrations(count) {
      if (!count) return '1.4K';
      if (count >= 1000) {
        return (count / 1000).toFixed(1).replace('.0', '') + 'K';
      }
      return count;
    }

    customHacks.forEach((hack) => {
      const card = document.createElement('div');
      card.className = 'explore-card';
      card.setAttribute('data-category', hack.theme ? hack.theme.toLowerCase() : 'ai');
      
      let logoIcon = 'fa-solid fa-code';
      const primaryTag = (hack.themes && hack.themes.length > 0) ? hack.themes[0].toLowerCase() : (hack.theme ? hack.theme.toLowerCase() : 'ai');
      
      if (primaryTag.includes('web3') || primaryTag.includes('key') || primaryTag.includes('crypto') || primaryTag.includes('zk') || primaryTag.includes('solana') || primaryTag.includes('eth') || primaryTag.includes('chain')) {
        logoIcon = 'fa-solid fa-key';
      } else if (primaryTag.includes('design') || primaryTag.includes('ui') || primaryTag.includes('ux') || primaryTag.includes('visual') || primaryTag.includes('canvas') || primaryTag.includes('front')) {
        logoIcon = 'fa-solid fa-bezier-curve';
      } else if (primaryTag.includes('open') || primaryTag.includes('github') || primaryTag.includes('git') || primaryTag.includes('oss')) {
        logoIcon = 'fa-brands fa-github';
      } else if (primaryTag.includes('ai') || primaryTag.includes('agent') || primaryTag.includes('neural') || primaryTag.includes('learn') || primaryTag.includes('auto')) {
        logoIcon = 'fa-solid fa-robot';
      }
      
      const priceText = hack.price > 0 ? `₹${hack.price}` : 'Free';
      const prizePoolText = hack.prize_pool > 0 ? `₹${Number(hack.prize_pool).toLocaleString('en-IN')}` : '₹0';
      
      card.innerHTML = `
        <div class="card-left-col">
          <span class="card-eyebrow">${primaryTag.toUpperCase()}</span>
          <h3 class="card-title">${hack.name}</h3>
          <div class="card-meta">
            <span class="host">${hack.host || 'Admin Managed'}</span>
            <span class="separator">•</span>
            <span class="dates">${formatDate(hack.start_date)} - ${formatDate(hack.end_date)}</span>
          </div>
          
          <div class="card-features">
            <div class="feature-item">
              <i class="fa-solid fa-rocket feature-icon"></i>
              <div class="feature-text">
                <span class="feature-title">BUILD IN PUBLIC</span>
                <span class="feature-desc">Share progress</span>
              </div>
            </div>
            <div class="feature-item">
              <i class="fa-solid fa-trophy feature-icon"></i>
              <div class="feature-text">
                <span class="feature-title">EARN REWARDS</span>
                <span class="feature-desc">Win prizes</span>
              </div>
            </div>
            <div class="feature-item">
              <i class="fa-solid fa-users feature-icon"></i>
              <div class="feature-text">
                <span class="feature-title">COLLABORATE</span>
                <span class="feature-desc">Work with teams</span>
              </div>
            </div>
          </div>
        </div>
        <div class="card-right-col">
          <div class="card-illustration-container">
            <img class="card-illustration" src="${hack.image_url}" alt="${hack.name} Cover">
          </div>
          <div class="card-right-bottom">
            <button class="btn-share-event" title="Copy Share Link">
              <i class="fa-solid fa-share-nodes"></i>
            </button>
          </div>
        </div>
      `;

      // Navigate to details page on card click
      card.addEventListener('click', () => {
        window.location.href = `details.html?id=${hack.id}`;
      });

      // Stop propagation and navigate on register button click
      const regBtn = card.querySelector('.btn-join-event');
      if (regBtn) {
        regBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          window.location.href = `details.html?id=${hack.id}`;
        });
      }

      // Share button click handler
      const shareBtn = card.querySelector('.btn-share-event');
      if (shareBtn) {
        shareBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const shareUrl = `${window.location.origin}/details.html?id=${hack.id}`;
          navigator.clipboard.writeText(shareUrl).then(() => {
            shareBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
            shareBtn.classList.add('copied');
            setTimeout(() => {
              shareBtn.innerHTML = '<i class="fa-solid fa-share-nodes"></i>';
              shareBtn.classList.remove('copied');
            }, 2000);
          }).catch(err => {
            console.error('Failed to copy link: ', err);
          });
        });
      }

      grid.appendChild(card);
    });

    // Re-attach hover tags to newly created DOM elements
    attachCursorHover(document.querySelectorAll('.explore-card, .btn-join-event'));
  }

  function formatDate(dateString) {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  }

  // Prepend custom cohorts to explore grid: already initiated by Auth Guard

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
    
    if (cursor) {
      cursor.style.left = `${mouseX}px`;
      cursor.style.top = `${mouseY}px`;
    }
  });
  
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
  
  // Hover effects
  function attachCursorHover(elements) {
    elements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor?.classList.add('hovered');
        follower?.classList.add('hovered');
      });
      el.addEventListener('mouseleave', () => {
        cursor?.classList.remove('hovered');
        follower?.classList.remove('hovered');
      });
    });
  }
  attachCursorHover(document.querySelectorAll('a, button, input, .filter-pill, .btn-join-event, .dot, .explore-card'));

  /* ==========================================================================
     2. LIVE CLOCK
     ========================================================================== */
  const clockElement = document.getElementById('live-clock');
  
  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    if (clockElement) {
      clockElement.textContent = `${hours}:${minutes}`;
    }
  }
  updateClock();
  setInterval(updateClock, 1000);

  /* ==========================================================================
     3. SLIDER BANNER CAROUSEL
     ========================================================================== */
  const track = document.getElementById('carousel-track');
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dots .dot');
  
  let currentSlide = 0;
  const totalSlides = slides.length;
  let autoSlideTimer;

  function goToSlide(index) {
    currentSlide = (index + totalSlides) % totalSlides;
    
    if (track) {
      // Translate track (each slide takes 33.33% since track is 300% wide for 3 slides)
      const translateAmount = currentSlide * 33.333;
      track.style.transform = `translateX(-${translateAmount}%)`;
    }
    
    // Update active states
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === currentSlide);
    });
    
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
    });
  }

  function startAutoSlide() {
    autoSlideTimer = setInterval(() => {
      goToSlide(currentSlide + 1);
    }, 6000);
  }

  function resetAutoSlide() {
    clearInterval(autoSlideTimer);
    startAutoSlide();
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const targetIndex = parseInt(dot.getAttribute('data-index'));
      goToSlide(targetIndex);
      resetAutoSlide();
    });
  });

  // Start sliding on load
  if (slides.length > 0) {
    startAutoSlide();
  }

  /* ==========================================================================
     4. EXPLORE HACKATHONS TAB FILTERS & SEARCH
     ========================================================================== */
  const searchInput = document.getElementById('dashboard-search');
  
  let activeCategory = 'all';
  let searchQuery = '';

  function filterExploreGrid() {
    let visibleCount = 0;
    const cards = document.querySelectorAll('.explore-card');
    
    cards.forEach(card => {
      const category = card.getAttribute('data-category');
      const title = card.querySelector('.card-title').textContent.toLowerCase();
      const desc = card.querySelector('.card-desc').textContent.toLowerCase();
      
      const categoryMatches = (activeCategory === 'all' || category === activeCategory);
      const searchMatches = (searchQuery === '' || title.includes(searchQuery) || desc.includes(searchQuery));
      
      if (categoryMatches && searchMatches) {
        card.style.display = 'flex';
        visibleCount++;
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'scale(1)';
        }, 50);
      } else {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
          card.style.display = 'none';
        }, 200);
      }
    });
    
    // Filter count badge updates removed
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      filterExploreGrid();
    });
  }

  /* ==========================================================================
     5. JOIN HACKATHON & RSVP MODALS
     ========================================================================== */
  const rsvpModal = document.getElementById('rsvp-modal');
  const btnCloseModal = document.querySelector('.btn-close-modal');
  const joinBtns = document.querySelectorAll('.btn-join-event');

  // Close RSVP Modal
  if (btnCloseModal && rsvpModal) {
    btnCloseModal.addEventListener('click', () => {
      rsvpModal.classList.remove('active');
    });
    
    rsvpModal.addEventListener('click', (e) => {
      if (e.target === rsvpModal) {
        rsvpModal.classList.remove('active');
      }
    });
  }

  // Join button functionality is handled directly on card/register clicks inside loadCustomHackathons() to navigate to details page.

});
