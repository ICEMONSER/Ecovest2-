# EcoVest+ - Trading Community Platform

A production-ready trading community platform with **real-time cloud sync** using Firebase Realtime Database. Posts sync across all devices instantly!

🌐 **Live Demo:** [View on GitHub Pages](#deployment)

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
- **🌐 Real-time cloud sync**: Posts visible on ALL devices instantly via Firebase
- **🎉 Unlimited media uploads**: Images AND videos of any size via IndexedDB/Firebase Storage
- **Multi-image posts**: Grid layout display
- **Video support**: MP4, WebM with controls
- **Edit/delete posts**: Manage your own content
- **Follow system**: Follow users, see their posts prioritized
- **Interactions**: Like, comment, tag posts
- **Sort & search**: Hot/New/Top sorting, keyword/tag search
- **Auto-updates**: New posts appear automatically without refresh

### 👤 User Profiles
- **Stats display**: Level badges, profile score, follower/following counts
- **Activity tabs**: Posts, comments, achievements, game history
- **Follow management**: Follow/unfollow from profile pages

### 🛠️ Developer Mode
- **Secret activation**: Type "icemonster" in any input field
- **Admin powers**: Delete any post (not just your own)
- **Visual indicator**: Red border + ⚙️ icon when active

## 🚀 Deployment

### GitHub Pages (Recommended)

Since you've already uploaded to GitHub:

1. Go to your repository → **Settings** → **Pages**
2. Under **Source**, select:
   - **Branch:** `main` (or `master`)
   - **Folder:** `/ (root)`
3. Click **Save**
4. Wait 1-2 minutes, then visit: `https://<your-username>.github.io/Ecovest2-/`

**Your site is now live!** 🎉

### Local Development

1. Simply open `index.html` in your browser, or
2. Use a local server (recommended):
   - VS Code: Install "Live Server" extension and right-click `index.html` → "Open with Live Server"
   - Python: `python -m http.server 8000` then visit `http://localhost:8000`
   - Node.js: `npx serve` then visit the provided URL

### Firebase Setup Required

Before using, set up Firebase:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **ecovest-37a65**
3. Enable **Realtime Database** and set rules (see `QUICK_FIREBASE_SETUP.md`)
4. Enable **Authentication** → Email/Password
5. Done! Posts will sync across all devices.

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
│   ├── config.js          # Configuration constants
│   ├── utils.js           # Utility functions
│   ├── indexedDB.js       # IndexedDB for unlimited media storage ⭐
│   ├── store.js           # Data storage management (fallback)
│   ├── ui.js              # UI components and modals
│   ├── auth.js            # Email-based authentication
│   ├── api.js             # API with Firebase + localStorage fallback
│   ├── router.js          # Navigation helper
│   ├── index.js           # Home page logic
│   ├── feed.js            # Feed with real-time sync
│   ├── game.js            # Stock trading game logic
│   ├── profile.js         # Profile page logic
│   ├── firebase-config.js # Firebase initialization
│   ├── firebase-auth.js   # Firebase Authentication
│   ├── firebase-db.js     # Firebase Realtime Database
│   └── firebase-storage.js # Firebase Storage
└── public/
    └── uploads/        # Image uploads directory
```

## Technologies

- **HTML5**: Semantic markup, accessibility (ARIA)
- **CSS3**: CSS Variables, Grid, Flexbox, animations
- **Vanilla JavaScript (ES6+)**: Modular architecture, async/await
- **Firebase Realtime Database**: Cloud storage with real-time sync
- **Firebase Authentication**: Email/password authentication
- **Firebase Storage**: Cloud media storage (optional)
- **LocalStorage**: Session and metadata storage (fallback)
- **IndexedDB**: Unlimited media file storage (images & videos)

## User Levels

- **Novice**: 0-19 points
- **Beginner**: 20-100 points
- **Intermediate**: 130-200 points
- **Pro**: 250+ points

## 🔥 Firebase Integration

This app uses **Firebase Realtime Database** for cloud sync:
- ✅ Posts sync across all devices in real-time
- ✅ New accounts see all existing posts
- ✅ Automatic updates (no refresh needed)
- ✅ Works with Firebase Auth (email/password)

**Setup:** See `QUICK_FIREBASE_SETUP.md` for detailed instructions.

## Demo Credentials

- **With Firebase:** Sign up with any email/password (stored in Firebase)
- **Without Firebase:** Uses localStorage fallback (local only)
- Sessions persist across page reloads

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge) with ES6+ support.

## License

This is a demo project for educational purposes.

