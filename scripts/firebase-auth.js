// Firebase Authentication Service

const firebaseAuth = {
  // Sign in with email and password
  signIn: async (email, password) => {
    try {
      if (!firebaseServices.isInitialized()) {
        return { success: false, error: 'Firebase not initialized. Please check your Firebase configuration.' };
      }

      // Sign in with Firebase Auth
      const userCredential = await firebaseServices.auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Get user profile from database (with timeout)
      let profile = {};
      try {
        const profileSnapshot = await Promise.race([
          firebaseServices.database.ref(`profiles/${user.uid}`).once('value'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Profile fetch timeout')), 5000))
        ]);
        profile = profileSnapshot.val() || {};
      } catch (profileError) {
        console.warn('Profile fetch failed, using defaults:', profileError);
        // Continue with default profile if fetch fails
      }
      
      const roles = Array.isArray(profile.roles)
        ? profile.roles
        : (profile.role ? [profile.role] : []);

      const session = {
        uid: user.uid,
        username: profile.username || user.email.split('@')[0],
        email: user.email,
        loggedInAt: Date.now(),
        roles,
        avatarUrl: profile.avatarUrl || null,
        avatarUpdatedAt: profile.avatarUpdatedAt || profile.updatedAt || 0
      };

      // Save to localStorage for compatibility
      localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(session));

      if (typeof store !== 'undefined' && store?.profiles?.update) {
        try {
          store.profiles.update(session.username, {
            username: session.username,
            email: session.email,
            profileScore: profile.profileScore ?? 0,
            level: profile.level ?? 'Novice',
            followers: profile.followers ?? 0,
            following: profile.following ?? 0,
            roles,
            avatarUrl: session.avatarUrl,
            avatarUpdatedAt: session.avatarUpdatedAt
          });
        } catch (cacheError) {
          console.warn('Profile cache sync failed:', cacheError);
        }
      }
      
      return { success: true, user: session };
    } catch (error) {
      console.error('Firebase sign in error:', error);
      let errorMessage = 'Sign in failed';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      return { success: false, error: errorMessage };
    }
  },

  // Sign up with email and password
  signUp: async (username, email, password, confirmPassword, roleOrRoles) => {
    try {
      if (!firebaseServices.isInitialized()) {
        return { success: false, error: 'Firebase not initialized' };
      }

      if (password !== confirmPassword) {
        return { success: false, error: 'Passwords do not match' };
      }

      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      // Create Firebase auth user
      const userCredential = await firebaseServices.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Create user profile in database
      const selectedRoles = Array.isArray(roleOrRoles)
        ? roleOrRoles
        : roleOrRoles
          ? [roleOrRoles]
          : [];

      const profileData = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        profileScore: 0,
        level: 'Novice',
        followers: 0,
        following: 0,
        roles: selectedRoles,
        avatarUrl: null,
        avatarUpdatedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await firebaseServices.database.ref(`profiles/${user.uid}`).set(profileData);

      // Also store username mapping for lookup
      await firebaseServices.database.ref(`usernames/${username.trim().toLowerCase()}`).set(user.uid);

      const session = {
        uid: user.uid,
        username: username.trim(),
        email: email.trim().toLowerCase(),
        loggedInAt: Date.now(),
        roles: selectedRoles,
        avatarUrl: null,
        avatarUpdatedAt: profileData.avatarUpdatedAt
      };

      localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(session));

      if (typeof store !== 'undefined' && store?.profiles?.update) {
        try {
          store.profiles.update(username.trim(), {
            ...profileData
          });
        } catch (cacheError) {
          console.warn('Profile cache sync failed:', cacheError);
        }
      }

      return { success: true, user: session };
    } catch (error) {
      let errorMessage = 'Sign up failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already registered. Please sign in instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.message) {
        errorMessage = error.message;
      }
      return { success: false, error: errorMessage };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      if (firebaseServices.isInitialized()) {
        await firebaseServices.auth.signOut();
      }
      localStorage.removeItem(CONFIG.SESSION_KEY);
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      localStorage.removeItem(CONFIG.SESSION_KEY);
      return { success: true }; // Still clear local session
    }
  },

  // Get current user
  getCurrentUser: () => {
    const session = JSON.parse(localStorage.getItem(CONFIG.SESSION_KEY) || 'null');
    if (session && firebaseServices.isInitialized()) {
      // Verify user is still authenticated
      const currentUser = firebaseServices.auth.currentUser;
      if (currentUser && currentUser.uid === session.uid) {
        return session;
      }
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    if (firebaseServices.isInitialized()) {
      return !!firebaseServices.auth.currentUser;
    }
    return !!localStorage.getItem(CONFIG.SESSION_KEY);
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback) => {
    if (firebaseServices.isInitialized()) {
      return firebaseServices.auth.onAuthStateChanged((user) => {
        if (user) {
          firebaseServices.database.ref(`profiles/${user.uid}`).once('value').then(snapshot => {
            const profile = snapshot.val() || {};
            const existingRoles = Array.isArray(profile.roles) ? profile.roles : (profile.role ? [profile.role] : []);
            const session = {
              uid: user.uid,
              username: profile.username || user.email.split('@')[0],
              email: user.email,
              loggedInAt: Date.now(),
              roles: existingRoles,
              avatarUrl: profile.avatarUrl || null,
              avatarUpdatedAt: profile.avatarUpdatedAt || profile.updatedAt || 0
            };
            localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(session));

            if (typeof store !== 'undefined' && store?.profiles?.update) {
              try {
                store.profiles.update(session.username, {
                  username: session.username,
                  email: session.email,
                  profileScore: profile.profileScore ?? 0,
                  level: profile.level ?? 'Novice',
                  followers: profile.followers ?? 0,
                  following: profile.following ?? 0,
                  roles: existingRoles,
                  avatarUrl: session.avatarUrl,
                  avatarUpdatedAt: session.avatarUpdatedAt
                });
              } catch (cacheError) {
                console.warn('Profile cache sync failed:', cacheError);
              }
            }
            callback(session);
          });
        } else {
          localStorage.removeItem(CONFIG.SESSION_KEY);
          callback(null);
        }
      });
    }
    return () => {}; // Return no-op unsubscribe
  },

  // Request password reset - Uses EmailJS OTP system (not Firebase email links)
  requestPasswordReset: async (email) => {
    if (!firebaseServices.isInitialized()) {
      return { success: false, error: 'Firebase not initialized' };
    }

    // Check if user exists in Firebase
    try {
      const signInMethods = await firebaseServices.auth.fetchSignInMethodsForEmail(email);
      if (signInMethods.length === 0) {
        return { success: false, error: 'No account found for this email' };
      }
    } catch (error) {
      return { success: false, error: 'No account found for this email' };
    }

    // Use EmailJS OTP system (same as localStorage fallback)
    const { otp, expiresAt } = store.passwordResets.generateOTP(email);
    
    // Send OTP via EmailJS
    try {
      const cfg = CONFIG?.EMAILJS || {};
      const missing = [];
      if (!cfg.SERVICE_ID || cfg.SERVICE_ID.startsWith('YOUR_')) missing.push('SERVICE_ID');
      if (!cfg.TEMPLATE_ID || cfg.TEMPLATE_ID.startsWith('YOUR_')) missing.push('TEMPLATE_ID');
      if (!cfg.PUBLIC_KEY || cfg.PUBLIC_KEY.startsWith('YOUR_')) missing.push('PUBLIC_KEY');
      if (missing.length > 0) {
        console.error('EmailJS config missing values:', missing);
        ui.toast('Email sending not configured. Please set EmailJS ' + missing.join(', ') + ' in scripts/config.js', 'error', 6000);
        console.log(`[DEV ONLY] Password reset OTP for ${email}: ${otp}`);
        return { success: true, email: email.toLowerCase() };
      }

      if (typeof emailjs !== 'undefined') {
        try {
          emailjs.init(cfg.PUBLIC_KEY);
        } catch (initErr) {
          console.warn('EmailJS init warning:', initErr);
        }
        
        // Get username from Firebase profile
        const profileSnapshot = await firebaseServices.database.ref('profiles')
          .orderByChild('email').equalTo(email.toLowerCase()).once('value');
        let username = email.split('@')[0];
        if (profileSnapshot.exists()) {
          const profile = Object.values(profileSnapshot.val())[0];
          username = profile.username || username;
        }
        
        const emailResult = await emailjs.send(
          cfg.SERVICE_ID,
          cfg.TEMPLATE_ID,
          {
            to_email: email,
            to_name: username,
            otp_code: otp,
            subject: 'EcoVest+ Password Reset OTP',
            message: `Your password reset OTP is: ${otp}. This code will expire in 10 minutes.`
          }
        );
        
        console.log('Email sent successfully:', emailResult);
        ui.toast(`OTP has been sent to ${email}. Please check your email inbox.`, 'success', 5000);
      } else {
        console.warn('EmailJS not configured. OTP:', otp);
        console.log(`[DEV ONLY] Password reset OTP for ${email}: ${otp}`);
        ui.toast('Email service not loaded. Check that EmailJS script is included in index.html', 'error', 6000);
      }
    } catch (error) {
      console.error('Failed to send email via EmailJS:', error);
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
      console.log(`[DEV ONLY] Password reset OTP for ${email}: ${otp}`);
    }
    
    return { success: true, email: email.toLowerCase() };
  },

  // Verify password reset code (OTP from EmailJS)
  verifyOTP: async (otp, email) => {
    // This still uses EmailJS OTP system
    // Firebase password reset uses email links, but we're keeping OTP for consistency
    const result = store.passwordResets.verifyOTP(otp, email);
    if (!result.valid) {
      return { success: false, error: result.error };
    }
    return { success: true, email: result.email };
  },

  // Reset password after OTP verification
  resetPassword: async (email, newPassword, confirmPassword) => {
    try {
      if (!firebaseServices.isInitialized()) {
        return { success: false, error: 'Firebase not initialized' };
      }

      if (newPassword !== confirmPassword) {
        return { success: false, error: 'Passwords do not match' };
      }

      if (newPassword.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      // Get user by email and update password
      // Note: Firebase requires re-authentication for password changes
      // For OTP-based reset, we need to sign in the user first
      // This is a simplified approach - in production, you might want to use Firebase Admin SDK
      try {
        // Try to sign in with a temporary password (this won't work, but checks if user exists)
        const signInMethods = await firebaseServices.auth.fetchSignInMethodsForEmail(email);
        if (signInMethods.length === 0) {
          return { success: false, error: 'No account found for this email' };
        }

        // Since we can't change password without re-authentication in Firebase,
        // we'll need to use a different approach. For now, return an error.
        // In production, you would:
        // 1. Use Firebase Admin SDK on backend to update password
        // 2. Or require user to sign in after OTP verification
        // 3. Or use Firebase's built-in password reset email links
        
        return { success: false, error: 'Password reset requires re-authentication. Please sign in and change your password from profile settings, or use the password reset link sent to your email.' };
      } catch (error) {
        return { success: false, error: error.message || 'Failed to reset password' };
      }
    } catch (error) {
      return { success: false, error: error.message || 'Failed to reset password' };
    }
  },

  // Delete account
  deleteAccount: async (confirmationText) => {
    const REQUIRED = 'DELETE MY ACCOUNT';
    if (confirmationText !== REQUIRED) {
      return { success: false, error: `Please type "${REQUIRED}" to confirm` };
    }

    try {
      if (!firebaseServices.isInitialized()) {
        return { success: false, error: 'Firebase not initialized' };
      }

      const user = firebaseServices.auth.currentUser;
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const uid = user.uid;

      // Delete user data from database
      await firebaseServices.database.ref(`profiles/${uid}`).remove();
      await firebaseServices.database.ref(`usernames/${user.email.split('@')[0].toLowerCase()}`).remove();
      
      // Delete user's posts
      const postsSnapshot = await firebaseServices.database.ref('posts').orderByChild('uid').equalTo(uid).once('value');
      const posts = postsSnapshot.val() || {};
      const deletePromises = Object.keys(posts).map(postId => 
        firebaseServices.database.ref(`posts/${postId}`).remove()
      );
      await Promise.all(deletePromises);

      // Delete user's comments
      const commentsSnapshot = await firebaseServices.database.ref('comments').orderByChild('uid').equalTo(uid).once('value');
      const comments = commentsSnapshot.val() || {};
      const commentDeletePromises = Object.keys(comments).map(commentId => 
        firebaseServices.database.ref(`comments/${commentId}`).remove()
      );
      await Promise.all(commentDeletePromises);

      // Delete Firebase Auth user
      await user.delete();

      localStorage.removeItem(CONFIG.SESSION_KEY);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to delete account' };
    }
  }
};

