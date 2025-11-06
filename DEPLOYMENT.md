# Deployment Guide

## Quick Start (Local)

1. Open `index.html` in your browser, or
2. Use a local server:
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx serve
   
   # VS Code Live Server extension
   Right-click index.html → "Open with Live Server"
   ```

## GitHub Pages Deployment

1. **Push to GitHub**:
   ```bash
   cd ecovest-plus
   git init
   git add .
   git commit -m "Initial commit: EcoVest+ Trading Community"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/ecovest-plus.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: Deploy from branch `main`
   - Folder: `/ (root)`
   - Save and wait ~1 minute

3. **Your site will be live at**:
   `https://YOUR_USERNAME.github.io/ecovest-plus/`

## Important Notes

### Browser Storage
- **LocalStorage**: Stores user sessions, post metadata, follows
- **IndexedDB**: Stores all media files (images, videos) - unlimited size
- **Data persists**: Across page refreshes and browser restarts
- **Clear data**: Use browser DevTools → Application → Storage → Clear

### Security (Production)
This is a **demo/portfolio project**. For production use:
- [ ] Add real backend API
- [ ] Hash passwords (bcrypt)
- [ ] Validate emails server-side
- [ ] Use proper authentication (JWT, OAuth)
- [ ] Upload files to CDN (Cloudinary, AWS S3)
- [ ] Add CSRF protection
- [ ] Sanitize all user input server-side

## File Size Handling

✅ **No client-side limits** - Upload any size  
⚠️ **Browser limits**:
- IndexedDB: ~50% of available disk space
- Recommended: Videos under 500MB for best performance

## Browser Compatibility

- ✅ Chrome 24+
- ✅ Firefox 16+
- ✅ Safari 10+
- ✅ Edge 12+
- Requires: ES6+, IndexedDB, LocalStorage

## Demo Credentials

- Any email/password works for sign-up
- Type "icemonster" in any input for dev mode
- Sample posts loaded on first visit

