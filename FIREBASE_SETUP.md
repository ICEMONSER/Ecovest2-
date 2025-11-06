# Firebase Setup Guide for EcoVest+

This guide will help you set up Firebase for cloud storage and real-time features.

## Prerequisites

- A Google account
- A Firebase project (free tier is sufficient)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** or **Create a project**
3. Enter project name: `EcoVest` (or your preferred name)
4. Disable Google Analytics (optional, or enable if you want)
5. Click **Create project**
6. Wait for project creation to complete

## Step 2: Enable Firebase Services

### Enable Authentication

1. In Firebase Console, click **Authentication** in left sidebar
2. Click **Get started**
3. Click **Sign-in method** tab
4. Click **Email/Password**
5. Enable **Email/Password** (toggle ON)
6. Click **Save**

### Enable Realtime Database

1. Click **Realtime Database** in left sidebar
2. Click **Create Database**
3. Choose location (select closest to your users)
4. Choose **Start in test mode** (we'll add security rules later)
5. Click **Enable**

### Enable Storage

1. Click **Storage** in left sidebar
2. Click **Get started**
3. Choose **Start in test mode** (we'll add security rules later)
4. Click **Next** → **Done**

## Step 3: Get Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ → **Project settings**
2. Scroll down to **Your apps** section
3. Click the **Web** icon `</>`
4. Register app name: `EcoVest Web`
5. **Don't** check "Also set up Firebase Hosting" (we're using Vercel/Netlify)
6. Click **Register app**
7. Copy the `firebaseConfig` object values

You'll see something like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 4: Configure Environment Variables

### Option A: For Development (Local)

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Firebase values:
   ```
   FIREBASE_API_KEY=AIzaSy...
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
   FIREBASE_PROJECT_ID=your-project
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=123456789
   FIREBASE_APP_ID=1:123456789:web:abc123
   ```

3. For local development, you'll need to inject these into `window.__ENV`. Create a simple script or use a build tool.

### Option B: For Production (Vercel/Netlify)

#### Vercel:
1. Go to your project in Vercel dashboard
2. Go to **Settings** → **Environment Variables**
3. Add each Firebase variable:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_DATABASE_URL`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`

4. Update your build script to inject these into HTML (see below)

#### Netlify:
1. Go to your site in Netlify dashboard
2. Go to **Site settings** → **Environment variables**
3. Add each Firebase variable (same as Vercel)

## Step 5: Inject Environment Variables into HTML

For production, you need to inject environment variables into `window.__ENV` before the page loads.

### Option A: Build Script (Recommended)

Create a simple Node.js script to inject env vars:

```javascript
// scripts/inject-env.js
const fs = require('fs');
const path = require('path');

const envVars = {
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || '',
  FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || '',
  FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL || '',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || '',
  FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || ''
};

const htmlFiles = ['index.html', 'feed.html', 'game.html', 'profile.html'];

htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  const envScript = `<script>
    window.__ENV = ${JSON.stringify(envVars)};
  </script>`;
  
  // Replace the placeholder window.__ENV
  content = content.replace(
    /window\.__ENV = window\.__ENV \|\| \{[\s\S]*?\};/,
    `window.__ENV = ${JSON.stringify(envVars)};`
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
```

Run before deploying:
```bash
node scripts/inject-env.js
```

### Option B: Server-Side Injection

If using a server (Node.js, PHP, etc.), inject env vars server-side before serving HTML.

## Step 6: Set Up Database Security Rules

1. In Firebase Console, go to **Realtime Database** → **Rules**
2. Replace with these rules (adjust as needed):

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

3. Click **Publish**

## Step 7: Set Up Storage Security Rules

1. In Firebase Console, go to **Storage** → **Rules**
2. Replace with:

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

3. Click **Publish**

## Step 8: Test the Integration

1. Open your website
2. Try signing up with a new account
3. Create a post
4. Check Firebase Console → **Realtime Database** to see data
5. Check **Storage** to see uploaded media

## Troubleshooting

**"Firebase not initialized" error:**
- Check that Firebase SDK scripts are loaded in HTML
- Verify environment variables are set correctly
- Check browser console for errors

**"Permission denied" error:**
- Check Database and Storage security rules
- Ensure user is authenticated

**Data not syncing:**
- Check database URL is correct
- Verify Firebase project is active
- Check browser console for connection errors

## Next Steps

- Set up Firebase Hosting (optional, if not using Vercel/Netlify)
- Enable additional Firebase features (Analytics, Cloud Functions, etc.)
- Customize security rules for your needs
- Set up custom domain (if needed)

## Support

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- Check browser console for detailed error messages

