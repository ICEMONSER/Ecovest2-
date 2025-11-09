// Session and data storage management

let inMemorySession = null;

const store = {
  // Session management
  session: {
    load: () => {
      const storages = [];

      if (typeof window !== 'undefined') {
        try {
          if (window.localStorage) storages.push(window.localStorage);
        } catch (error) {
          console.warn('localStorage unavailable, falling back:', error);
        }
        try {
          if (window.sessionStorage) storages.push(window.sessionStorage);
        } catch (error) {
          console.warn('sessionStorage unavailable:', error);
        }
      }

      for (const storage of storages) {
        try {
          const data = storage.getItem(CONFIG.SESSION_KEY);
          if (data) {
            return JSON.parse(data);
          }
        } catch (error) {
          console.warn('Failed to read session from storage:', error);
        }
      }

      if (inMemorySession) {
        return inMemorySession;
      }

      return null;
    },
    save: (data) => {
      const payload = JSON.stringify(data);
      const storages = [];

      if (typeof window !== 'undefined') {
        try {
          if (window.localStorage) storages.push(window.localStorage);
        } catch (error) {
          console.warn('localStorage unavailable, trying alternatives:', error);
        }
        try {
          if (window.sessionStorage) storages.push(window.sessionStorage);
        } catch (error) {
          console.warn('sessionStorage unavailable:', error);
        }
      }

      for (const storage of storages) {
        try {
          storage.setItem(CONFIG.SESSION_KEY, payload);
          inMemorySession = data;
        return true;
        } catch (error) {
          console.warn('Failed to write session to storage:', error);
        }
      }

      console.warn('All persistent storage options failed. Session will be kept in memory only.');
      inMemorySession = data;
      return true;
    },
    clear: () => {
      if (typeof window === 'undefined') return;

      try {
        window.localStorage?.removeItem(CONFIG.SESSION_KEY);
      } catch (error) {
        console.warn('Failed to clear localStorage session:', error);
      }

      try {
        window.sessionStorage?.removeItem(CONFIG.SESSION_KEY);
      } catch (error) {
        console.warn('Failed to clear sessionStorage session:', error);
      }

      inMemorySession = null;
    }
  },

  // Posts management
  posts: {
    getAll: () => {
      try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.POSTS);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        return [];
      }
    },
    save: (posts) => {
      try {
        localStorage.setItem(CONFIG.STORAGE_KEYS.POSTS, JSON.stringify(posts));
        return true;
      } catch (e) {
        console.error('Failed to save posts:', e);
        // Should not happen with IndexedDB for media
        return false;
      }
    },
    add: (post) => {
      const posts = store.posts.getAll();
      posts.unshift(post);
      return store.posts.save(posts);
    },
    update: (id, updates) => {
      const posts = store.posts.getAll();
      const index = posts.findIndex(p => p.id === id);
      if (index !== -1) {
        posts[index] = { ...posts[index], ...updates };
        return store.posts.save(posts);
      }
      return false;
    },
    remove: (id) => {
      const posts = store.posts.getAll();
      const filtered = posts.filter(p => p.id !== id);
      return store.posts.save(filtered);
    }
  },

  // Comments management
  comments: {
    getAll: () => {
      try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.COMMENTS);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        return [];
      }
    },
    save: (comments) => {
      try {
        localStorage.setItem(CONFIG.STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
        return true;
      } catch (e) {
        return false;
      }
    },
    add: (comment) => {
      const comments = store.comments.getAll();
      comments.push(comment);
      return store.comments.save(comments);
    },
    update: (id, updates) => {
      const comments = store.comments.getAll();
      const index = comments.findIndex(c => c.id === id);
      if (index !== -1) {
        comments[index] = { ...comments[index], ...updates };
        return store.comments.save(comments);
      }
      return false;
    },
    remove: (id) => {
      const comments = store.comments.getAll();
      const filtered = comments.filter(c => c.id !== id);
      const removed = filtered.length !== comments.length;
      if (removed) {
        store.comments.save(filtered);
      }
      return removed;
    }
  },

  // Game history
  gameHistory: {
    getAll: (username) => {
      try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.GAME_HISTORY);
        const all = data ? JSON.parse(data) : [];
        return username ? all.filter(h => h.username === username) : all;
      } catch (e) {
        return [];
      }
    },
    add: (record) => {
      const history = store.gameHistory.getAll();
      history.unshift(record);
      try {
        localStorage.setItem(CONFIG.STORAGE_KEYS.GAME_HISTORY, JSON.stringify(history));
        return true;
      } catch (e) {
        return false;
      }
    }
  },

  // User profiles
  profiles: {
    get: (username) => {
      try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_PROFILES);
        const profiles = data ? JSON.parse(data) : {};
        if (!profiles[username]) {
          return {
            username,
            profileScore: 0,
            level: 'Novice',
            followers: 0,
            following: 0,
            avatarUrl: null,
            avatarUpdatedAt: 0,
            roles: []
          };
        }
        const profile = profiles[username];
        return {
          avatarUrl: null,
          avatarUpdatedAt: 0,
          roles: Array.isArray(profile.roles) ? profile.roles : (profile.role ? [profile.role] : []),
          ...profile
        };
      } catch (e) {
        return { username, profileScore: 0, level: 'Novice', followers: 0, following: 0, avatarUrl: null, roles: [] };
      }
    },
    update: (username, updates) => {
      try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_PROFILES);
        const profiles = data ? JSON.parse(data) : {};
        if (!profiles[username]) {
          profiles[username] = {
            username,
            profileScore: 0,
            level: 'Novice',
            followers: 0,
            following: 0,
            avatarUrl: null,
            avatarUpdatedAt: 0,
            roles: []
          };
        }
        const current = profiles[username];
        const mergedRoles = updates.roles
          ? (Array.isArray(updates.roles) ? updates.roles : [updates.roles])
          : (Array.isArray(current.roles) ? current.roles : (current.role ? [current.role] : []));

        profiles[username] = {
          ...current,
          ...updates,
          avatarUpdatedAt: updates.avatarUpdatedAt ?? current.avatarUpdatedAt ?? Date.now(),
          roles: mergedRoles
        };
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_PROFILES, JSON.stringify(profiles));
        return true;
      } catch (e) {
        return false;
      }
    }
  },

  // User accounts (email-based)
  accounts: {
    getAll: () => {
      try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_ACCOUNTS);
        return data ? JSON.parse(data) : {};
      } catch (e) {
        return {};
      }
    },
    getByEmail: (email) => {
      const accounts = store.accounts.getAll();
      return accounts[email.toLowerCase()] || null;
    },
    create: (email, username, passwordHash) => {
      try {
        const accounts = store.accounts.getAll();
        const emailLower = email.toLowerCase();
        if (accounts[emailLower]) {
          return { success: false, error: 'Email already registered' };
        }
        accounts[emailLower] = {
          email: emailLower,
          username,
          passwordHash, // In real app, this would be hashed
          createdAt: Date.now()
        };
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_ACCOUNTS, JSON.stringify(accounts));
        return { success: true };
      } catch (e) {
        return { success: false, error: 'Failed to create account' };
      }
    }
  },

  // Password reset OTPs
  passwordResets: {
    getAll: () => {
      try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.PASSWORD_RESETS);
        return data ? JSON.parse(data) : {};
      } catch (e) {
        return {};
      }
    },
    saveAll: (otps) => {
      localStorage.setItem(CONFIG.STORAGE_KEYS.PASSWORD_RESETS, JSON.stringify(otps));
    },
    generateOTP: (email) => {
      const otps = store.passwordResets.getAll();
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 1000 * 60 * 10; // 10 minutes
      const emailLower = email.toLowerCase();
      
      // Remove any existing OTP for this email
      Object.keys(otps).forEach(key => {
        if (otps[key].email === emailLower) {
          delete otps[key];
        }
      });
      
      otps[otp] = { email: emailLower, expiresAt, attempts: 0 };
      store.passwordResets.saveAll(otps);
      return { otp, expiresAt };
    },
    verifyOTP: (otp, email) => {
      const otps = store.passwordResets.getAll();
      const entry = otps[otp];
      if (!entry) return { valid: false, error: 'Invalid OTP' };
      
      if (Date.now() > entry.expiresAt) {
        delete otps[otp];
        store.passwordResets.saveAll(otps);
        return { valid: false, error: 'OTP has expired' };
      }
      
      if (entry.email !== email.toLowerCase()) {
        entry.attempts = (entry.attempts || 0) + 1;
        if (entry.attempts >= 5) {
          delete otps[otp];
          store.passwordResets.saveAll(otps);
          return { valid: false, error: 'Too many failed attempts. Please request a new OTP.' };
        }
        store.passwordResets.saveAll(otps);
        return { valid: false, error: 'OTP does not match this email' };
      }
      
      // OTP is valid, consume it
      delete otps[otp];
      store.passwordResets.saveAll(otps);
      return { valid: true, email: entry.email };
    }
  },

  // Maintenance helpers
  maintenance: {
    updatePasswordByEmail: (email, newPasswordHash) => {
      const accounts = store.accounts.getAll();
      const emailLower = email.toLowerCase();
      if (!accounts[emailLower]) return false;
      accounts[emailLower].passwordHash = newPasswordHash;
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_ACCOUNTS, JSON.stringify(accounts));
      return true;
    },
    removeAccountByEmail: (email) => {
      try {
        const accounts = store.accounts.getAll();
        const emailLower = email.toLowerCase();
        const username = accounts[emailLower]?.username;
        if (!username) return false;

        // Remove account
        delete accounts[emailLower];
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_ACCOUNTS, JSON.stringify(accounts));

        // Remove profile
        const profilesData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_PROFILES);
        const profiles = profilesData ? JSON.parse(profilesData) : {};
        delete profiles[username];
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_PROFILES, JSON.stringify(profiles));

        // Remove posts
        const posts = store.posts.getAll().filter(p => p.username !== username);
        store.posts.save(posts);

        // Remove comments
        const comments = store.comments.getAll().filter(c => c.username !== username);
        store.comments.save(comments);

        // Remove follows
        const follows = store.follows.getAll();
        delete follows[username];
        Object.keys(follows).forEach(user => {
          follows[user] = (follows[user] || []).filter(u => u !== username);
        });
        localStorage.setItem(CONFIG.STORAGE_KEYS.FOLLOWS, JSON.stringify(follows));

        // Remove game history
        const historyData = localStorage.getItem(CONFIG.STORAGE_KEYS.GAME_HISTORY);
        const history = historyData ? JSON.parse(historyData) : [];
        const remaining = history.filter(h => h.username !== username);
        localStorage.setItem(CONFIG.STORAGE_KEYS.GAME_HISTORY, JSON.stringify(remaining));

        return true;
      } catch (e) {
        return false;
      }
    },
    renameUsername: (oldUsername, newUsername) => {
      if (!oldUsername || !newUsername) {
        return { success: false, error: 'Username is required.' };
      }

      const trimmed = newUsername.trim();
      if (!trimmed) {
        return { success: false, error: 'Username cannot be empty.' };
      }

      if (trimmed === oldUsername) {
        return { success: true, username: trimmed, unchanged: true };
      }

      try {
        // Validate characters (letters, numbers, underscore)
        const pattern = /^[A-Za-z0-9_]{3,20}$/;
        if (!pattern.test(trimmed)) {
          return { success: false, error: 'Usernames must be 3-20 characters using letters, numbers, or _.' };
        }

        const profilesRaw = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_PROFILES);
        const profiles = profilesRaw ? JSON.parse(profilesRaw) : {};

        if (!profiles[oldUsername]) {
          return { success: false, error: 'Original profile not found.' };
        }

        if (profiles[trimmed]) {
          return { success: false, error: 'That username is already taken.' };
        }

        const updatedProfile = { ...profiles[oldUsername], username: trimmed };
        delete profiles[oldUsername];
        profiles[trimmed] = updatedProfile;
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_PROFILES, JSON.stringify(profiles));

        // Update accounts mapping (email -> username)
        const accounts = store.accounts.getAll();
        let accountChanged = false;
        Object.keys(accounts).forEach(email => {
          if (accounts[email]?.username === oldUsername) {
            accounts[email].username = trimmed;
            accountChanged = true;
          }
        });
        if (accountChanged) {
          localStorage.setItem(CONFIG.STORAGE_KEYS.USER_ACCOUNTS, JSON.stringify(accounts));
        }

        // Update posts
        const posts = store.posts.getAll();
        let postsTouched = false;
        posts.forEach(post => {
          if (post.username === oldUsername) {
            post.username = trimmed;
            postsTouched = true;
          }
        });
        if (postsTouched) {
          store.posts.save(posts);
        }

        // Update comments
        const comments = store.comments.getAll();
        let commentsTouched = false;
        comments.forEach(comment => {
          if (comment.username === oldUsername) {
            comment.username = trimmed;
            commentsTouched = true;
          }
        });
        if (commentsTouched) {
          store.comments.save(comments);
        }

        // Update follows
        const follows = store.follows.getAll();
        let followsChanged = false;
        if (follows[oldUsername]) {
          follows[trimmed] = follows[oldUsername];
          delete follows[oldUsername];
          followsChanged = true;
        }
        Object.keys(follows).forEach(user => {
          const list = follows[user] || [];
          const index = list.indexOf(oldUsername);
          if (index !== -1) {
            list[index] = trimmed;
            followsChanged = true;
          }
        });
        if (followsChanged) {
          localStorage.setItem(CONFIG.STORAGE_KEYS.FOLLOWS, JSON.stringify(follows));
        }

        // Update game history records
        const historyRaw = localStorage.getItem(CONFIG.STORAGE_KEYS.GAME_HISTORY);
        if (historyRaw) {
          const history = JSON.parse(historyRaw);
          let historyChanged = false;
          history.forEach(entry => {
            if (entry.username === oldUsername) {
              entry.username = trimmed;
              historyChanged = true;
            }
          });
          if (historyChanged) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.GAME_HISTORY, JSON.stringify(history));
          }
        }

        // Update session if needed
        const session = store.session.load();
        if (session?.username === oldUsername) {
          store.session.save({ ...session, username: trimmed });
        }

        return { success: true, username: trimmed };
      } catch (error) {
        console.error('Failed to rename username:', error);
        return { success: false, error: 'Failed to rename user.' };
      }
    }
  },

  // Follow system
  follows: {
    getAll: () => {
      try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.FOLLOWS);
        return data ? JSON.parse(data) : {};
      } catch (e) {
        return {};
      }
    },
    getFollowing: (username) => {
      const follows = store.follows.getAll();
      return follows[username] || [];
    },
    getFollowers: (username) => {
      const follows = store.follows.getAll();
      const followers = [];
      Object.keys(follows).forEach(follower => {
        if (follows[follower].includes(username)) {
          followers.push(follower);
        }
      });
      return followers;
    },
    follow: (follower, followee) => {
      if (follower === followee) return false;
      try {
        const follows = store.follows.getAll();
        if (!follows[follower]) {
          follows[follower] = [];
        }
        if (!follows[follower].includes(followee)) {
          follows[follower].push(followee);
          localStorage.setItem(CONFIG.STORAGE_KEYS.FOLLOWS, JSON.stringify(follows));
          
          // Update follower/following counts
          const followerProfile = store.profiles.get(follower);
          const followeeProfile = store.profiles.get(followee);
          store.profiles.update(follower, { following: followerProfile.following + 1 });
          store.profiles.update(followee, { followers: followeeProfile.followers + 1 });
          
          return true;
        }
        return false;
      } catch (e) {
        return false;
      }
    },
    unfollow: (follower, followee) => {
      try {
        const follows = store.follows.getAll();
        if (follows[follower] && follows[follower].includes(followee)) {
          follows[follower] = follows[follower].filter(u => u !== followee);
          localStorage.setItem(CONFIG.STORAGE_KEYS.FOLLOWS, JSON.stringify(follows));
          
          // Update follower/following counts
          const followerProfile = store.profiles.get(follower);
          const followeeProfile = store.profiles.get(followee);
          store.profiles.update(follower, { following: Math.max(0, followerProfile.following - 1) });
          store.profiles.update(followee, { followers: Math.max(0, followeeProfile.followers - 1) });
          
          return true;
        }
        return false;
      } catch (e) {
        return false;
      }
    },
    isFollowing: (follower, followee) => {
      const follows = store.follows.getAll();
      return follows[follower] && follows[follower].includes(followee);
    }
  },

  // Initialize sample data
  initSampleData: () => {
    try {
      if (typeof localStorage !== 'undefined') {
        const feedVersion = localStorage.getItem(CONFIG.STORAGE_KEYS.FEED_VERSION);
        if (feedVersion === CONFIG.FEED_DATA_VERSION) {
          return;
        }
      }
    } catch (error) {
      console.warn('Unable to check feed version flag:', error);
    }

    // Check if data already exists
    if (store.posts.getAll().length > 0) return;

    const samplePosts = [
      {
        id: '1',
        username: 'tradingpro',
        content: 'Just hit Pro level! 📈 #pro #trading #success',
        tags: ['#pro', '#trading', '#success'],
        image: null,
        likes: 15,
        comments: 3,
        createdAt: Date.now() - 3600000
      },
      {
        id: '2',
        username: 'investor_jane',
        content: 'Great beginner tips: Start small, diversify, and stay patient. #beginner #tips #dividend',
        tags: ['#beginner', '#tips', '#dividend'],
        image: null,
        likes: 8,
        comments: 2,
        createdAt: Date.now() - 7200000
      },
      {
        id: '3',
        username: 'market_watch',
        content: 'Understanding risk management is crucial for intermediate traders. What strategies do you use? #intermediate #risk #strategy',
        tags: ['#intermediate', '#risk', '#strategy'],
        image: null,
        likes: 12,
        comments: 5,
        createdAt: Date.now() - 10800000
      }
    ];

    const sampleComments = [
      {
        id: '1',
        postId: '1',
        username: 'congrats_fan',
        content: 'Congratulations! 🎉',
        guided: false,
        createdAt: Date.now() - 3500000
      },
      {
        id: '2',
        postId: '1',
        username: 'newbie_trader',
        content: 'How long did it take you to reach Pro?',
        guided: false,
        createdAt: Date.now() - 3400000
      },
      {
        id: '3',
        postId: '2',
        username: 'tradingpro',
        content: 'Excellent advice for beginners!',
        guided: true,
        createdAt: Date.now() - 7100000
      }
    ];

    store.posts.save(samplePosts);
    store.comments.save(sampleComments);
  }
};

store.maintenance.ensureFeedVersion = () => {
  try {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const currentVersion = localStorage.getItem(CONFIG.STORAGE_KEYS.FEED_VERSION);
    if (currentVersion !== CONFIG.FEED_DATA_VERSION) {
      store.maintenance.clearFeed();
    }
  } catch (error) {
    console.warn('Failed to ensure feed version:', error);
  }
};

store.maintenance.clearFeed = () => {
  try {
    store.posts.save([]);
    store.comments.save([]);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CONFIG.STORAGE_KEYS.FEED_VERSION, CONFIG.FEED_DATA_VERSION);
    }

    return true;
  } catch (error) {
    console.error('Failed to clear community feed:', error);
    return false;
  }
};

