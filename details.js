/**
 * AETHER Cohort Details Page Logic
 * 3-step registration wizard: Team+Idea → Fee → Confirm
 * Registrations stored in Supabase `registrations` table.
 * Admin can approve/reject each team based on their idea.
 */

document.addEventListener('DOMContentLoaded', () => {

  // Auth Guard
  AetherAuth.checkAuthState(
    (user) => {
      document.body.style.display = 'block';
      initCohortDetails();
    },
    () => {
      window.location.href = 'login.html';
    }
  );

  // Parse URL
  const urlParams = new URLSearchParams(window.location.search);
  const cohortId = parseInt(urlParams.get('id'));
  if (isNaN(cohortId)) {
    window.location.href = 'dashboard.html';
    return;
  }

  let cohort = null;
  let wizardData = {}; // holds collected data across steps

  // DOM elements — page
  const detailTitle       = document.getElementById('detail-title');
  const detailHost        = document.getElementById('detail-host');
  const detailDatesTop    = document.getElementById('detail-dates-top');
  const detailRegCount    = document.getElementById('detail-registered-count');
  const detailCover       = document.getElementById('detail-cover');
  const detailDesc        = document.getElementById('detail-description');
  const detailTracksList  = document.getElementById('detail-tracks-list');
  const detailPrize       = document.getElementById('detail-prize-amount');
  const detailSidebarFee  = document.getElementById('detail-sidebar-fee');
  const detailSidebarTeam = document.getElementById('detail-sidebar-team');
  const detailSidebarStart= document.getElementById('detail-sidebar-start');
  const detailSidebarEnd  = document.getElementById('detail-sidebar-end');
  const btnSidebarApply   = document.getElementById('btn-sidebar-apply');

  /* ==========================================================================
     INIT
  ========================================================================== */
  async function initCohortDetails() {
    const { data, error } = await supabaseClient
      .from('hackathons')
      .select('*')
      .eq('id', cohortId)
      .single();

    if (error || !data) {
      console.error('Error loading cohort:', error);
      window.location.href = 'dashboard.html';
      return;
    }

    cohort = data;

    detailTitle.textContent  = cohort.name;
    detailHost.textContent   = cohort.host || 'Admin Managed';
    detailCover.src          = cohort.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&h=300&fit=crop';
    detailCover.alt          = `${cohort.name} Cover`;
    detailDesc.textContent   = cohort.description;

    const startF = formatDateFull(cohort.start_date);
    const endF   = formatDateFull(cohort.end_date);
    detailDatesTop.textContent    = `${formatDateShort(cohort.start_date)} - ${formatDateShort(cohort.end_date)}`;
    detailSidebarStart.textContent = startF;
    detailSidebarEnd.textContent   = endF;

    const prizeVal = parseInt(cohort.prize_pool) || 0;
    detailPrize.textContent = prizeVal > 0 ? `₹${prizeVal.toLocaleString('en-IN')}` : '₹0';

    const priceVal = parseInt(cohort.price) || 0;
    detailSidebarFee.textContent = priceVal > 0 ? `₹${priceVal}` : 'Free';

    detailSidebarTeam.textContent = `${cohort.team_min || 1} - ${cohort.team_max || 4} Member${(cohort.team_max || 4) > 1 ? 's' : ''}`;

    populateTracks();
    await loadRegisteredCount();
    await updateApplyButtonState();
    startCountdown();
  }

  /* ==========================================================================
     TRACKS
  ========================================================================== */
  function populateTracks() {
    if (!detailTracksList) return;
    detailTracksList.innerHTML = '';
    const themes = (cohort.themes && cohort.themes.length > 0) ? cohort.themes : (cohort.theme ? [cohort.theme] : ['AI Systems']);
    themes.forEach(theme => {
      const box = document.createElement('div');
      box.className = 'track-box';
      box.innerHTML = `<span class="track-box-title">${theme}</span>`;
      detailTracksList.appendChild(box);
    });
  }

  /* ==========================================================================
     REGISTRATION COUNT
  ========================================================================== */
  async function loadRegisteredCount() {
    const { count } = await supabaseClient
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('hackathon_id', cohortId);
    if (detailRegCount) detailRegCount.textContent = count || 0;
  }

  /* ==========================================================================
     APPLY BUTTON STATE — checks Supabase for existing registration
  ========================================================================== */
  async function updateApplyButtonState() {
    const regId = localStorage.getItem(`reg_id_cohort_${cohortId}`);
    if (!regId) {
      if (cohort && cohort.start_date) {
        const parts = cohort.start_date.split('-');
        const targetDate = new Date(parts[0], parts[1] - 1, parts[2]); // local midnight of start_date
        if (new Date().getTime() >= targetDate.getTime()) {
          btnSidebarApply.textContent = 'Registration Closed';
          btnSidebarApply.className   = 'btn-primary btn-apply-now btn-closed';
          btnSidebarApply.disabled    = true;
          return;
        }
      }
      btnSidebarApply.textContent = 'Apply Now';
      btnSidebarApply.className   = 'btn-primary btn-apply-now';
      btnSidebarApply.disabled    = false;
      return;
    }

    // Fetch live status from Supabase
    const { data } = await supabaseClient
      .from('registrations')
      .select('status, team_name, idea_title')
      .eq('id', regId)
      .single();

    if (!data) {
      // Record gone — clear local
      localStorage.removeItem(`reg_id_cohort_${cohortId}`);
      if (cohort && cohort.start_date) {
        const parts = cohort.start_date.split('-');
        const targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
        if (new Date().getTime() >= targetDate.getTime()) {
          btnSidebarApply.textContent = 'Registration Closed';
          btnSidebarApply.className   = 'btn-primary btn-apply-now btn-closed';
          btnSidebarApply.disabled    = true;
          return;
        }
      }
      btnSidebarApply.textContent = 'Apply Now';
      btnSidebarApply.disabled    = false;
      return;
    }

    const status = data.status;
    if (status === 'approved') {
      btnSidebarApply.innerHTML = '<i class="fa-solid fa-circle-check"></i> Approved ✓';
      btnSidebarApply.className = 'btn-primary btn-apply-now btn-approved';
      btnSidebarApply.disabled  = true;
    } else if (status === 'rejected') {
      btnSidebarApply.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Rejected';
      btnSidebarApply.className = 'btn-primary btn-apply-now btn-rejected';
      btnSidebarApply.disabled  = true;
    } else {
      btnSidebarApply.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> Pending Approval';
      btnSidebarApply.className = 'btn-primary btn-apply-now btn-pending';
      btnSidebarApply.disabled  = true;
    }
  }

  /* ==========================================================================
     REGISTRATION COUNTDOWN TIMER
  ========================================================================== */
  let countdownInterval = null;

  function startCountdown() {
    if (!cohort || !cohort.start_date) return;

    const countdownContainer = document.getElementById('countdown-container');
    const daysEl = document.getElementById('countdown-days');
    const hoursEl = document.getElementById('countdown-hours');
    const minutesEl = document.getElementById('countdown-minutes');
    const secondsEl = document.getElementById('countdown-seconds');
    const titleEl = document.querySelector('#countdown-container .countdown-title');

    const parts = cohort.start_date.split('-');
    const targetDate = new Date(parts[0], parts[1] - 1, parts[2]); // local midnight of start_date
    
    if (countdownInterval) clearInterval(countdownInterval);

    function update() {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        clearInterval(countdownInterval);
        if (daysEl) daysEl.textContent = '00';
        if (hoursEl) hoursEl.textContent = '00';
        if (minutesEl) minutesEl.textContent = '00';
        if (secondsEl) secondsEl.textContent = '00';
        if (titleEl) titleEl.textContent = 'REGISTRATION CLOSED';
        if (countdownContainer) countdownContainer.classList.add('closed');
        
        const regId = localStorage.getItem(`reg_id_cohort_${cohortId}`);
        if (!regId && btnSidebarApply) {
          btnSidebarApply.textContent = 'Registration Closed';
          btnSidebarApply.className = 'btn-primary btn-apply-now btn-closed';
          btnSidebarApply.disabled = true;
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
      if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
      if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
    }

    update();
    countdownInterval = setInterval(update, 1000);
  }

  /* ==========================================================================
     WIZARD MODAL
  ========================================================================== */
  const regModal            = document.getElementById('registration-modal');
  const btnCloseModalX      = document.getElementById('btn-close-modal-x');
  const btnCloseModal       = document.getElementById('btn-close-modal');
  const dynamicMembersList  = document.getElementById('dynamic-members-list');
  const btnAddMember        = document.getElementById('btn-add-member');
  const toastSuccess        = document.getElementById('toast-success');

  // Step panels
  const panel1 = document.getElementById('step-panel-1');
  const panel2 = document.getElementById('step-panel-2');
  const panel3 = document.getElementById('step-panel-3');

  // Step indicators
  const ws1 = document.getElementById('ws-1');
  const ws2 = document.getElementById('ws-2');
  const ws3 = document.getElementById('ws-3');
  const wsConn1 = document.getElementById('ws-conn-1');
  const wsConn2 = document.getElementById('ws-conn-2');

  // Step 1 inputs
  const regTeamName  = document.getElementById('reg-team-name');
  const regIdeaTitle = document.getElementById('reg-idea-title');
  const regIdeaDesc  = document.getElementById('reg-idea-desc');

  // Step 2
  const feeHackathonName   = document.getElementById('fee-hackathon-name');
  const feeTeamDisplay     = document.getElementById('fee-team-display');
  const feeAmountDisplay   = document.getElementById('fee-amount-display');
  const feeMethodsSection  = document.getElementById('fee-methods-section');
  const feeFreeNotice      = document.getElementById('fee-free-notice');
  const payBtnText         = document.getElementById('pay-btn-text');

  // Step 3
  const confirmTeamName  = document.getElementById('confirm-team-name');
  const confirmIdeaTitle = document.getElementById('confirm-idea-title');

  let memberIndex = 0;
  let currentStep = 1;

  function setStep(step) {
    currentStep = step;
    [panel1, panel2, panel3].forEach((p, i) => {
      p.classList.toggle('hidden', i + 1 !== step);
    });
    // Update step indicators
    [ws1, ws2, ws3].forEach((ws, i) => {
      ws.classList.remove('active', 'done');
      if (i + 1 < step) ws.classList.add('done');
      if (i + 1 === step) ws.classList.add('active');
    });
    wsConn1.classList.toggle('done', step > 1);
    wsConn2.classList.toggle('done', step > 2);
  }

  // Open wizard
  btnSidebarApply.addEventListener('click', () => {
    if (!cohort) return;
    if (btnSidebarApply.disabled) return;

    // Reset wizard
    regTeamName.value  = '';
    regIdeaTitle.value = '';
    regIdeaDesc.value  = '';
    regTeamName.closest('.form-group').classList.remove('invalid');
    regIdeaTitle.closest('.form-group').classList.remove('invalid');
    regIdeaDesc.closest('.form-group').classList.remove('invalid');
    dynamicMembersList.innerHTML = '';
    memberIndex = 0;
    wizardData  = {};

    // Add minimum members
    const minMembers = cohort.team_min || 1;
    for (let i = 0; i < minMembers; i++) addMemberBlock(i === 0);
    updateAddMemberButtonVis();

    setStep(1);
    regModal.classList.add('active');
  });

  // Close
  const closeModal = () => regModal.classList.remove('active');
  [btnCloseModal, btnCloseModalX].forEach(btn => btn.addEventListener('click', closeModal));
  regModal.addEventListener('click', e => { if (e.target === regModal) closeModal(); });

  /* --- Member Blocks --- */
  function addMemberBlock(isLeader = false) {
    const max = cohort?.team_max || 4;
    if (dynamicMembersList.children.length >= max) return;
    memberIndex++;

    const block = document.createElement('div');
    block.className = 'member-input-block';
    block.setAttribute('data-member-id', memberIndex);

    const min = cohort?.team_min || 1;
    const canRemove = !isLeader && dynamicMembersList.children.length >= min;
    const removeBtn = canRemove ? `<button type="button" class="btn-remove-member"><i class="fa-regular fa-trash-can"></i> Remove</button>` : '';

    block.innerHTML = `
      <div class="member-block-header">
        <h5>MEMBER #${dynamicMembersList.children.length + 1} ${isLeader ? '(Leader)' : ''}</h5>
        ${removeBtn}
      </div>
      <div class="member-fields-grid">
        <div class="form-group">
          <label>Full Name <span class="required">*</span></label>
          <input type="text" class="member-name-input" placeholder="e.g. Linus Torvalds" required>
          <span class="error-msg">Name is required.</span>
        </div>
        <div class="form-group">
          <label>Email Address <span class="required">*</span></label>
          <input type="email" class="member-email-input" placeholder="linus@git.build" required>
          <span class="error-msg">Valid email is required.</span>
        </div>
        <div class="form-group">
          <label>Project Role</label>
          <select class="member-role-select">
            <option value="Lead Developer" ${isLeader ? 'selected' : ''}>Lead Developer</option>
            <option value="Frontend Architect" ${!isLeader ? 'selected' : ''}>Frontend Architect</option>
            <option value="Backend Developer">Backend Developer</option>
            <option value="UI/UX Designer">UI/UX Designer</option>
            <option value="AI Engineer">AI Engineer</option>
            <option value="Cryptographic Auditor">Cryptographic Auditor</option>
          </select>
        </div>
      </div>
    `;

    const rm = block.querySelector('.btn-remove-member');
    if (rm) rm.addEventListener('click', () => {
      block.remove();
      relabelMembers();
      updateAddMemberButtonVis();
    });

    dynamicMembersList.appendChild(block);
    relabelMembers();
    updateAddMemberButtonVis();
    refreshCursorHover();
  }

  function relabelMembers() {
    dynamicMembersList.querySelectorAll('.member-input-block').forEach((b, i) => {
      b.querySelector('h5').textContent = `MEMBER #${i + 1} ${i === 0 ? '(Leader)' : ''}`;
    });
  }

  function updateAddMemberButtonVis() {
    const max = cohort?.team_max || 4;
    const min = cohort?.team_min || 1;
    btnAddMember.style.display = dynamicMembersList.children.length >= max ? 'none' : 'flex';
    const badge = document.getElementById('members-count-badge');
    if (badge) badge.textContent = `(min ${min}, max ${max})`;
  }

  btnAddMember.addEventListener('click', () => addMemberBlock(false));

  /* --- Step 1 Validation & Next --- */
  function validateStep1() {
    let valid = true;
    const setInvalid = (el, bad) => {
      el.closest('.form-group').classList.toggle('invalid', bad);
      if (bad) valid = false;
    };

    setInvalid(regTeamName,  !regTeamName.value.trim());
    setInvalid(regIdeaTitle, !regIdeaTitle.value.trim());
    setInvalid(regIdeaDesc,  regIdeaDesc.value.trim().length < 50);

    dynamicMembersList.querySelectorAll('.member-input-block').forEach(block => {
      const nameEl  = block.querySelector('.member-name-input');
      const emailEl = block.querySelector('.member-email-input');
      setInvalid(nameEl,  !nameEl.value.trim());
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim());
      setInvalid(emailEl, !emailOk);
    });

    return valid;
  }

  document.getElementById('btn-step1-next').addEventListener('click', () => {
    if (!validateStep1()) return;

    const members = [];
    dynamicMembersList.querySelectorAll('.member-input-block').forEach(block => {
      members.push({
        name:  block.querySelector('.member-name-input').value.trim(),
        email: block.querySelector('.member-email-input').value.trim(),
        role:  block.querySelector('.member-role-select').value
      });
    });

    wizardData = {
      teamName:    regTeamName.value.trim(),
      ideaTitle:   regIdeaTitle.value.trim(),
      ideaDesc:    regIdeaDesc.value.trim(),
      members
    };

    // Populate step 2
    const priceVal = parseInt(cohort.price) || 0;
    feeHackathonName.textContent = cohort.name;
    feeTeamDisplay.textContent   = wizardData.teamName;
    feeAmountDisplay.textContent = priceVal > 0 ? `₹${priceVal}` : 'Free';

    if (priceVal === 0) {
      feeMethodsSection.classList.add('hidden');
      feeFreeNotice.classList.remove('hidden');
      payBtnText.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Application';
    } else {
      feeMethodsSection.classList.remove('hidden');
      feeFreeNotice.classList.add('hidden');
      payBtnText.innerHTML = '<i class="fa-solid fa-lock"></i> Pay &amp; Submit';
    }

    setStep(2);
  });

  /* --- Step 2: Back & Pay --- */
  document.getElementById('btn-step2-back').addEventListener('click', () => setStep(1));

  document.getElementById('btn-step2-pay').addEventListener('click', async () => {
    const payBtn = document.getElementById('btn-step2-pay');
    payBtn.disabled = true;
    payBtnText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

    // Simulate payment delay
    const priceVal = parseInt(cohort.price) || 0;
    if (priceVal > 0) await new Promise(r => setTimeout(r, 1200));

    // Save to Supabase
    const { data, error } = await supabaseClient
      .from('registrations')
      .insert({
        hackathon_id:     cohortId,
        team_name:        wizardData.teamName,
        idea_title:       wizardData.ideaTitle,
        idea_description: wizardData.ideaDesc,
        members:          wizardData.members,
        fee_paid:         true,
        status:           'pending'
      })
      .select()
      .single();

    payBtn.disabled = false;
    payBtnText.innerHTML = '<i class="fa-solid fa-lock"></i> Pay &amp; Submit';

    if (error) {
      console.error('Error saving registration:', error);
      alert('Failed to submit. Please try again.');
      return;
    }

    // Store registration ID locally for status checks
    localStorage.setItem(`reg_id_cohort_${cohortId}`, data.id);

    // Populate step 3
    confirmTeamName.textContent  = wizardData.teamName;
    confirmIdeaTitle.textContent = wizardData.ideaTitle;

    setStep(3);

    // Update count in header
    loadRegisteredCount();
  });

  /* --- Step 3: Done --- */
  document.getElementById('btn-step3-done').addEventListener('click', () => {
    closeModal();
    updateApplyButtonState();
    // Show toast
    if (toastSuccess) {
      toastSuccess.classList.add('active');
      setTimeout(() => toastSuccess.classList.remove('active'), 4000);
    }
  });

  /* ==========================================================================
     FORMATTERS
  ========================================================================== */
  function formatDateShort(dateString) {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  }

  function formatDateFull(dateString) {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  /* ==========================================================================
     TABS
  ========================================================================== */
  document.querySelectorAll('.tab-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        const offset = target.getBoundingClientRect().top + window.pageYOffset - 160;
        window.scrollTo({ top: offset, behavior: 'smooth' });
      }
    });
  });

  // Share button event listener
  const btnSidebarShare = document.getElementById('btn-sidebar-share');
  if (btnSidebarShare) {
    btnSidebarShare.addEventListener('click', () => {
      const shareUrl = window.location.href;
      navigator.clipboard.writeText(shareUrl).then(() => {
        btnSidebarShare.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        btnSidebarShare.classList.add('copied');
        
        setTimeout(() => {
          btnSidebarShare.innerHTML = '<i class="fa-solid fa-share-nodes"></i> Share Hackathon';
          btnSidebarShare.classList.remove('copied');
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    });
  }

  /* ==========================================================================
     CUSTOM CURSOR
  ========================================================================== */
  const cursor   = document.querySelector('.custom-cursor');
  const follower = document.querySelector('.custom-cursor-follower');
  let mouseX = 0, mouseY = 0, followerX = 0, followerY = 0;

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
    if (cursor) { cursor.style.left = `${mouseX}px`; cursor.style.top = `${mouseY}px`; }
  });

  function updateFollower() {
    followerX += (mouseX - followerX) * 0.15;
    followerY += (mouseY - followerY) * 0.15;
    if (follower) { follower.style.left = `${followerX}px`; follower.style.top = `${followerY}px`; }
    requestAnimationFrame(updateFollower);
  }
  updateFollower();

  function refreshCursorHover() {
    document.querySelectorAll('a, button, input, select, textarea').forEach(el => {
      el.addEventListener('mouseenter', () => { cursor?.classList.add('hovered'); follower?.classList.add('hovered'); });
      el.addEventListener('mouseleave', () => { cursor?.classList.remove('hovered'); follower?.classList.remove('hovered'); });
    });
  }
  refreshCursorHover();

  /* ==========================================================================
     LIVE CLOCK
  ========================================================================== */
  const clockEl = document.getElementById('live-clock');
  function updateClock() {
    const now = new Date();
    if (clockEl) clockEl.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  }
  updateClock();
  setInterval(updateClock, 60000);

});
