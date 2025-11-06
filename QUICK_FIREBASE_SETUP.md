# Quick Firebase Setup - Make Posts Sync Across Devices

Your posts are currently saving to localStorage (local only). To make them sync across devices, you need to set up Firebase.

## The Problem
- Posts save to localStorage → Only visible on the same device/browser
- Need Firebase → Posts sync across all devices in real-time

## Quick Setup (5 minutes)

### Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add project" or "Create a project"
3. Name it "EcoVest" (or any name)
4. Click through the setup (you can skip Google Analytics)

### Step 2: Enable Services
1. **Authentication:**
   - Click "Authentication" → "Get started"
   - Click "Sign-in method" → Enable "Email/Password"

2. **Realtime Database:**
   - Click "Realtime Database" → "Create Database"
   - Choose location (closest to you)
   - Choose "Start in production mode" (or "Start in locked mode")
   - Then immediately go to "Rules" tab and add the security rules below

3. **Storage (OPTIONAL - Skip if you don't want to pay):**
   - **Option A (Free):** Skip this step! The app will use IndexedDB for media storage (works locally)
   - **Option B (Free Alternative):** Use a free image hosting service (see alternatives below)
   - **Option C (Paid):** If you want cloud storage, click "Storage" → "Upgrade project" (requires billing)
  
### Step 3: Get Your Config
1. Click the gear icon ⚙️ → "Project settings"
2. Scroll to "Your apps"
3. Click the web icon `</>`
4. Register app: "EcoVest Web"
5. Copy the config values

### Step 4: Add Config to Your HTML

Open `index.html` and find this section (around line 187):

```html
<script>
  window.__ENV = window.__ENV || {
    FIREBASE_API_KEY: '',
    FIREBASE_AUTH_DOMAIN: '',
    FIREBASE_DATABASE_URL: '',
    FIREBASE_PROJECT_ID: '',
    FIREBASE_STORAGE_BUCKET: '',
    FIREBASE_MESSAGING_SENDER_ID: '',
    FIREBASE_APP_ID: ''
  };
</script>
```

Replace the empty strings with your Firebase values:

```html
<script>
  window.__ENV = window.__ENV || {
    FIREBASE_API_KEY: 'AIzaSy...',  // Your API key
    FIREBASE_AUTH_DOMAIN: 'your-project.firebaseapp.com',
    FIREBASE_DATABASE_URL: 'https://your-project-default-rtdb.firebaseio.com',
    FIREBASE_PROJECT_ID: 'your-project-id',
    FIREBASE_STORAGE_BUCKET: 'your-project.appspot.com',
    FIREBASE_MESSAGING_SENDER_ID: '123456789',
    FIREBASE_APP_ID: '1:123456789:web:abc123'
  };
</script>
```

**Do the same for:**
- `feed.html`
- `game.html`
- `profile.html`

### Step 5: Set Database Rules (IMPORTANT - Do this right after creating database)

1. Go to Firebase Console → Realtime Database → Rules tab
2. Replace the default rules with:

```json
{
  "rules": {
    "posts": {
      ".read": true,
      ".write": "auth != null"
    },
    "comments": {
      ".read": true,
      ".write": "auth != null"
    },
    "profiles": {
      ".read": true,
      "$uid": {
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "follows": {
      ".read": "auth != null",
      "$uid": {
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "gameHistory": {
      ".read": "auth != null",
      "$uid": {
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "usernames": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

3. Click "Publish"

### Step 6: Set Storage Rules (ONLY if you enabled Storage)

**If you skipped Storage (recommended for free):** You can skip this step entirely!

**If you enabled Firebase Storage:**
1. Go to Firebase Console → Storage → Rules tab
2. Replace the default rules with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /videos/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click "Publish"

## Free Alternatives for Media Storage

Since Firebase Storage requires a paid plan, here are **FREE alternatives**:

### Option 1: Use IndexedDB (Already Built-In) ✅
- **Cost:** FREE
- **How it works:** Media is stored in the browser's IndexedDB
- **Limitations:** Only works on the same device/browser
- **Status:** Already implemented! Works automatically if Firebase Storage is not configured

### Option 2: Free Image Hosting APIs
You can modify the code to use free image hosting services:

**Imgur API (Free):**
- Sign up at https://api.imgur.com/oauth2/addclient
- Get free API key
- Upload images to Imgur, get URLs back
- **Limits:** 1,250 uploads/day (free tier)

**Cloudinary (Free Tier):**
- Sign up at https://cloudinary.com/
- Free tier: 25GB storage, 25GB bandwidth/month
- Good for images and videos

**ImageKit (Free Tier):**
- Sign up at https://imagekit.io/
- Free tier: 20GB storage

### Option 3: Store Small Images in Database
- Convert images to base64
- Store directly in Firebase Realtime Database
- **Limitation:** Database has size limits, only works for small images

### Recommendation
**For now, just skip Firebase Storage!** The app already works with IndexedDB for media storage. It won't sync across devices, but:
- ✅ Posts and comments WILL sync (using Realtime Database)
- ✅ User profiles WILL sync
- ✅ Everything except media files will sync
- ✅ Media files work locally (same device)

You can add cloud media storage later if needed!

### Step 7: Test!

1. Refresh your website
2. Sign up with a new account (or sign in)
3. Create a post
4. Open the same site on another device/browser
5. **You should see the post appear in real-time!** 🎉

## How to Verify It's Working

1. Open browser console (F12)
2. Look for: "Firebase initialized successfully"
3. If you see "Firebase config incomplete" → Config not set up yet
4. If you see "Using localStorage fallback" → Firebase not configured

## Troubleshooting

**Posts still not syncing?**
- Check browser console for errors
- Verify Firebase config values are correct
- Make sure you updated ALL HTML files (index.html, feed.html, game.html, profile.html)
- Check Firebase Console → Realtime Database to see if posts are being saved

**"Firebase not initialized" error?**
- Check that all config values are filled in
- Make sure Firebase SDK scripts are loaded (check HTML files)
- Refresh the page after adding config

## After Setup

Once Firebase is configured (even without Storage):
- ✅ Posts sync across all devices instantly
- ✅ Comments appear in real-time
- ✅ Likes update immediately
- ✅ User profiles sync
- ✅ Follows sync
- ⚠️ Media files: Stored locally (IndexedDB) - only on same device
- ✅ Works on any device/browser (for posts/comments/profiles)

**Note:** If you skip Firebase Storage, media files (images/videos) will only be available on the device where they were uploaded. Posts, comments, and all other data will still sync across devices!

Your app will automatically use Firebase when configured, and fall back to localStorage if not configured (for development).

