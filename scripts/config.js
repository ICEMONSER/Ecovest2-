// Configuration constants
const CONFIG = {
  SESSION_KEY: 'ev.session.v1',
  STORAGE_KEYS: {
    POSTS: 'ev.posts',
    COMMENTS: 'ev.comments',
    GAME_HISTORY: 'ev.gameHistory',
    GAME_PROGRESS: 'ev.escapeGame.progress',
    USER_PROFILES: 'ev.userProfiles',
    USER_ACCOUNTS: 'ev.userAccounts',
    FOLLOWS: 'ev.follows',
    PASSWORD_RESETS: 'ev.passwordResets',
    FEED_VERSION: 'ev.feed.version'
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
  ESCAPE_GAME: {
    BOARD_SIZE: 16,
    PASSIVE_GOAL_MULTIPLIER: 1,
    DOWNSIZE_TURNS: 1,
    CHARITY_BONUS: 200,
    STEP_DELAY: 240,
    SMALL_DEAL_RANGE: { minCost: 200, maxCost: 1200 },
    BIG_DEAL_RANGE: { minCost: 1500, maxCost: 8000 },
    MAX_EVENT_LOG: 6
  },
  IMAGE: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  },
  VIDEO: {
    MAX_SIZE: 20 * 1024 * 1024, // 20MB
    ALLOWED_TYPES: ['video/mp4', 'video/webm', 'video/quicktime']
  },
  FEED_DATA_VERSION: 'v2.empty',
  API_DELAY: 300, // mock API delay in ms
  EMAILJS: {
    SERVICE_ID: 'service_qttkvw8', // Replace with your EmailJS service ID
    TEMPLATE_ID: 'template_332l4o3', // Replace with your EmailJS template ID
    PUBLIC_KEY: 'hYqF4YXmZYqyx-kB-' // Replace with your EmailJS public key
  }
};

