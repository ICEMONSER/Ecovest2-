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
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        const result = await auth.signIn(email, password);

        if (!result.success) {
          ui.toast(result.error || 'Sign in failed', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In';
        }
      });
    }

    // Setup sign up form
    const signUpForm = $('#signUpForm');
    if (signUpForm) {
      signUpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = $('#signUpUsername').value.trim();
        const email = $('#signUpEmail').value.trim();
        const password = $('#signUpPassword').value;
        const confirmPassword = $('#signUpConfirmPassword').value;

        if (!username || !email || !password || !confirmPassword) {
          ui.toast('Please fill all fields', 'error');
          return;
        }

        const submitBtn = signUpForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing up...';

        const result = await auth.signUp(username, email, password, confirmPassword);

        if (!result.success) {
          ui.toast(result.error || 'Sign up failed', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign Up';
        }
      });
    }
  }
};

