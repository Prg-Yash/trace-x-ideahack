# 🖥️ Trace-X Desktop Application

> **Your web application is now a native desktop application!**

## 🚀 Quick Start (30 seconds)

### 1. Start your backend:
```bash
cd ../api
python main.py
```

### 2. Launch desktop app:
```bash
npm run tauri:dev
```

That's it! Your desktop app is running. 🎉

## 📦 What You Get

- ✅ **Native Windows Application** (`.exe` installer)
- ✅ **All Web Features** (100% compatibility)
- ✅ **Desktop Enhancements**:
  - Native file save/open dialogs
  - System notifications
  - Encrypted local storage
  - Better performance
  - No browser required

## 🎯 Commands

| Command | Description |
|---------|-------------|
| `npm run tauri:dev` | Development mode with hot-reload |
| `npm run tauri:build` | Build production installer |
| `npm run tauri` | Access Tauri CLI directly |

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src-tauri/` | Desktop application code (Rust) |
| `src/lib/tauri.ts` | Desktop utility functions |
| `src/lib/desktop-init.ts` | Desktop initialization |
| `.env.desktop` | Desktop environment variables |

## 📚 Documentation

- **[DESKTOP_SETUP_GUIDE.md](./DESKTOP_SETUP_GUIDE.md)** - Complete setup instructions
- **[TAURI_README.md](./TAURI_README.md)** - Tauri documentation
- **[DESKTOP_CONVERSION_SUMMARY.md](./DESKTOP_CONVERSION_SUMMARY.md)** - Technical details
- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - Testing guide

## 🔧 Prerequisites

- ✅ Node.js v16+ (You have v22.14.0)
- ✅ Rust (cargo 1.96.1)
- ✅ Backend API running at `http://127.0.0.1:8000`

## 🏗️ Build for Production

```bash
npm run tauri:build
```

**Output:**
```
src-tauri/target/release/bundle/
├── msi/          # Windows MSI installer
└── nsis/         # Windows NSIS installer (.exe)
```

Share the installer with users - they don't need Node.js or Rust!

## 🌐 Web vs Desktop

**Both work from the same codebase!**

```bash
# Web version
npm run dev       # Development
npm run build     # Production

# Desktop version
npm run tauri:dev    # Development
npm run tauri:build  # Production
```

## 💡 Desktop Features Examples

### Export Files
```typescript
import { exportEvidencePackage } from '@/lib/tauri';

// Shows native save dialog
await exportEvidencePackage(data, accountId);
```

### Notifications
```typescript
import { showNotification } from '@/lib/tauri';

await showNotification('Alert', 'New fraud detected');
```

### Secure Storage
```typescript
import { storeSet, storeGet } from '@/lib/tauri';

await storeSet('token', authToken);  // Encrypted
const token = await storeGet('token');
```

## 🐛 Troubleshooting

### "cargo: command not found"
Add Rust to your PATH:
```powershell
$env:Path += ";$env:USERPROFILE\.cargo\bin"
```

### Backend connection issues
1. Check backend is running: `http://127.0.0.1:8000`
2. Verify `.env.desktop` has correct API URL

### Build fails
```bash
cd src-tauri
cargo clean
cd ..
npm install
npm run tauri:build
```

## 📊 What Stays the Same

- ✅ Backend API (unchanged)
- ✅ Database (unchanged)
- ✅ All React components (unchanged)
- ✅ All business logic (unchanged)
- ✅ Authentication (unchanged)

## ⚙️ Configuration

### Change API URL
Edit `.env.desktop`:
```env
VITE_API_URL=http://your-server.com/api/v1
```

### Change Window Size
Edit `src-tauri/tauri.conf.json`:
```json
{
  "app": {
    "windows": [{
      "width": 1920,
      "height": 1080
    }]
  }
}
```

## 🎨 Customization

### Change App Icon
1. Replace `src-tauri/icons/icon.png`
2. Run: `npx tauri icon`
3. Rebuild

### Change App Name
Edit `src-tauri/tauri.conf.json`:
```json
{
  "productName": "Your App Name"
}
```

## 📈 Performance

- **Installer Size**: ~10-15 MB
- **RAM Usage**: ~100-200 MB
- **Startup Time**: 1-3 seconds
- **Platform**: Windows 10/11

## 🔒 Security

- Encrypted local storage
- OS-level permissions
- No arbitrary code execution
- Sandboxed environment

## ✅ Verification

Run the verification script:
```bash
verify-desktop-setup.bat
```

Or manually check:
- [ ] `npm run tauri:dev` launches app
- [ ] Backend connection works
- [ ] Can login and navigate
- [ ] Desktop features work

## 📞 Need Help?

1. Check [DESKTOP_SETUP_GUIDE.md](./DESKTOP_SETUP_GUIDE.md)
2. Review terminal logs
3. Press `Ctrl+Shift+I` in dev mode for DevTools
4. Check [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)

## 🎉 Success Criteria

Your desktop app is working when:
- ✅ `npm run tauri:dev` opens application window
- ✅ Login works
- ✅ All pages load correctly
- ✅ Data syncs from backend
- ✅ No console errors

## 🚢 Distribution

1. Build: `npm run tauri:build`
2. Find installer in: `src-tauri/target/release/bundle/`
3. Share with users
4. Users install and run (no dev tools needed)

## 📝 Version Info

- **Tauri**: 2.11.3
- **Rust**: 1.96.1
- **Node**: 22.14.0
- **Status**: ✅ Ready to use

---

## 🏁 Ready to Go!

**Start now:**
```bash
npm run tauri:dev
```

Enjoy your new desktop application! 🚀

For detailed information, see [DESKTOP_SETUP_GUIDE.md](./DESKTOP_SETUP_GUIDE.md)
