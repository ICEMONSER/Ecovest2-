// Home page module

const home = {
  init: () => {
    // Allow logged-in users to view home page
    const session = store.session.load();
    
    // If logged in, show a different hero message
    if (session) {
      const heroSection = $('.hero');
      if (heroSection) {
        heroSection.innerHTML = `
          <div class="container">
            <h1>Welcome back, ${sanitize(session.username)}! 👋</h1>
            <p>Ready to start your journey?</p>
            <div class="hero-actions">
              <a href="./feed.html" class="btn btn-primary">Go to Community Feed</a>
              <a href="./game.html" class="btn btn-outline">Play Trading Game</a>
              <a href="./profile.html" class="btn btn-outline">View Profile</a>
            </div>
          </div>
        `;
      }
      return; // Don't setup sign in/up forms for logged-in users
    }

    // Setup sign in form
    const signInForm = $('#signInForm');
    if (signInForm) {
      signInForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = $('#signInEmail').value.trim();
        const password = $('#signInPassword').value;

        if (!email || !password) {
          ui.toast('Please enter email and password', 'error');
          return;
        }

        const submitBtn = signInForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        try {
          const result = await auth.signIn(email, password);

          if (!result || !result.success) {
            const errorMsg = result?.error || 'Sign in failed. Please check your credentials.';
            ui.toast(errorMsg, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
          // If successful, auth.signIn handles redirect, so button stays disabled
        } catch (error) {
          console.error('Sign in error:', error);
          ui.toast(error.message || 'Sign in failed. Please try again.', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      });
    }

    // Setup sign up form
    const signUpForm = $('#signUpForm');
    if (signUpForm) {
      // Role selector toggle logic
      const roleGrid = $('#signUpRoleGrid');
      if (roleGrid) {
        roleGrid.addEventListener('click', (e) => {
          const card = e.target.closest('.role-card');
          if (!card) return;
          card.classList.toggle('selected');
        });
      }

      signUpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = $('#signUpUsername').value.trim();
        const email = $('#signUpEmail').value.trim();
        const password = $('#signUpPassword').value;
        const confirmPassword = $('#signUpConfirmPassword').value;
        const roleButtons = $$('.role-card');
        const selectedRoles = roleButtons
          .filter(btn => btn.classList.contains('selected'))
          .map(btn => btn.dataset.role);

        if (!username || !email || !password || !confirmPassword || selectedRoles.length === 0) {
          ui.toast('Please fill all fields and select at least one role', 'error');
          return;
        }

        const submitBtn = signUpForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing up...';

        const result = await auth.signUp(username, email, password, confirmPassword, selectedRoles);

        if (!result.success) {
          ui.toast(result.error || 'Sign up failed', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign Up';
        }
      });
    }

    // Forgot password flow
    $('#forgotPasswordBtn')?.addEventListener('click', () => ui.openModal('forgotPasswordModal'));

    const forgotForm = $('#forgotPasswordForm');
    if (forgotForm) {
      forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = $('#forgotEmail').value.trim();
        if (!email) return;
        const submitBtn = forgotForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending OTP...';
        const res = await auth.requestPasswordReset(email);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send OTP to Email';
        if (!res.success) {
          ui.toast(res.error || 'Failed to send OTP', 'error');
          return;
        }
        ui.closeModal('forgotPasswordModal');
        // Open OTP verification modal
        $('#otpEmail').value = res.email;
        $('#otpCode').value = '';
        ui.openModal('verifyOTPModal');
      });
    }

    // Verify OTP form
    const verifyOTPForm = $('#verifyOTPForm');
    if (verifyOTPForm) {
      // Only allow numbers in OTP input
      $('#otpCode')?.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
      });

      verifyOTPForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = $('#otpEmail').value;
        const otp = $('#otpCode').value.trim();
        if (!otp || otp.length !== 6) {
          ui.toast('Please enter a valid 6-digit OTP', 'error');
          return;
        }
        const submitBtn = verifyOTPForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying...';
        const res = await auth.verifyOTP(otp, email);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Verify OTP';
        if (!res.success) {
          ui.toast(res.error || 'Invalid OTP', 'error');
          return;
        }
        ui.toast('OTP verified successfully!', 'success');
        ui.closeModal('verifyOTPModal');
        // Open password reset modal
        $('#resetEmail').value = res.email;
        $('#newPassword').value = '';
        $('#confirmNewPassword').value = '';
        ui.openModal('resetPasswordModal');
      });

      // Resend OTP button
      $('#resendOTPBtn')?.addEventListener('click', async () => {
        const email = $('#otpEmail').value;
        if (!email) return;
        const btn = $('#resendOTPBtn');
        btn.disabled = true;
        btn.textContent = 'Resending...';
        const res = await auth.requestPasswordReset(email);
        btn.disabled = false;
        btn.textContent = 'Resend OTP';
        if (!res.success) {
          ui.toast(res.error || 'Failed to resend OTP', 'error');
          return;
        }
        $('#otpCode').value = '';
        ui.toast('New OTP has been sent to your email. Please check your inbox.', 'success');
      });
    }

    // Reset password form
    const resetForm = $('#resetPasswordForm');
    if (resetForm) {
      resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = $('#resetEmail').value;
        const newPassword = $('#newPassword').value;
        const confirmNewPassword = $('#confirmNewPassword').value;
        const btn = resetForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Updating...';
        const res = await auth.resetPassword(email, newPassword, confirmNewPassword);
        btn.disabled = false;
        btn.textContent = 'Reset password';
        if (!res.success) {
          ui.toast(res.error || 'Failed to reset password', 'error');
          return;
        }
        ui.toast('Password updated successfully! Please sign in with your new password.', 'success');
        ui.closeModal('resetPasswordModal');
        ui.openModal('signInModal');
      });
    }
  }
};

