// Authentication module - Uses Firebase Auth if available, falls back to localStorage

const auth = {
  // Sign in - Uses Firebase Auth
  signIn: async (email, password) => {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    // Check if Firebase is properly initialized (with safe checks)
    const isFirebaseReady = typeof firebaseServices !== 'undefined' && 
                           firebaseServices && 
                           typeof firebaseServices.isInitialized === 'function' && 
                           firebaseServices.isInitialized() && 
                           typeof firebaseAuth !== 'undefined' &&
                           firebaseAuth &&
                           typeof firebaseAuth.signIn === 'function';

    // Use Firebase Auth if available
    if (isFirebaseReady) {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sign in timeout. Please check your connection.')), 10000)
        );
        
        const result = await Promise.race([
          firebaseAuth.signIn(email, password),
          timeoutPromise
        ]);
        
        if (result && result.success) {
          ui.toast('Signed in successfully!', 'success');
          ui.mountNav();
          ui.closeModal('signInModal');
          if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
            window.location.href = './feed.html';
          }
        }
        return result || { success: false, error: 'Sign in failed' };
      } catch (error) {
        console.error('Sign in error:', error);
        // If Firebase fails, try localStorage fallback
        console.log('Firebase sign-in failed, trying localStorage fallback...');
      }
    }

    // Fallback to localStorage (for development/testing) - NO DELAY
    try {
      console.log('Using localStorage fallback for sign-in');
      const account = store.accounts.getByEmail(email);
      
      if (!account) {
        console.log('Account not found for email:', email);
        console.log('Available accounts:', Object.keys(store.accounts.getAll()));
        return { success: false, error: 'No account found with this email. Please sign up first.' };
      }

      console.log('Account found:', account.username);
      
      // In localStorage mode, accept any password for existing accounts (for demo)
      // In production with Firebase, password is verified by Firebase
      
      const session = {
        username: account.username,
        email: account.email,
        loggedInAt: Date.now()
      };

      const saved = store.session.save(session);
      if (!saved) {
        return { success: false, error: 'Failed to save session' };
      }

      ui.toast('Signed in successfully!', 'success');
      ui.mountNav();
      ui.closeModal('signInModal');

      if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
        window.location.href = './feed.html';
      }

      return { success: true };
    } catch (error) {
      console.error('LocalStorage sign-in error:', error);
      return { success: false, error: 'Sign in failed: ' + (error.message || 'Unknown error') };
    }
  },

  // Sign up - Uses Firebase Auth
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

    // Use Firebase Auth if available
    const isFirebaseReadySignUp = typeof firebaseServices !== 'undefined' && 
                                   firebaseServices && 
                                   firebaseServices.isInitialized() && 
                                   typeof firebaseAuth !== 'undefined' &&
                                   firebaseAuth;
    
    if (isFirebaseReadySignUp) {
      const result = await firebaseAuth.signUp(username, email, password, confirmPassword);
      if (result.success) {
        ui.toast('Account created successfully! Complete the trading game to get started! 🎮', 'success', 4000);
        ui.mountNav();
        ui.closeModal('signUpModal');
        if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
          window.location.href = './feed.html';
        }
      }
      return result;
    }

    // Fallback to localStorage (for development/testing)
    await new Promise(resolve => setTimeout(resolve, CONFIG.API_DELAY));
    const existingAccount = store.accounts.getByEmail(email);
    if (existingAccount) {
      return { success: false, error: 'Email already registered. Please sign in instead.' };
    }

    const accountResult = store.accounts.create(email, username.trim(), password);
    if (!accountResult.success) {
      return accountResult;
    }

    const session = {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      loggedInAt: Date.now()
    };

    store.session.save(session);
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

  // Logout - Uses Firebase Auth
  logout: async () => {
    if (typeof firebaseServices !== 'undefined' && 
        firebaseServices && 
        firebaseServices.isInitialized() && 
        typeof firebaseAuth !== 'undefined' &&
        firebaseAuth) {
      await firebaseAuth.signOut();
    }
    store.session.clear();
    ui.toast('Logged out successfully', 'info');
    ui.mountNav();
    
    if (!window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/')) {
      window.location.href = './index.html';
    } else {
      window.location.reload();
    }
  },

  // Check if user is logged in
  isAuthenticated: () => {
    if (typeof firebaseServices !== 'undefined' && 
        firebaseServices && 
        firebaseServices.isInitialized() && 
        typeof firebaseAuth !== 'undefined' &&
        firebaseAuth) {
      return firebaseAuth.isAuthenticated();
    }
    return store.session.load() !== null;
  },

  // Get current user
  getCurrentUser: () => {
    if (typeof firebaseServices !== 'undefined' && 
        firebaseServices && 
        firebaseServices.isInitialized() && 
        typeof firebaseAuth !== 'undefined' &&
        firebaseAuth) {
      const firebaseUser = firebaseAuth.getCurrentUser();
      if (firebaseUser) {
        return firebaseUser;
      }
    }
    return store.session.load();
  },

  // Request password reset - sends OTP to email
  requestPasswordReset: async (email) => {
    if (!email) return { success: false, error: 'Email is required' };
    
    // Use Firebase Auth if available
    if (typeof firebaseServices !== 'undefined' && 
        firebaseServices && 
        firebaseServices.isInitialized() && 
        typeof firebaseAuth !== 'undefined' &&
        firebaseAuth) {
      return await firebaseAuth.requestPasswordReset(email);
    }
    
    // Fallback to localStorage + EmailJS
    const account = store.accounts.getByEmail(email);
    await new Promise(resolve => setTimeout(resolve, CONFIG.API_DELAY));
    if (!account) return { success: false, error: 'No account found for this email' };

    const { otp, expiresAt } = store.passwordResets.generateOTP(email);
    
    // Send OTP via EmailJS
    try {
      // Validate config first
      const cfg = CONFIG?.EMAILJS || {};
      const missing = [];
      if (!cfg.SERVICE_ID || cfg.SERVICE_ID.startsWith('YOUR_')) missing.push('SERVICE_ID');
      if (!cfg.TEMPLATE_ID || cfg.TEMPLATE_ID.startsWith('YOUR_')) missing.push('TEMPLATE_ID');
      if (!cfg.PUBLIC_KEY || cfg.PUBLIC_KEY.startsWith('YOUR_')) missing.push('PUBLIC_KEY');
      if (missing.length > 0) {
        console.error('EmailJS config missing values:', missing);
        ui.toast('Email sending not configured. Please set EmailJS ' + missing.join(', ') + ' in scripts/config.js', 'error', 6000);
        // Log OTP to console for development so flow can still proceed
        console.log(`[DEV ONLY] Password reset OTP for ${email}: ${otp}`);
        return { success: true, email: email.toLowerCase() };
      }

      // Initialize EmailJS if not already initialized
      if (typeof emailjs !== 'undefined') {
        try {
          emailjs.init(cfg.PUBLIC_KEY);
        } catch (initErr) {
          console.warn('EmailJS init warning:', initErr);
        }
        
        // Send email with OTP
        const emailResult = await emailjs.send(
          cfg.SERVICE_ID,
          cfg.TEMPLATE_ID,
          {
            to_email: email,
            to_name: account.username,
            otp_code: otp,
            subject: 'EcoVest+ Password Reset OTP',
            message: `Your password reset OTP is: ${otp}. This code will expire in 10 minutes.`
          }
        );
        
        console.log('Email sent successfully:', emailResult);
        ui.toast(`OTP has been sent to ${email}. Please check your email inbox.`, 'success', 5000);
      } else {
        // Fallback: EmailJS not loaded or configured
        console.warn('EmailJS not configured. OTP:', otp);
        console.log(`[DEV ONLY] Password reset OTP for ${email}: ${otp}`);
        ui.toast('Email service not loaded. Check that EmailJS script is included in index.html', 'error', 6000);
      }
    } catch (error) {
      console.error('Failed to send email via EmailJS:', error);
      
      // Check for specific Gmail scope error
      const errorText = error?.text || error?.message || '';
      let userMessage = 'Email sending failed. ';
      
      if (errorText.includes('insufficient authentication scopes') || errorText.includes('Gmail_API')) {
        userMessage += 'Gmail API permissions issue. Quick fix: In EmailJS dashboard, add a new "EmailJS" service (not Gmail) and update SERVICE_ID in config.js. See QUICK_FIX_EMAIL.md for details.';
      } else if (errorText) {
        userMessage += errorText;
      } else {
        userMessage += 'Please verify EmailJS Service/Template/Public Key and template variables.';
      }
      
      ui.toast(userMessage, 'error', 8000);
      
      // Fallback: show OTP in console for development/testing
      console.log(`[DEV ONLY] Password reset OTP for ${email}: ${otp}`);
      console.log('Full error details:', error);
      
      // Still return success so user can test the OTP flow using console OTP
      return { success: true, email: email.toLowerCase() };
    }
    
    return { success: true, email: email.toLowerCase() };
  },

  // Verify OTP before allowing password reset
  verifyOTP: async (otp, email) => {
    if (!otp || !email) return { success: false, error: 'OTP and email are required' };
    
    if (typeof firebaseServices !== 'undefined' && 
        firebaseServices && 
        firebaseServices.isInitialized() && 
        typeof firebaseAuth !== 'undefined' &&
        firebaseAuth) {
      return await firebaseAuth.verifyOTP(otp, email);
    }
    
    await new Promise(resolve => setTimeout(resolve, CONFIG.API_DELAY));
    const result = store.passwordResets.verifyOTP(otp, email);
    if (!result.valid) {
      return { success: false, error: result.error };
    }
    return { success: true, email: result.email };
  },

  // Perform password reset after OTP verification
  resetPassword: async (email, newPassword, confirmPassword) => {
    if (!email || !newPassword) return { success: false, error: 'Email and password are required' };
    if (newPassword !== confirmPassword) return { success: false, error: 'Passwords do not match' };
    if (newPassword.length < 6) return { success: false, error: 'Password must be at least 6 characters' };

    if (typeof firebaseServices !== 'undefined' && 
        firebaseServices && 
        firebaseServices.isInitialized() && 
        typeof firebaseAuth !== 'undefined' &&
        firebaseAuth) {
      return await firebaseAuth.resetPassword(email, newPassword, confirmPassword);
    }

    await new Promise(resolve => setTimeout(resolve, CONFIG.API_DELAY));
    const ok = store.maintenance.updatePasswordByEmail(email, newPassword);
    if (!ok) return { success: false, error: 'Failed to update password' };
    return { success: true };
  },

  // Delete current account (requires confirmation)
  deleteAccount: async (confirmationText) => {
    const REQUIRED = 'DELETE MY ACCOUNT';
    
    if (typeof firebaseServices !== 'undefined' && 
        firebaseServices && 
        firebaseServices.isInitialized() && 
        typeof firebaseAuth !== 'undefined' &&
        firebaseAuth) {
      return await firebaseAuth.deleteAccount(confirmationText);
    }
    
    const session = store.session.load();
    if (!session) return { success: false, error: 'Not authenticated' };
    if (confirmationText !== REQUIRED) return { success: false, error: `Please type "${REQUIRED}" to confirm` };

    await new Promise(resolve => setTimeout(resolve, CONFIG.API_DELAY));
    const ok = store.maintenance.removeAccountByEmail(session.email);
    if (!ok) return { success: false, error: 'Failed to delete account' };
    store.session.clear();
    return { success: true };
  }
};

