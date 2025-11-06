// Configuration constants
const CONFIG = {
  SESSION_KEY: 'ev.session.v1',
  STORAGE_KEYS: {
    POSTS: 'ev.posts',
    COMMENTS: 'ev.comments',
    GAME_HISTORY: 'ev.gameHistory',
    USER_PROFILES: 'ev.userProfiles',
    USER_ACCOUNTS: 'ev.userAccounts',
    FOLLOWS: 'ev.follows'
  },
  LEVELS: {
    BEGINNER: { min: 20, max: 100 },
    INTERMEDIATE: { min: 130, max: 200 },
    PRO: { min: 250, max: Infinity }
  },
  GAME: {
    INITIAL_COINS: 1000,
    TOTAL_ROUNDS: 8,
    COMPANIES_PER_ROUND: 2,
    PRICE_FLUCTUATION_MIN: 0.10, // 10%
    PRICE_FLUCTUATION_MAX: 0.30 // 30%
  },
  IMAGE: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  },
  VIDEO: {
    MAX_SIZE: 20 * 1024 * 1024, // 20MB
    ALLOWED_TYPES: ['video/mp4', 'video/webm', 'video/quicktime']
  },
  DEV_MODE: {
    CODE: 'icemonster',
    STORAGE_KEY: 'ev.devMode'
  },
  API_DELAY: 300 // mock API delay in ms
};

