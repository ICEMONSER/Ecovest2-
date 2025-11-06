// Authentication module

const auth = {
  // Sign in
  signIn: async (email, password) => {
    // Mock authentication - in real app, this would validate against server
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, CONFIG.API_DELAY));

    // Check if account exists
    const account = store.accounts.getByEmail(email);
    if (!account) {
      return { success: false, error: 'Invalid email or password' };
    }

    // In real app, verify password hash here
    // For demo: accept any password for existing accounts

    const session = {
      username: account.username,
      email: account.email,
      loggedInAt: Date.now()
    };

    store.session.save(session);
    ui.toast('Signed in successfully!', 'success');
    
    // Update nav
    ui.mountNav();
    
    // Close modal
    ui.closeModal('signInModal');

    // Redirect to feed if on home page
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
      window.location.href = './feed.html';
    }

    return { success: true };
  },

  // Sign up
  signUp: async (username, email, password, confirmPassword) => {
    if (!username || !email || !password) {
      return { success: false, error: 'All fields are required' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Invalid email format' };
    }

    if (password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, CONFIG.API_DELAY));

    // Check if email already exists (one account per email)
    const existingAccount = store.accounts.getByEmail(email);
    if (existingAccount) {
      return { success: false, error: 'Email already registered. Please sign in instead.' };
    }

    // Create account (in real app, hash password)
    const accountResult = store.accounts.create(email, username.trim(), password);
    if (!accountResult.success) {
      return accountResult;
    }

    // Create session
    const session = {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      loggedInAt: Date.now()
    };

    store.session.save(session);
    
    // Initialize user profile
    store.profiles.update(username.trim(), {
      username: username.trim(),
      profileScore: 0,
      level: 'Novice',
      followers: 0,
      following: 0
    });

    ui.toast('Account created successfully! Complete the trading game to get started! 🎮', 'success', 4000);
    
    // Update nav
    ui.mountNav();
    
    // Close modal
    ui.closeModal('signUpModal');

    // Redirect new users to game.html (they must play to get level)
    setTimeout(() => {
      window.location.href = './game.html';
    }, 1000);

    return { success: true };
  },

  // Logout
  logout: () => {
    store.session.clear();
    ui.toast('Logged out successfully', 'info');
    ui.mountNav();
    
    // Redirect to home
    if (!window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/')) {
      window.location.href = './index.html';
    } else {
      window.location.reload();
    }
  },

  // Check if user is logged in
  isAuthenticated: () => {
    return store.session.load() !== null;
  },

  // Get current user
  getCurrentUser: () => {
    return store.session.load();
  }
};

