// Profile page module

const ROLE_DEFINITIONS = {
  investor: { label: 'Invest Smart', icon: '💼' },
  entrepreneur: { label: 'Build Ventures', icon: '🚀' },
  'business-owner': { label: 'Scale Businesses', icon: '🏢' },
  student: { label: 'Learn & Explore', icon: '📚' },
  advisor: { label: 'Guide Others', icon: '🧭' },
  'community-builder': { label: 'Connect & Collaborate', icon: '🤝' },
  'challenge-participant': { label: 'Join Challenges', icon: '🏆' },
  'content-creator': { label: 'Create Content', icon: '🎥' },
  other: { label: 'Community Member', icon: '✨' }
};

const profilePage = {
  currentTab: 'posts',

  // Initialize profile page
  init: async () => {
    const session = store.session.load();
    if (!session) {
      window.location.href = './index.html';
      return;
    }

    // Check if user has completed the game (has a level)
    const profile = store.profiles.get(session.username);
    // Only redirect if user is still Novice AND has no score (hasn't played at all)
    if (profile.level === 'Novice' && (!profile.profileScore || profile.profileScore < 20)) {
      ui.toast('Please complete the trading game first! 🎮', 'info', 4000);
      setTimeout(() => {
        window.location.href = './game.html';
      }, 1500);
      return;
    }

    // Check if viewing own profile or another user's
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('user') || session.username;

    profilePage.loadProfile(username);
    profilePage.setupTabs();
  },

  // Load profile data
  loadProfile: async (username) => {
    const profile = store.profiles.get(username);
    const level = getLevel(profile.profileScore || 0);
    const session = store.session.load();
    const isOwnProfile = username === session.username;
    const isFollowing = session && !isOwnProfile && store.follows.isFollowing(session.username, username);
    const followers = profile.followers || 0;
    const following = profile.following || 0;
    const roles = Array.isArray(profile.roles) ? profile.roles : (profile.role ? [profile.role] : []);

    const avatarMarkup = getAvatarPlaceholder(username);
    const avatarControls = isOwnProfile ? `
      <div class="avatar-upload">
        <button class="btn btn-outline btn-sm" id="changeAvatarBtn" type="button">Change Photo</button>
        <input type="file" id="avatarFileInput" accept="image/*" hidden>
        <p class="avatar-hint">PNG or JPG (any size)</p>
      </div>
    ` : '';

    // Render profile header
    const header = $('#profileHeader');
    if (header) {
      const followButton = !isOwnProfile && session ? `
        <button class="btn ${isFollowing ? 'btn-outline' : 'btn-primary'}" id="profileFollowBtn">
          ${isFollowing ? '✓ Following' : '+ Follow'}
        </button>
      ` : '';
      const deleteButton = isOwnProfile ? `
        <button class="btn btn-outline" id="deleteAccountBtn" title="Delete Account">Delete Account</button>
      ` : '';

      header.innerHTML = `
        <div class="profile-avatar">
          ${avatarMarkup}
          ${avatarControls}
        </div>
        <div class="profile-info">
          <h1 class="profile-username">${sanitize(username)}</h1>
          <div class="profile-roles">
            ${roles.length > 0
              ? roles.map(roleKey => {
                  const roleMeta = ROLE_DEFINITIONS[roleKey] || { label: roleKey, icon: '✨' };
                  return `<span class="profile-role-badge"><span class="profile-role-icon">${roleMeta.icon}</span>${sanitize(roleMeta.label)}</span>`;
                }).join('')
              : '<span class="profile-role-badge"><span class="profile-role-icon">✨</span>Member</span>'}
          </div>
          <div class="profile-badges">
            <span class="level-badge level-${level.toLowerCase()}">${level}</span>
            <span class="score-badge">Score: ${profile.profileScore || 0}</span>
          </div>
          <div class="profile-stats">
            <span class="stat-item"><strong>${followers}</strong> Followers</span>
            <span class="stat-item"><strong>${following}</strong> Following</span>
          </div>
          ${followButton}
          ${deleteButton}
        </div>
      `;

      // Add follow button listener
      if (!isOwnProfile && session) {
        $('#profileFollowBtn')?.addEventListener('click', () => {
          profilePage.handleFollow(username);
        });
      }
      if (isOwnProfile) {
        const changeBtn = $('#changeAvatarBtn');
        const fileInput = $('#avatarFileInput');
        changeBtn?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          profilePage.handleAvatarUpload({ file, button: changeBtn, input: fileInput });
        });
        $('#deleteAccountBtn')?.addEventListener('click', () => ui.openModal('deleteAccountModal'));
        const form = $('#deleteAccountForm');
        form?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const text = $('#deleteConfirmText').value.trim();
          const btn = form.querySelector('button[type="submit"]');
          btn.disabled = true;
          btn.textContent = 'Deleting...';
          const res = await auth.deleteAccount(text);
          btn.disabled = false;
          btn.textContent = 'Delete Account';
          if (!res.success) {
            ui.toast(res.error || 'Failed to delete account', 'error');
            return;
          }
          ui.toast('Account deleted. Goodbye!', 'success');
          ui.closeModal('deleteAccountModal');
          window.location.href = './index.html';
        });
      }
    }

    // Load tab content
    profilePage.loadTabContent(username);
  },

  // Setup tabs
  setupTabs: () => {
    $$('.profile-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = tab.dataset.tab;
        profilePage.currentTab = tabName;
        profilePage.updateTabs();
        
        const urlParams = new URLSearchParams(window.location.search);
        const username = urlParams.get('user') || store.session.load()?.username;
        profilePage.loadTabContent(username);
      });
    });
  },

  // Update tab UI
  updateTabs: () => {
    $$('.profile-tab').forEach(tab => {
      if (tab.dataset.tab === profilePage.currentTab) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  },

  // Load tab content
  loadTabContent: async (username) => {
    const container = $('#profileContent');
    if (!container) return;

    ui.showLoading(container);

    switch (profilePage.currentTab) {
      case 'posts':
        await profilePage.loadPosts(username);
        break;
      case 'comments':
        await profilePage.loadComments(username);
        break;
      case 'achievements':
        profilePage.loadAchievements(username);
        break;
      case 'game':
        profilePage.loadGameHistory(username);
        break;
    }
  },

  // Load user posts
  loadPosts: async (username) => {
    const container = $('#profileContent');
    if (!container) return;

    const allPosts = store.posts.getAll();
    const userPosts = allPosts.filter(p => p.username === username);

    if (userPosts.length === 0) {
      container.innerHTML = '<p class="empty-state">No posts yet.</p>';
      return;
    }

    // Use feed.renderPost if available, otherwise create a simple version
    if (typeof feed !== 'undefined' && feed.renderPost) {
      container.innerHTML = userPosts.map(post => feed.renderPost(post)).join('');

      // Attach event listeners
      userPosts.forEach(post => {
        $(`#likeBtn-${post.id}`)?.addEventListener('click', () => {
          feed.handleLike(post.id);
          profilePage.loadPosts(username);
        });
        $(`#commentBtn-${post.id}`)?.addEventListener('click', () => {
          feed.toggleComments(post.id);
        });
      });
    } else {
      // Fallback: simple post rendering
      container.innerHTML = userPosts.map(post => {
        const tags = post.tags.map(tag => `<span class="tag">${sanitize(tag)}</span>`).join('');
        const profile = store.profiles.get(post.username);
        const level = getLevel(profile.profileScore || 0);
        return `
          <article class="post-card">
            <div class="post-header">
              <div class="post-author">
                ${getAvatarPlaceholder(post.username)}
                <div>
                  <div class="author-name">${sanitize(post.username)}</div>
                  <span class="level-badge level-${level.toLowerCase()}">${level}</span>
                </div>
              </div>
              <time class="post-time">${formatTime(post.createdAt)}</time>
            </div>
            <div class="post-content">
              <p>${sanitize(post.content)}</p>
              ${post.image ? `<img src="${post.image.url}" alt="Post image" class="post-image">` : ''}
              <div class="post-tags">${tags}</div>
            </div>
            <div class="post-actions">
              <span class="action-btn"><span>👍</span> ${post.likes || 0}</span>
              <span class="action-btn"><span>💬</span> ${post.comments || 0}</span>
            </div>
          </article>
        `;
      }).join('');
    }
  },

  // Load user comments
  loadComments: async (username) => {
    const container = $('#profileContent');
    if (!container) return;

    const allComments = store.comments.getAll();
    const userComments = allComments.filter(c => c.username === username);

    if (userComments.length === 0) {
      container.innerHTML = '<p class="empty-state">No comments yet.</p>';
      return;
    }

    // Get posts for context
    const allPosts = store.posts.getAll();
    const commentsWithContext = userComments.map(comment => {
      const post = allPosts.find(p => p.id === comment.postId);
      return { ...comment, post };
    });

    container.innerHTML = `
      <div class="comments-list">
        ${commentsWithContext.map(item => `
          <div class="comment-item">
            <div class="comment-header">
              <span class="comment-post-link">
                ${item.post ? `Comment on: <a href="./feed.html">${sanitize(item.post.content.substring(0, 50))}...</a>` : 'Post deleted'}
              </span>
              <time>${formatTime(item.createdAt)}</time>
            </div>
            <p class="comment-content">${sanitize(item.content)}</p>
            ${item.guided ? '<span class="guided-badge">✓ Guided</span>' : ''}
          </div>
        `).join('')}
      </div>
    `;
  },

  // Load achievements
  loadAchievements: (username) => {
    const container = $('#profileContent');
    if (!container) return;

    const profile = store.profiles.get(username);
    const level = getLevel(profile.profileScore || 0);
    const allPosts = store.posts.getAll();
    const userPosts = allPosts.filter(p => p.username === username);
    const allComments = store.comments.getAll();
    const userComments = allComments.filter(c => c.username === username);
    const guidedComments = userComments.filter(c => c.guided).length;

    const achievements = [
      {
        title: 'First Post',
        description: 'Create your first post',
        unlocked: userPosts.length > 0,
        icon: '📝'
      },
      {
        title: 'Active Commenter',
        description: 'Post 10 comments',
        unlocked: userComments.length >= 10,
        icon: '💬'
      },
      {
        title: 'Helpful Guide',
        description: 'Post 5 guided comments (Pro only)',
        unlocked: guidedComments >= 5,
        icon: '✨'
      },
      {
        title: 'Beginner Level',
        description: 'Reach Beginner level',
        unlocked: level !== 'Novice',
        icon: '🌱'
      },
      {
        title: 'Intermediate Level',
        description: 'Reach Intermediate level',
        unlocked: ['Intermediate', 'Pro'].includes(level),
        icon: '📈'
      },
      {
        title: 'Pro Level',
        description: 'Reach Pro level',
        unlocked: level === 'Pro',
        icon: '🏆'
      }
    ];

    container.innerHTML = `
      <div class="achievements-grid">
        ${achievements.map(achievement => `
          <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
            <div class="achievement-icon">${achievement.icon}</div>
            <h3>${achievement.title}</h3>
            <p>${achievement.description}</p>
            ${achievement.unlocked ? '<span class="unlocked-badge">Unlocked</span>' : ''}
          </div>
        `).join('')}
      </div>
    `;
  },

  // Load game history
  loadGameHistory: (username) => {
    const container = $('#profileContent');
    if (!container) return;

    const history = store.gameHistory.getAll(username);

    if (history.length === 0) {
      container.innerHTML = '<p class="empty-state">No game history yet. <a href="./game.html">Play your first game!</a></p>';
      return;
    }

    container.innerHTML = `
      <div class="game-history-list">
        ${history.map(game => {
          // Support both old quiz format and new trading format
          if (game.profit !== undefined) {
            // Trading game format
            return `
              <div class="game-history-item">
                <div class="game-history-header">
                  <span class="level-badge level-novice">Trading Game</span>
                  <time>${formatTime(game.completedAt)}</time>
                </div>
                <div class="game-history-stats">
                  <div class="stat">
                    <span class="stat-label">Initial:</span>
                    <span class="stat-value">$${game.initialCoins?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">Final:</span>
                    <span class="stat-value">$${game.finalCoins?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">Profit:</span>
                    <span class="stat-value ${game.profit >= 0 ? 'positive' : 'negative'}">
                      ${game.profit >= 0 ? '+' : ''}$${game.profit?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            `;
          } else {
            // Quiz format (backward compatibility)
            return `
              <div class="game-history-item">
                <div class="game-history-header">
                  <span class="level-badge level-${game.level?.toLowerCase() || 'novice'}">${game.level || 'Quiz'}</span>
                  <time>${formatTime(game.completedAt)}</time>
                </div>
                <div class="game-history-stats">
                  <div class="stat">
                    <span class="stat-label">Score:</span>
                    <span class="stat-value">${game.score || 0}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">Accuracy:</span>
                    <span class="stat-value">${game.accuracy || 0}%</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">Correct:</span>
                    <span class="stat-value">${game.correctCount || 0}/${game.totalQuestions || 0}</span>
                  </div>
                </div>
              </div>
            `;
          }
        }).join('')}
      </div>
    `;
  },

  // Handle avatar upload
  handleAvatarUpload: async ({ file, button, input }) => {
    if (!file) return;

    const session = store.session.load();
    if (!session) {
      ui.toast('Please log in to change your avatar.', 'error');
      return;
    }

    if (!file.type.startsWith('image/')) {
      ui.toast('Please choose an image file (PNG or JPG).', 'error');
      if (input) input.value = '';
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = 'Uploading...';
    }

    try {
      let avatarUrl = '';
      const hasFirebase = typeof firebaseServices !== 'undefined' && firebaseServices?.isInitialized?.();
      const firebaseUser = (typeof firebaseAuth !== 'undefined' && typeof firebaseAuth.getCurrentUser === 'function') ? firebaseAuth.getCurrentUser() : null;
      const canUseFirebaseStorage = hasFirebase && firebaseUser && typeof firebaseStorage !== 'undefined' && typeof firebaseStorage.uploadImage === 'function';

      if (canUseFirebaseStorage) {
        const uploadResult = await firebaseStorage.uploadImage(file);
        avatarUrl = uploadResult?.url || '';
      } else {
        avatarUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error || new Error('Failed to read image'));
          reader.readAsDataURL(file);
        });
      }

      if (!avatarUrl) {
        throw new Error('Upload did not return an image URL.');
      }

      store.profiles.update(session.username, { avatarUrl });

      if (hasFirebase && firebaseUser?.uid && typeof firebaseDB !== 'undefined' && firebaseDB?.profiles?.update) {
        try {
          await firebaseDB.profiles.update(firebaseUser.uid, { avatarUrl });
        } catch (error) {
          console.warn('Failed to sync avatar with Firebase profile:', error);
        }
      }

      ui.toast('Profile photo updated!', 'success');
      ui.mountNav();
      profilePage.loadProfile(session.username);
    } catch (error) {
      console.error('Avatar upload error:', error);
      ui.toast(error?.message || 'Failed to upload avatar', 'error');
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = 'Change Photo';
      }
      if (input) {
        input.value = '';
      }
    }
  },

  // Handle follow
  handleFollow: async (username) => {
    const session = store.session.load();
    if (!session) return;

    const isFollowing = store.follows.isFollowing(session.username, username);

    try {
      if (isFollowing) {
        store.follows.unfollow(session.username, username);
        ui.toast(`Unfollowed ${username}`, 'info');
      } else {
        store.follows.follow(session.username, username);
        ui.toast(`Following ${username}`, 'success');
      }
      
      // Reload profile to update counts
      profilePage.loadProfile(username);
    } catch (e) {
      ui.toast('Failed to update follow status', 'error');
    }
  }
};

