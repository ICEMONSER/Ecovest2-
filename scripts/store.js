// Session and data storage management

const store = {
  // Session management
  session: {
    load: () => {
      try {
        const data = localStorage.getItem(CONFIG.SESSION_KEY);
        return data ? JSON.parse(data) : null;
      } catch (e) {
        return null;
      }
    },
    save: (data) => {
      try {
        localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(data));
        return true;
      } catch (e) {
        console.error('Failed to save session:', e);
        return false;
      }
    },
    clear: () => {
      localStorage.removeItem(CONFIG.SESSION_KEY);
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
        return profiles[username] || { username, profileScore: 0, level: 'Novice', followers: 0, following: 0 };
      } catch (e) {
        return { username, profileScore: 0, level: 'Novice', followers: 0, following: 0 };
      }
    },
    update: (username, updates) => {
      try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_PROFILES);
        const profiles = data ? JSON.parse(data) : {};
        if (!profiles[username]) {
          profiles[username] = { username, profileScore: 0, level: 'Novice', followers: 0, following: 0 };
        }
        profiles[username] = { ...profiles[username], ...updates };
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

  // Dev mode
  devMode: {
    isActive: () => {
      try {
        return localStorage.getItem(CONFIG.DEV_MODE.STORAGE_KEY) === 'true';
      } catch (e) {
        return false;
      }
    },
    activate: () => {
      localStorage.setItem(CONFIG.DEV_MODE.STORAGE_KEY, 'true');
    },
    deactivate: () => {
      localStorage.removeItem(CONFIG.DEV_MODE.STORAGE_KEY);
    }
  },

  // Initialize sample data
  initSampleData: () => {
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

