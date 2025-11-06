// Utility functions

// DOM selectors
const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

// Mock HTTP client
const http = {
  get: (url, delay = CONFIG.API_DELAY) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = localStorage.getItem(url);
        resolve(data ? JSON.parse(data) : null);
      }, delay);
    });
  },
  post: (url, data, delay = CONFIG.API_DELAY) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const existing = localStorage.getItem(url);
        const items = existing ? JSON.parse(existing) : [];
        const newItem = { ...data, id: Date.now().toString(), createdAt: Date.now() };
        items.push(newItem);
        localStorage.setItem(url, JSON.stringify(items));
        resolve(newItem);
      }, delay);
    });
  },
  put: (url, id, data, delay = CONFIG.API_DELAY) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const existing = localStorage.getItem(url);
        const items = existing ? JSON.parse(existing) : [];
        const index = items.findIndex(item => item.id === id);
        if (index === -1) {
          reject(new Error('Not found'));
          return;
        }
        items[index] = { ...items[index], ...data, updatedAt: Date.now() };
        localStorage.setItem(url, JSON.stringify(items));
        resolve(items[index]);
      }, delay);
    });
  },
  delete: (url, id, delay = CONFIG.API_DELAY) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const existing = localStorage.getItem(url);
        const items = existing ? JSON.parse(existing) : [];
        const filtered = items.filter(item => item.id !== id);
        localStorage.setItem(url, JSON.stringify(filtered));
        resolve(true);
      }, delay);
    });
  }
};

// Debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Format time
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

// Sanitize HTML
const sanitize = (str) => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

// Extract tags from text
const extractTags = (text) => {
  const tagRegex = /#(\w+)/g;
  const matches = text.match(tagRegex);
  return matches ? [...new Set(matches)] : [];
};

// Get level from score
const getLevel = (score) => {
  if (score >= CONFIG.LEVELS.PRO.min) return 'Pro';
  if (score >= CONFIG.LEVELS.INTERMEDIATE.min) return 'Intermediate';
  if (score >= CONFIG.LEVELS.BEGINNER.min) return 'Beginner';
  return 'Novice';
};

// Get level badge color
const getLevelBadgeColor = (level) => {
  switch (level) {
    case 'Pro': return '#9B59B6';
    case 'Intermediate': return '#3498DB';
    case 'Beginner': return '#27AE60';
    default: return '#95A5A6';
  }
};

// Generate avatar placeholder
const getAvatarPlaceholder = (username) => {
  const initial = username.charAt(0).toUpperCase();
  return `<div class="avatar-placeholder" style="background-color: ${getLevelBadgeColor(getLevel(0))}">${initial}</div>`;
};

