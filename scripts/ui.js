// UI components and utilities

const ui = {
  // Mount navigation header
  mountNav: () => {
    const nav = $('nav');
    if (!nav) return;

    const session = store.session.load();
    
    if (session) {
      nav.innerHTML = `
        <div class="nav-brand">
          <a href="./index.html" class="home-link">🏠 Home</a>
          <a href="./index.html">EcoVest+</a>
        </div>
        <div class="nav-menu">
          <div class="user-menu">
            <button class="user-menu-toggle" aria-haspopup="true" aria-expanded="false" id="userMenuToggle">
              ${session.username} ▾
            </button>
            <ul class="user-menu-dropdown" id="userMenuDropdown" role="menu">
              <li role="menuitem"><a href="./profile.html">Profile</a></li>
              <li role="menuitem"><button id="logoutBtn">Logout</button></li>
            </ul>
          </div>
        </div>
      `;

      // User menu toggle
      const menuToggle = $('#userMenuToggle');
      const menuDropdown = $('#userMenuDropdown');
      
      menuToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', !isExpanded);
        menuDropdown.classList.toggle('active');
      });

      // Close menu on outside click
      document.addEventListener('click', (e) => {
        if (!menuToggle?.contains(e.target) && !menuDropdown?.contains(e.target)) {
          menuToggle?.setAttribute('aria-expanded', 'false');
          menuDropdown?.classList.remove('active');
        }
      });

      // Logout
      $('#logoutBtn')?.addEventListener('click', () => {
        auth.logout();
      });
    } else {
      nav.innerHTML = `
        <div class="nav-brand">
          <a href="./index.html" class="home-link">🏠 Home</a>
          <a href="./index.html">EcoVest+</a>
        </div>
        <div class="nav-menu">
          <button class="btn btn-outline" id="signInBtn">Sign In</button>
          <button class="btn btn-primary" id="signUpBtn">Sign Up</button>
        </div>
      `;

      $('#signInBtn')?.addEventListener('click', () => ui.openModal('signInModal'));
      $('#signUpBtn')?.addEventListener('click', () => ui.openModal('signUpModal'));
    }

  },
  

  // Modal controller
  openModal: (modalId) => {
    const modal = $(`#${modalId}`);
    if (!modal) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Focus first input
    const firstInput = modal.querySelector('input, textarea, button');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }

    // ESC key handler
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        ui.closeModal(modalId);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  },

  closeModal: (modalId) => {
    const modal = $(`#${modalId}`);
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';
  },

  // Toast notifications
  toast: (message, type = 'info', duration = 3000) => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.textContent = message;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after duration
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Loading spinner
  showLoading: (element) => {
    if (element) {
      element.innerHTML = '<div class="spinner"></div>';
    }
  },

  // Hide loading
  hideLoading: (element) => {
    if (element) {
      element.innerHTML = '';
    }
  }
};

// Initialize modals on page load
document.addEventListener('DOMContentLoaded', () => {
  // Close modal on backdrop click
  $$('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        ui.closeModal(modal.id);
      }
    });
  });

  // Close modal on X button
  $$('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = btn.closest('.modal');
      if (modal) {
        ui.closeModal(modal.id);
      }
    });
  });
});

