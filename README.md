# EcoVest+ - Trading Community Platform

A production-ready front-end trading community platform built with vanilla HTML, CSS, and JavaScript.

## Features

### 🔐 Authentication
- **Email-based accounts**: One account per email address
- **Persistent sessions**: Stay logged in across browser refreshes
- **Onboarding flow**: New users must complete trading game to access feed

### 🎮 Stock Trading Game
- **Buy/sell simulation**: Trade stocks across 8 rounds with real-time price fluctuations
- **Dynamic pricing**: ±10-30% price changes per round
- **Level progression**: Beginner (20-100 pts), Intermediate (130-200 pts), Pro (250+ pts)
- **Profile integration**: Scores and history saved to profile

### 📱 Community Feed
- **🎉 Unlimited media uploads**: Images AND videos of any size via IndexedDB
- **Multi-image posts**: Grid layout display
- **Video support**: MP4, WebM with controls
- **Edit/delete posts**: Manage your own content
- **Follow system**: Follow users, see their posts prioritized
- **Interactions**: Like, comment, tag posts
- **Sort & search**: Hot/New/Top sorting, keyword/tag search

### 👤 User Profiles
- **Stats display**: Level badges, profile score, follower/following counts
- **Activity tabs**: Posts, comments, achievements, game history
- **Follow management**: Follow/unfollow from profile pages

### 🛠️ Developer Mode
- **Secret activation**: Type "icemonster" in any input field
- **Admin powers**: Delete any post (not just your own)
- **Visual indicator**: Red border + ⚙️ icon when active

## How to Run

1. Simply open `index.html` in your browser, or
2. Use a local server (recommended):
   - VS Code: Install "Live Server" extension and right-click `index.html` → "Open with Live Server"
   - Python: `python -m http.server 8000` then visit `http://localhost:8000`
   - Node.js: `npx serve` then visit the provided URL

## Project Structure

```
ecovest-plus/
├── index.html          # Home page
├── feed.html           # Community feed
├── game.html           # Trading mini-game
├── profile.html        # User profile
├── terms.html          # Terms of service
├── styles/
│   ├── base.css        # CSS variables and base styles
│   ├── layout.css      # Layout components
│   ├── components.css  # Reusable components
│   └── pages.css       # Page-specific styles
├── scripts/
│   ├── config.js       # Configuration constants
│   ├── utils.js        # Utility functions
│   ├── indexedDB.js    # IndexedDB for unlimited media storage ⭐
│   ├── store.js        # Data storage management
│   ├── ui.js           # UI components and modals
│   ├── auth.js         # Email-based authentication
│   ├── api.js          # Mock API with IndexedDB support
│   ├── router.js       # Navigation helper
│   ├── index.js        # Home page logic
│   ├── feed.js         # Feed with unlimited uploads
│   ├── game.js         # Stock trading game logic
│   └── profile.js      # Profile page logic
└── public/
    └── uploads/        # Image uploads directory
```

## Technologies

- **HTML5**: Semantic markup, accessibility (ARIA)
- **CSS3**: CSS Variables, Grid, Flexbox, animations
- **Vanilla JavaScript (ES6+)**: Modular architecture, async/await
- **LocalStorage**: Session and metadata storage
- **IndexedDB**: Unlimited media file storage (images & videos)

## User Levels

- **Novice**: 0-19 points
- **Beginner**: 20-100 points
- **Intermediate**: 130-200 points
- **Pro**: 250+ points

## Demo Credentials

For demo purposes, any username/password combination will work. The app uses localStorage for data persistence, so your session and data will persist across page reloads.

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge) with ES6+ support.

## License

This is a demo project for educational purposes.

