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
  const detailSidebarRegEnd = document.getElementById('detail-sidebar-reg-end');
  const detailSidebarSubmitEnd = document.getElementById('detail-sidebar-submit-end');
  const detailSidebarWinnerDate = document.getElementById('detail-sidebar-winner-date');
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

    detailDatesTop.textContent    = `${formatDateShort(cohort.start_date)} - ${formatDateShort(cohort.end_date)}`;
    detailSidebarRegEnd.textContent = formatDateFull(cohort.registration_end_date || cohort.start_date);
    detailSidebarStart.textContent = formatDateFull(cohort.start_date);
    detailSidebarSubmitEnd.textContent = formatDateFull(cohort.submission_end_date || cohort.end_date);
    detailSidebarEnd.textContent   = formatDateFull(cohort.end_date);
    detailSidebarWinnerDate.textContent = formatDateFull(cohort.winner_announcement_date || cohort.end_date);

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
      const regDeadline = cohort.registration_end_date || cohort.start_date;
      if (cohort && regDeadline) {
        const parts = regDeadline.split('-');
        const targetDate = new Date(parts[0], parts[1] - 1, parts[2]); // local midnight of deadline
        if (new Date().getTime() >= targetDate.getTime()) {
          btnSidebarApply.textContent = 'Registration Closed';
          btnSidebarApply.className   = 'btn-primary btn-apply-now btn-closed';
          btnSidebarApply.disabled    = true;
          return;
        }
      }
      btnSidebarApply.textContent = 'Submit Idea';
      btnSidebarApply.className   = 'btn-primary btn-apply-now';
      btnSidebarApply.disabled    = false;
      return;
    }

    // Fetch live status from Supabase
    const { data } = await supabaseClient
      .from('registrations')
      .select('*')
      .eq('id', regId)
      .single();

    if (!data) {
      // Record gone — clear local
      localStorage.removeItem(`reg_id_cohort_${cohortId}`);
      const regDeadline = cohort.registration_end_date || cohort.start_date;
      if (cohort && regDeadline) {
        const parts = regDeadline.split('-');
        const targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
        if (new Date().getTime() >= targetDate.getTime()) {
          btnSidebarApply.textContent = 'Registration Closed';
          btnSidebarApply.className   = 'btn-primary btn-apply-now btn-closed';
          btnSidebarApply.disabled    = true;
          return;
        }
      }
      btnSidebarApply.textContent = 'Submit Idea';
      btnSidebarApply.disabled    = false;
      return;
    }

    // Store globally for submission check
    window.currentRegistration = data;

    const status = data.status;
    const isFeePaid = data.fee_paid || parseInt(cohort.price) === 0;

    // Check if idea is rejected
    if (status === 'rejected') {
      btnSidebarApply.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Idea Rejected';
      btnSidebarApply.className = 'btn-primary btn-apply-now btn-rejected';
      btnSidebarApply.disabled  = true;
      return;
    }

    // Check if idea is pending approval
    if (status === 'pending') {
      btnSidebarApply.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> Pending Idea Approval';
      btnSidebarApply.className = 'btn-primary btn-apply-now btn-pending';
      btnSidebarApply.disabled  = true;
      return;
    }

    // If status is approved but payment is not verified/made yet
    if (status === 'approved' || status === 'payment_submitted') {
      if (status === 'payment_submitted') {
        btnSidebarApply.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> Awaiting Payment Verification';
        btnSidebarApply.className = 'btn-primary btn-apply-now btn-pending';
        btnSidebarApply.disabled  = true;
      } else {
        // Complete Payment (Only if paid cohort)
        if (parseInt(cohort.price) > 0) {
          btnSidebarApply.innerHTML = '<i class="fa-solid fa-credit-card"></i> Complete Payment';
          btnSidebarApply.className = 'btn-primary btn-apply-now';
          btnSidebarApply.disabled  = false;
        } else {
          // If Free cohort, auto-update registration to 'registered' and verify it in Supabase
          await supabaseClient
            .from('registrations')
            .update({ status: 'registered', fee_paid: true })
            .eq('id', regId);
          window.location.reload();
        }
      }
      return;
    }

    // If status is registered (Idea approved and payment verified)
    if (status === 'registered' || (status === 'approved' && isFeePaid)) {
      if (data.project_submitted) {
        btnSidebarApply.innerHTML = '<i class="fa-solid fa-circle-check"></i> Project Submitted ✓';
        btnSidebarApply.className = 'btn-primary btn-apply-now btn-approved';
        btnSidebarApply.disabled  = true;
        
        // Show read-only project submission details inside sidebar
        renderProjectSubmittedDetails(data);
      } else {
        // Check if submission timeline is open
        const submitDeadline = cohort.submission_end_date || cohort.end_date;
        if (cohort && submitDeadline) {
          const parts = submitDeadline.split('-');
          const targetDate = new Date(parts[0], parts[1] - 1, parts[2]); // local midnight of deadline
          // Give 24 hour buffer to the day of submission deadline
          targetDate.setDate(targetDate.getDate() + 1);
          
          if (new Date().getTime() >= targetDate.getTime()) {
            btnSidebarApply.textContent = 'Submission Deadline Passed';
            btnSidebarApply.className   = 'btn-primary btn-apply-now btn-closed';
            btnSidebarApply.disabled    = true;
            return;
          }
        }
        
        btnSidebarApply.innerHTML = '<i class="fa-solid fa-rocket"></i> Submit Project';
        btnSidebarApply.className = 'btn-primary btn-apply-now';
        btnSidebarApply.disabled  = false;
      }
    }
  }

  function renderProjectSubmittedDetails(reg) {
    // Remove if already exists
    const oldDetails = document.getElementById('submitted-project-sidebar-details');
    if (oldDetails) oldDetails.remove();

    const detailBox = document.createElement('div');
    detailBox.id = 'submitted-project-sidebar-details';
    detailBox.className = 'confirm-details-box';
    detailBox.style.marginTop = '15px';
    detailBox.style.textAlign = 'left';
    detailBox.style.padding = '12px';
    detailBox.style.background = 'var(--bg-secondary)';
    detailBox.style.border = '1px solid var(--border-color)';
    detailBox.style.borderRadius = '10px';
    
    let liveUrlHTML = '';
    if (reg.project_live) {
      liveUrlHTML = `<div class="confirm-row" style="margin-top:4px;"><span>Live App</span><strong style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><a href="${reg.project_live}" target="_blank" style="color:var(--accent-blue);text-decoration:none;">Open Link <i class="fa-solid fa-up-right-from-square" style="font-size:0.7rem;"></i></a></strong></div>`;
    }

    detailBox.innerHTML = `
      <div style="font-size:0.72rem;font-weight:700;color:var(--text-secondary);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;"><i class="fa-solid fa-code"></i> Submitted Build</div>
      <div class="confirm-row"><span>Name</span><strong>${reg.project_name}</strong></div>
      <div class="confirm-row" style="margin-top:4px;"><span>GitHub</span><strong style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><a href="${reg.project_github}" target="_blank" style="color:var(--accent-blue);text-decoration:none;">View Repo <i class="fa-brands fa-github"></i></a></strong></div>
      ${liveUrlHTML}
    `;
    
    const sidebarCard = document.querySelector('.sticky-sidebar-card');
    if (sidebarCard) {
      // Insert before share button
      const shareBtn = document.getElementById('btn-sidebar-share');
      if (sidebarCard && shareBtn) {
        sidebarCard.insertBefore(detailBox, shareBtn);
      } else if (sidebarCard) {
        sidebarCard.appendChild(detailBox);
      }
    }
  }

  /* ==========================================================================
     REGISTRATION COUNTDOWN TIMER
  ========================================================================== */
  let countdownInterval = null;

  function startCountdown() {
    const regDeadline = cohort?.registration_end_date || cohort?.start_date;
    if (!cohort || !regDeadline) return;

    const countdownContainer = document.getElementById('countdown-container');
    const daysEl = document.getElementById('countdown-days');
    const hoursEl = document.getElementById('countdown-hours');
    const minutesEl = document.getElementById('countdown-minutes');
    const secondsEl = document.getElementById('countdown-seconds');
    const titleEl = document.querySelector('#countdown-container .countdown-title');

    const parts = regDeadline.split('-');
    const targetDate = new Date(parts[0], parts[1] - 1, parts[2]); // local midnight of deadline
    
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

  // Custom modals & UPI config
  const ADMIN_UPI_ID = "vishnu@upi";
  
  const paymentModal = document.getElementById('payment-modal');
  const btnClosePaymentX = document.getElementById('btn-close-payment-x');
  const btnClosePayment = document.getElementById('btn-close-payment');
  const btnSubmitPayment = document.getElementById('btn-submit-payment');
  const paymentAmountPaid = document.getElementById('payment-amount-paid');
  const paymentUtr = document.getElementById('payment-utr');
  const btnCopyUpiId = document.getElementById('btn-copy-upi-id');
  const paymentDueDisplay = document.getElementById('payment-due-display');

  const projectSubmitModal = document.getElementById('project-submit-modal');
  const btnCloseProjectX = document.getElementById('btn-close-project-x');
  const btnCloseProject = document.getElementById('btn-close-project');
  const btnSubmitProject = document.getElementById('btn-submit-project');
  const projectNameInput = document.getElementById('project-name-input');
  const projectDescInput = document.getElementById('project-desc-input');
  const projectGithubInput = document.getElementById('project-github-input');
  const projectLiveInput = document.getElementById('project-live-input');

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

  // Open wizard or modal depending on state
  btnSidebarApply.addEventListener('click', () => {
    if (!cohort) return;
    if (btnSidebarApply.disabled) return;

    const btnText = btnSidebarApply.textContent.trim();

    if (btnText.includes('Submit Idea') || btnText.includes('Apply Now')) {
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
      
      // Update wizard submit button text for step 1
      const step1NextBtn = document.getElementById('btn-step1-next');
      if (step1NextBtn) {
        step1NextBtn.innerHTML = 'Submit Idea <i class="fa-solid fa-paper-plane"></i>';
      }

      regModal.classList.add('active');
    } else if (btnText.includes('Complete Payment')) {
      // Open UPI Payment Modal
      const upiIdSpan = document.getElementById('payment-upi-id');
      if (upiIdSpan) upiIdSpan.textContent = ADMIN_UPI_ID;
      
      if (paymentDueDisplay) paymentDueDisplay.textContent = `₹${cohort.price}`;
      if (paymentAmountPaid) paymentAmountPaid.value = cohort.price;
      if (paymentUtr) paymentUtr.value = '';
      
      document.querySelectorAll('#payment-modal .form-group').forEach(g => g.classList.remove('invalid'));
      paymentModal.classList.add('active');
    } else if (btnText.includes('Submit Project')) {
      // Open Project Submission Modal
      if (projectNameInput) projectNameInput.value = '';
      if (projectDescInput) projectDescInput.value = '';
      if (projectGithubInput) projectGithubInput.value = '';
      if (projectLiveInput) projectLiveInput.value = '';
      
      document.querySelectorAll('#project-submit-modal .form-group').forEach(g => g.classList.remove('invalid'));
      projectSubmitModal.classList.add('active');
    }
  });

  // Close Registration Wizard
  const closeModal = () => regModal.classList.remove('active');
  [btnCloseModal, btnCloseModalX].forEach(btn => btn.addEventListener('click', closeModal));
  regModal.addEventListener('click', e => { if (e.target === regModal) closeModal(); });

  // Close Custom Modals
  const closePaymentModal = () => paymentModal.classList.remove('active');
  [btnClosePayment, btnClosePaymentX].forEach(btn => btn.addEventListener('click', closePaymentModal));
  paymentModal.addEventListener('click', e => { if (e.target === paymentModal) closePaymentModal(); });

  const closeProjectModal = () => projectSubmitModal.classList.remove('active');
  [btnCloseProject, btnCloseProjectX].forEach(btn => btn.addEventListener('click', closeProjectModal));
  projectSubmitModal.addEventListener('click', e => { if (e.target === projectSubmitModal) closeProjectModal(); });

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

  document.getElementById('btn-step1-next').addEventListener('click', async () => {
    if (!validateStep1()) return;

    const nextBtn = document.getElementById('btn-step1-next');
    nextBtn.disabled = true;
    nextBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

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

    // Save to Supabase (Initial Idea Pitch stage)
    const { data, error } = await supabaseClient
      .from('registrations')
      .insert({
        hackathon_id:     cohortId,
        team_name:        wizardData.teamName,
        idea_title:       wizardData.ideaTitle,
        idea_description: wizardData.ideaDesc,
        members:          wizardData.members,
        fee_paid:         false,
        status:           'pending'
      })
      .select()
      .single();

    nextBtn.disabled = false;
    nextBtn.innerHTML = 'Submit Idea <i class="fa-solid fa-paper-plane"></i>';

    if (error) {
      console.error('Error saving idea registration:', error);
      alert('Failed to submit idea. Please try again.');
      return;
    }

    // Store registration ID locally for status checks
    localStorage.setItem(`reg_id_cohort_${cohortId}`, data.id);

    // Populate confirmation step panel
    confirmTeamName.textContent  = wizardData.teamName;
    confirmIdeaTitle.textContent = wizardData.ideaTitle;
    
    // Set confirmation step panel context text for idea stage
    const confirmTitleEl = document.querySelector('#step-panel-3 .confirm-title');
    const confirmSubEl = document.querySelector('#step-panel-3 .confirm-subtitle');
    const confirmBadgeEl = document.querySelector('#step-panel-3 .status-badge');
    
    if (confirmTitleEl) confirmTitleEl.textContent = "Idea Submitted!";
    if (confirmSubEl) confirmSubEl.textContent = "Your team's idea has been submitted. Once the admin reviews and approves your idea, you will be prompted to make the registration payment.";
    if (confirmBadgeEl) {
      confirmBadgeEl.className = "status-badge pending";
      confirmBadgeEl.innerHTML = "&#8987; Pending Approval";
    }

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

  /* --- Custom Modals: Copy UPI ID, Payment Submission, Project Submission --- */
  if (btnCopyUpiId) {
    btnCopyUpiId.addEventListener('click', () => {
      navigator.clipboard.writeText(ADMIN_UPI_ID).then(() => {
        btnCopyUpiId.innerHTML = '<i class="fa-solid fa-check" style="color: var(--accent-green);"></i>';
        setTimeout(() => {
          btnCopyUpiId.innerHTML = '<i class="fa-solid fa-copy"></i>';
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy UPI ID:', err);
      });
    });
  }

  if (btnSubmitPayment) {
    btnSubmitPayment.addEventListener('click', async () => {
      const regId = localStorage.getItem(`reg_id_cohort_${cohortId}`);
      if (!regId) return;

      let isValid = true;
      const amount = parseFloat(paymentAmountPaid.value);
      const utr = paymentUtr.value.trim();

      const amountGroup = paymentAmountPaid.closest('.form-group');
      const utrGroup = paymentUtr.closest('.form-group');

      const amountError = document.getElementById('error-payment-amount');
      const utrError = document.getElementById('error-payment-utr');

      if (isNaN(amount) || amount <= 0) {
        if (amountGroup) amountGroup.classList.add('invalid');
        if (amountError) amountError.style.display = 'block';
        isValid = false;
      } else {
        if (amountGroup) amountGroup.classList.remove('invalid');
        if (amountError) amountError.style.display = 'none';
      }

      if (!utr) {
        if (utrGroup) utrGroup.classList.add('invalid');
        if (utrError) utrError.style.display = 'block';
        isValid = false;
      } else {
        if (utrGroup) utrGroup.classList.remove('invalid');
        if (utrError) utrError.style.display = 'none';
      }

      if (!isValid) return;

      btnSubmitPayment.disabled = true;
      btnSubmitPayment.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

      const { error } = await supabaseClient
        .from('registrations')
        .update({
          amount_paid: amount,
          transaction_ref: utr,
          status: 'payment_submitted'
        })
        .eq('id', regId);

      btnSubmitPayment.disabled = false;
      btnSubmitPayment.textContent = 'Submit Details';

      if (error) {
        console.error('Error submitting payment details:', error);
        alert('Failed to submit payment details. Please try again.');
        return;
      }

      paymentModal.classList.remove('active');
      await updateApplyButtonState();

      // Show success toast
      if (toastSuccess) {
        const toastTitle = toastSuccess.querySelector('h4');
        const toastText = toastSuccess.querySelector('p');
        if (toastTitle) toastTitle.textContent = 'Payment Details Submitted!';
        if (toastText) toastText.textContent = 'Your payment reference is under review. Check back soon for registration verification.';
        toastSuccess.classList.add('active');
        setTimeout(() => {
          toastSuccess.classList.remove('active');
          // reset text to default
          if (toastTitle) toastTitle.textContent = 'Application Submitted!';
          if (toastText) toastText.textContent = 'Pending admin review. Check back soon for approval status.';
        }, 4000);
      }
    });
  }

  if (btnSubmitProject) {
    btnSubmitProject.addEventListener('click', async () => {
      const regId = localStorage.getItem(`reg_id_cohort_${cohortId}`);
      if (!regId) return;

      let isValid = true;
      const name = projectNameInput.value.trim();
      const desc = projectDescInput.value.trim();
      const github = projectGithubInput.value.trim();
      const live = projectLiveInput.value.trim();

      const setFieldInvalid = (inputEl, bad) => {
        if (!inputEl) return;
        const group = inputEl.closest('.form-group');
        if (group) group.classList.toggle('invalid', bad);
        const err = group ? group.querySelector('.error-msg') : null;
        if (err) err.style.display = bad ? 'block' : 'none';
        if (bad) isValid = false;
      };

      setFieldInvalid(projectNameInput, !name);
      setFieldInvalid(projectDescInput, !desc);

      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      const isGithubOk = github && urlPattern.test(github);
      setFieldInvalid(projectGithubInput, !isGithubOk);

      const isLiveOk = !live || urlPattern.test(live);
      setFieldInvalid(projectLiveInput, !isLiveOk);

      if (!isValid) return;

      btnSubmitProject.disabled = true;
      btnSubmitProject.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

      const { error } = await supabaseClient
        .from('registrations')
        .update({
          project_submitted: true,
          project_name: name,
          project_description: desc,
          project_github: github,
          project_live: live || null,
          project_submitted_at: new Date().toISOString()
        })
        .eq('id', regId);

      btnSubmitProject.disabled = false;
      btnSubmitProject.textContent = 'Deploy Submission';

      if (error) {
        console.error('Error submitting project:', error);
        alert('Failed to submit project. Please try again.');
        return;
      }

      projectSubmitModal.classList.remove('active');
      await updateApplyButtonState();

      // Show success toast
      if (toastSuccess) {
        const toastTitle = toastSuccess.querySelector('h4');
        const toastText = toastSuccess.querySelector('p');
        if (toastTitle) toastTitle.textContent = 'Project Submitted!';
        if (toastText) toastText.textContent = 'Your project submission was successful. Good luck!';
        toastSuccess.classList.add('active');
        setTimeout(() => {
          toastSuccess.classList.remove('active');
          if (toastTitle) toastTitle.textContent = 'Application Submitted!';
          if (toastText) toastText.textContent = 'Pending admin review. Check back soon for approval status.';
        }, 4000);
      }
    });
  }

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
