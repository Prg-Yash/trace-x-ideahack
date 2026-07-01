# 🚀 Trace-X Desktop Application - Complete Setup Guide

## ✅ What Has Been Done

Your Trace-X frontend has been successfully configured as a Tauri desktop application! Here's what has been set up:

### 1. **Tauri Configuration** ✅
- ✅ Installed `@tauri-apps/cli` and related packages
- ✅ Initialized Tauri project structure in `src-tauri/`
- ✅ Configured `tauri.conf.json` with proper settings
- ✅ Updated `Cargo.toml` with necessary Rust dependencies
- ✅ Configured Tauri plugins (store, dialog, fs, notification, http)

### 2. **Desktop Integration** ✅
- ✅ Created `src/lib/tauri.ts` - Desktop utilities and helpers
- ✅ Created `src/lib/desktop-init.ts` - Desktop initialization
- ✅ Updated `App.tsx` to initialize desktop features
- ✅ Updated `package.json` with Tauri commands

### 3. **Build Scripts** ✅
- ✅ `build-desktop.bat` - Build production installer
- ✅ `run-desktop.bat` - Run in development mode
- ✅ Added npm scripts: `tauri`, `tauri:dev`, `tauri:build`

### 4. **Environment Configuration** ✅
- ✅ Created `.env.desktop` for desktop-specific settings
- ✅ Configured API endpoints and keys

### 5. **Documentation** ✅
- ✅ `TAURI_README.md` - Comprehensive documentation
- ✅ This setup guide

## 📋 Prerequisites

Before running the desktop app, ensure you have:

1. **Node.js** (v16+) - ✅ Already installed (v22.14.0)
2. **Rust** (latest stable) - ✅ Already installed (cargo 1.96.1)
3. **Backend API** - Must be running at `http://127.0.0.1:8000`

## 🎯 Quick Start

### Option 1: Using Batch Scripts (Easiest)

#### Development Mode:
```batch
# Double-click or run:
run-desktop.bat
```

#### Build Production Installer:
```batch
# Double-click or run:
build-desktop.bat
```

### Option 2: Using npm Commands

#### Development Mode:
```bash
npm run tauri:dev
```

#### Build Production:
```bash
npm run tauri:build
```

### Option 3: Manual Commands

#### Development:
```bash
# Terminal 1: Start Vite (if not using tauri:dev)
npm run dev

# Terminal 2: Start Tauri
npx tauri dev
```

#### Build:
```bash
npm run build
npx tauri build
```

## ⚙️ Configuration

### Backend API Connection

The desktop app connects to your Python FastAPI backend. The API URL is configured in:

**File: `.env.desktop`**
```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

**Important:** Make sure your backend is running before starting the desktop app!

To start your backend:
```bash
cd ../api
python main.py
```

### Window Settings

Edit `src-tauri/tauri.conf.json` to customize the window:

```json
{
  "app": {
    "windows": [{
      "title": "Trace-X - Financial Fraud Detection",
      "width": 1600,
      "height": 1000,
      "minWidth": 1280,
      "minHeight": 720,
      "resizable": true
    }]
  }
}
```

## 🔌 Desktop Features

Your desktop app includes these enhanced features:

### 1. **File System Access**
```typescript
import { exportEvidencePackage, exportCSV } from '@/lib/tauri';

// Export evidence to file
await exportEvidencePackage(evidenceData, accountId);

// Export CSV reports
await exportCSV(csvData, 'fraud-report.csv');
```

### 2. **Native Notifications**
```typescript
import { showNotification } from '@/lib/tauri';

// Show system notification
await showNotification('Alert', 'New fraud case detected');
```

### 3. **Secure Storage**
```typescript
import { storeSet, storeGet } from '@/lib/tauri';

// Store credentials securely
await storeSet('token', authToken);

// Retrieve stored data
const token = await storeGet('token');
```

### 4. **Native Dialogs**
```typescript
import { saveFileDialog, openFileDialog } from '@/lib/tauri';

// Save file dialog
const path = await saveFileDialog('report.json', [
  { name: 'JSON', extensions: ['json'] }
]);

// Open file dialog
const file = await openFileDialog([
  { name: 'CSV', extensions: ['csv'] }
]);
```

## 📦 Building for Production

### Build Process

1. **Run the build command:**
   ```bash
   npm run tauri:build
   ```

2. **Find your installer:**
   The installer will be created in:
   ```
   src-tauri/target/release/bundle/
   ├── msi/          # Windows MSI installer
   ├── nsis/         # Windows NSIS installer (.exe)
   ```

3. **Distribute:**
   - Share the `.exe` or `.msi` installer with users
   - Users can install and run without any development tools

### Build Configuration

Edit `src-tauri/tauri.conf.json` for bundle options:

```json
{
  "bundle": {
    "identifier": "com.tracex.app",
    "productName": "Trace-X",
    "windows": {
      "certificateThumbprint": null,  // Add code signing cert
      "digestAlgorithm": "sha256"
    }
  }
}
```

## 🔍 Troubleshooting

### Issue: "cargo: command not found"

**Solution:**
```powershell
# Add Cargo to PATH (PowerShell)
$env:Path += ";$env:USERPROFILE\.cargo\bin"

# Verify
cargo --version
```

Or restart your terminal/IDE after installing Rust.

### Issue: Backend connection failed

**Solution:**
1. Check backend is running: `http://127.0.0.1:8000`
2. Verify `.env.desktop` has correct API URL
3. Check firewall settings

### Issue: Build fails with Rust errors

**Solution:**
```bash
# Update Rust
rustup update stable

# Clean and rebuild
cd src-tauri
cargo clean
cd ..
npm run tauri:build
```

### Issue: Window shows blank screen

**Solution:**
1. Check browser console (Ctrl+Shift+I in dev mode)
2. Verify `dist/public` folder exists after build
3. Check `tauri.conf.json` has correct `frontendDist` path

### Issue: Plugins not working

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
rm -rf src-tauri/target
npm install
```

## 🌐 Web vs Desktop Modes

The app automatically detects if it's running as desktop or web:

```typescript
import { isTauri } from '@/lib/tauri';

if (isTauri()) {
  // Desktop-specific code
  console.log('Running as desktop app');
} else {
  // Web-specific code
  console.log('Running in browser');
}
```

This allows you to maintain a single codebase for both deployments!

## 📊 Deployment Options

### Option 1: Desktop App Only
- Distribute `.exe` installer to users
- Users install locally
- Connect to central backend server

### Option 2: Desktop + Backend Bundle
- Package Python backend as Tauri sidecar
- Fully standalone application
- No server required

### Option 3: Hybrid
- Desktop app for investigators
- Web app for administrators
- Shared backend API

## 🔐 Security Considerations

### Authentication
- JWT tokens stored in secure Tauri store (not sessionStorage)
- Encrypted local storage for sensitive data

### API Communication
- Use HTTPS in production
- Backend API should have proper CORS/auth

### Permissions
- File system access scoped to app data and downloads
- Notifications require user permission
- No arbitrary code execution

## 📝 Development Workflow

### Hot Reload
1. Start dev mode: `npm run tauri:dev`
2. Edit React code → Changes hot-reload automatically
3. Edit Rust code → Requires restart

### Debugging
- **React**: Press `Ctrl+Shift+I` to open DevTools
- **Rust**: Check terminal logs where `tauri:dev` is running

### Testing
```bash
# Run React tests
npm test

# Build and verify
npm run tauri:build
```

## 🎨 Customization

### Application Icon
Replace icons in `src-tauri/icons/`:
- `icon.png` - Source (1024x1024 recommended)
- `icon.ico` - Windows icon
- Other PNG sizes generated automatically

### Application Name
Edit `src-tauri/tauri.conf.json`:
```json
{
  "productName": "Your App Name",
  "identifier": "com.yourcompany.yourapp"
}
```

### Window Title
Set in `tauri.conf.json` or dynamically in code:
```typescript
const tauri = (window as any).__TAURI__;
const window = await tauri.window.getCurrent();
await window.setTitle('New Title');
```

## 📚 Additional Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Tauri API Reference](https://tauri.app/v1/api/js/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)

## ✅ Next Steps

1. **Test Development Mode:**
   ```bash
   npm run tauri:dev
   ```

2. **Build Production Installer:**
   ```bash
   npm run tauri:build
   ```

3. **Customize:**
   - Update icons in `src-tauri/icons/`
   - Configure window size in `tauri.conf.json`
   - Add desktop-specific features using utilities in `src/lib/tauri.ts`

4. **Deploy:**
   - Distribute installer from `src-tauri/target/release/bundle/`
   - Set up auto-updates (optional)
   - Configure code signing for Windows

## 🎉 You're All Set!

Your Trace-X application is now ready to run as a native desktop application. The existing web functionality remains unchanged, and you can deploy both web and desktop versions from the same codebase.

**To get started right now:**
```bash
npm run tauri:dev
```

Enjoy your new desktop application! 🚀
