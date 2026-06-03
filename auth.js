// Auth module — no port-based routing. All pages served from the same server.

// Check for logout query parameter to clear local session state in local development
(function() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('logout') === 'true') {
    localStorage.removeItem('aether_mock_user_session');
    // Clean up query param from browser address bar
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);
  }
})();


const MOCK_USER = {
  uid: "dev-sandbox-user-12345",
  displayName: "Alex Developer",
  email: "alex@aether.build",
  photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop"
};

let isRealFirebase = false;

// Check if config exists and is configured
function detectFirebaseConfig() {
  if (typeof firebase === 'undefined' || typeof firebaseConfig === 'undefined') {
    return false;
  }
  const keys = Object.values(firebaseConfig);
  if (keys.length === 0) return false;
  // If keys contain placeholder text, it is not configured
  const isPlaceholder = keys.some(val => typeof val === 'string' && val.includes('YOUR_') && val.includes('_HERE'));
  return !isPlaceholder;
}

// Initialize Firebase if configured
if (detectFirebaseConfig()) {
  try {
    firebase.initializeApp(firebaseConfig);
    isRealFirebase = true;
    console.log("Aether Auth: Firebase initialized successfully.");
  } catch (error) {
    console.warn("Aether Auth: Firebase initialization failed, falling back to Mock Developer Mode.", error);
    isRealFirebase = false;
  }
} else {
  console.log("Aether Auth: No custom Firebase config keys detected. Running in Mock Developer Mode.");
}

/**
 * Expose Authentication Service Methods
 */
const AetherAuth = {
  isFirebaseActive() {
    return isRealFirebase;
  },

  // Perform Google Sign-In (Chrome Profile Sync)
  async signInWithGoogle() {
    if (isRealFirebase) {
      const provider = new firebase.auth.GoogleAuthProvider();
      // Set custom parameter to hint Google account chooser
      provider.setCustomParameters({ prompt: 'select_account' });
      try {
        const result = await firebase.auth().signInWithPopup(provider);
        return result.user;
      } catch (error) {
        console.error("Google Sign-In failed:", error);
        throw error;
      }
    } else {
      // Mock Login Mode
      localStorage.setItem('aether_mock_user_session', JSON.stringify(MOCK_USER));
      return MOCK_USER;
    }
  },

  // Log Out current session
  async signOutUser() {
    if (isRealFirebase) {
      try {
        await firebase.auth().signOut();
      } catch (error) {
        console.error("Firebase Sign-Out failed:", error);
      }
    }
    // Always clear mock session as well
    localStorage.removeItem('aether_mock_user_session');
    
    window.location.href = 'login.html';
  },

  // Checks Auth state and registers listener callbacks
  checkAuthState(onUser, onUnauth) {
    // 1. Check local mock session first
    const mockUserJson = localStorage.getItem('aether_mock_user_session');
    if (mockUserJson) {
      try {
        const user = JSON.parse(mockUserJson);
        onUser(user);
        this.syncHeaderProfile(user);
        return;
      } catch (e) {
        localStorage.removeItem('aether_mock_user_session');
      }
    }

    // 2. Check Firebase if active
    if (isRealFirebase) {
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          onUser(user);
          this.syncHeaderProfile(user);
        } else {
          onUnauth();
        }
      });
    } else {
      // Mock mode and no local session -> unauth
      onUnauth();
    }
  },

  // Setup dynamic profile dropdown in headers
  syncHeaderProfile(user) {
    const profileMenu = document.querySelector('.user-profile-menu');
    if (!profileMenu) return;

    // Set avatar image
    const img = profileMenu.querySelector('.navbar-avatar');
    if (img) {
      img.src = user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';
      img.alt = user.displayName || 'Developer';
    }

    // Remove any previous dropdown to prevent duplicates
    const oldDropdown = document.getElementById('auth-profile-dropdown');
    if (oldDropdown) oldDropdown.remove();

    // Create dropdown element
    const dropdown = document.createElement('div');
    dropdown.id = 'auth-profile-dropdown';
    dropdown.className = 'auth-dropdown-menu';
    
    // Check current page filename to provide relevant shortcut link
    const isEditingAdmin = window.location.pathname.includes('admin.html');
    const toggleLink = isEditingAdmin 
      ? `<a href="dashboard.html" class="dropdown-item"><i class="fa-solid fa-compass"></i> Explore Events</a><div class="dropdown-divider"></div>`
      : '';

    dropdown.innerHTML = `
      <div class="dropdown-header">
        <div class="dropdown-name">${user.displayName || 'Anonymous Developer'}</div>
        <div class="dropdown-email">${user.email}</div>
      </div>
      <div class="dropdown-divider"></div>
      ${toggleLink}
      <button class="dropdown-item logout-btn" id="btn-dropdown-logout">
        <i class="fa-solid fa-right-from-bracket"></i> Sign Out
      </button>
    `;

    document.body.appendChild(dropdown);

    // Toggle dropdown open/close on avatar click
    profileMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
      
      // Position dropdown directly under the profile menu button
      const rect = profileMenu.getBoundingClientRect();
      dropdown.style.top = `${rect.bottom + window.scrollY + 10}px`;
      dropdown.style.right = `${window.innerWidth - rect.right - window.scrollX}px`;
    });

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!profileMenu.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });

    // Wire sign out button
    const logoutBtn = dropdown.querySelector('#btn-dropdown-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.signOutUser();
      });
    }
  }
};

// Add Auth dropdown styles dynamically to avoid editing all CSS files separately
const styleEl = document.createElement('style');
styleEl.innerHTML = `
  .auth-dropdown-menu {
    position: absolute;
    width: 220px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.08);
    padding: 8px 0;
    z-index: 10001;
    transform: translateY(10px);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  .auth-dropdown-menu.active {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
  .dropdown-header {
    padding: 10px 16px;
  }
  .dropdown-name {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    color: #0f172a;
  }
  .dropdown-email {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 2px;
    word-break: break-all;
  }
  .dropdown-divider {
    height: 1px;
    background-color: rgba(0, 0, 0, 0.06);
    margin: 6px 0;
  }
  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 16px;
    background: none;
    border: none;
    outline: none;
    text-align: left;
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    color: #334155;
    text-decoration: none;
    cursor: pointer;
    transition: background-color 0.15s, color 0.15s;
  }
  .dropdown-item:hover {
    background-color: rgba(37, 99, 235, 0.06);
    color: #2563eb;
  }
  .dropdown-item i {
    font-size: 0.9rem;
    width: 16px;
  }
  .logout-btn:hover {
    background-color: rgba(244, 63, 94, 0.06);
    color: #f43f5e !important;
  }
`;
document.head.appendChild(styleEl);
