// Simple router for navigation (if needed)
// For this project, we're using simple page navigation, but this can be extended

const router = {
  // Simple navigation helper
  navigate: (path) => {
    window.location.href = path;
  },

  // Get current page
  getCurrentPage: () => {
    const path = window.location.pathname;
    if (path.includes('feed.html')) return 'feed';
    if (path.includes('escape-the-paycheck.html') || path.includes('game.html')) return 'game';
    if (path.includes('profile.html')) return 'profile';
    if (path.includes('terms.html')) return 'terms';
    return 'index';
  },

  // Check authentication and redirect if needed
  requireAuth: () => {
    const session = store.session.load();
    if (!session) {
      router.navigate('./index.html');
      return false;
    }
    return true;
  }
};

