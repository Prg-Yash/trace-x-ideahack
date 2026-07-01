# ⚡ Trace-X Desktop - Quick Reference Card

## 🚀 Essential Commands

```bash
# Development
npm run tauri:dev           # Start desktop app with hot-reload

# Production
npm run tauri:build         # Build installer

# Utilities
npm run dev                 # Web version (browser)
npm run build               # Web build
npm install                 # Install dependencies
```

## 📂 Important Files

| File | Purpose |
|------|---------|
| `src-tauri/tauri.conf.json` | Desktop configuration |
| `src-tauri/Cargo.toml` | Rust dependencies |
| `.env.desktop` | Desktop environment vars |
| `src/lib/tauri.ts` | Desktop utilities |

## 🔧 Common Tasks

### Change Window Size
Edit `src-tauri/tauri.conf.json`:
```json
"windows": [{ "width": 1920, "height": 1080 }]
```

### Change API URL
Edit `.env.desktop`:
```env
VITE_API_URL=http://your-api-url/api/v1
```

### Change App Name
Edit `src-tauri/tauri.conf.json`:
```json
"productName": "Your App Name"
```

### Update Icon
```bash
# Replace src-tauri/icons/icon.png
npx tauri icon
```

## 💻 Desktop Code Examples

### Check if Desktop
```typescript
import { isTauri } from '@/lib/tauri';

if (isTauri()) {
  // Desktop-specific code
}
```

### Save File
```typescript
import { saveFileDialog, writeFile } from '@/lib/tauri';

const path = await saveFileDialog('report.json');
if (path) {
  await writeFile(path, JSON.stringify(data));
}
```

### Notification
```typescript
import { showNotification } from '@/lib/tauri';

await showNotification('Title', 'Message');
```

### Secure Storage
```typescript
import { storeSet, storeGet } from '@/lib/tauri';

await storeSet('key', value);
const value = await storeGet('key');
```

## 🐛 Quick Fixes

### Cargo not found
```powershell
$env:Path += ";$env:USERPROFILE\.cargo\bin"
```

### Backend not connecting
```bash
# Start backend first
cd ../api
python main.py
```

### Build fails
```bash
cd src-tauri
cargo clean
cd ..
npm install
npm run tauri:build
```

### Dependencies issue
```bash
npm install
cd src-tauri
cargo fetch
```

## 📍 File Locations

### Installer Output
```
src-tauri/target/release/bundle/
├── msi/          # Windows MSI
└── nsis/         # Windows EXE
```

### Source Code
```
src/                    # React app
src-tauri/             # Desktop code
src/lib/tauri.ts       # Desktop utils
```

### Configuration
```
.env.desktop           # Environment
src-tauri/tauri.conf.json    # Tauri config
src-tauri/Cargo.toml         # Rust deps
```

## 🔒 Security Permissions

### Allowed by Default
- ✅ File system (`$APPDATA`, `$DOWNLOAD`)
- ✅ HTTP to configured domains
- ✅ Native dialogs
- ✅ Notifications
- ✅ Secure storage

### Not Allowed
- ❌ System files
- ❌ Arbitrary network requests
- ❌ Shell commands (not configured)
- ❌ Other app data

## 📊 Performance Tips

- **Dev Mode:** Slower, has hot-reload
- **Production:** Fast, optimized
- **Memory:** ~100-200 MB typical
- **Startup:** 1-3 seconds cold start

## 🎯 Troubleshooting Checklist

- [ ] Backend running at `http://127.0.0.1:8000`
- [ ] Node.js installed (`node --version`)
- [ ] Rust installed (`cargo --version`)
- [ ] Dependencies installed (`npm install`)
- [ ] In correct directory (`frontend/`)
- [ ] No console errors (Ctrl+Shift+I)

## 📚 Documentation Links

| Document | Purpose |
|----------|---------|
| `README_DESKTOP.md` | Quick start |
| `DESKTOP_SETUP_GUIDE.md` | Full setup |
| `TAURI_README.md` | Tauri details |
| `DESKTOP_CONVERSION_SUMMARY.md` | Technical overview |
| `ARCHITECTURE.md` | System architecture |
| `TESTING_CHECKLIST.md` | Testing guide |

## ⌨️ Keyboard Shortcuts (Dev Mode)

| Key | Action |
|-----|--------|
| `Ctrl+Shift+I` | Open DevTools |
| `Ctrl+R` | Reload app |
| `F5` | Reload app |
| `Ctrl+W` | Close window |

## 🔄 Update Process

1. Make code changes
2. Save file (auto hot-reload in dev)
3. Test in dev mode
4. Build production: `npm run tauri:build`
5. Test installer
6. Distribute to users

## 📦 Distribution Checklist

- [ ] Build successful
- [ ] Installer tested
- [ ] App starts correctly
- [ ] Backend connection works
- [ ] All features work
- [ ] No console errors
- [ ] Icon correct
- [ ] Window size appropriate

## 🎨 Customization Points

| What | Where | How |
|------|-------|-----|
| Window size | `tauri.conf.json` | Edit `width`/`height` |
| App name | `tauri.conf.json` | Edit `productName` |
| Icon | `src-tauri/icons/` | Replace files |
| API URL | `.env.desktop` | Edit `VITE_API_URL` |
| Permissions | `capabilities/default.json` | Add/remove |

## 🌐 Web vs Desktop

| Feature | Web | Desktop |
|---------|-----|---------|
| Command | `npm run dev` | `npm run tauri:dev` |
| Output | Browser | Native window |
| Build | `npm run build` | `npm run tauri:build` |
| Distribution | Host on server | Share installer |

## 📱 Platform Status

| Platform | Status |
|----------|--------|
| Windows | ✅ Fully supported |
| macOS | ⚠️ Should work (untested) |
| Linux | ⚠️ Should work (untested) |

## 🆘 Emergency Commands

```bash
# Complete reset
rm -rf node_modules package-lock.json
rm -rf src-tauri/target
npm install

# Force clean build
cd src-tauri
cargo clean
cargo build --release
cd ..
npm run build

# Check setup
npm run tauri --version
cargo --version
node --version
```

## 📞 Getting Help

1. **Check docs**: Read relevant .md file
2. **Console**: Open DevTools (Ctrl+Shift+I)
3. **Logs**: Check terminal output
4. **Verify**: Run `verify-desktop-setup.bat`
5. **Clean**: Delete and reinstall dependencies

## ✅ Success Indicators

You're ready when:
- ✅ `npm run tauri:dev` opens app
- ✅ Can login successfully
- ✅ All pages load
- ✅ Data displays correctly
- ✅ No errors in console

## 🎯 Common Use Cases

### Export Report
```typescript
import { exportEvidencePackage } from '@/lib/tauri';
await exportEvidencePackage(data, accountId);
```

### Show Alert
```typescript
import { showDesktopAlert } from '@/lib/desktop-init';
await showDesktopAlert('Success', 'Operation completed');
```

### Confirm Action
```typescript
import { confirmDesktopAction } from '@/lib/desktop-init';
const ok = await confirmDesktopAction('Delete?', 'Are you sure?');
```

---

## 🚀 Get Started Now!

```bash
npm run tauri:dev
```

**That's it! Your desktop app is running.** 🎉

---

*Keep this file handy for quick reference!*
