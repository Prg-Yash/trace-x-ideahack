# Trace-X Desktop Application

This directory contains the Tauri desktop application configuration for Trace-X.

## 🚀 Quick Start

### Prerequisites

Before running the desktop app, ensure you have:

1. **Node.js** (v16 or higher) - Already installed ✅
2. **Rust** (latest stable) - Already installed ✅
3. **Backend API running** at `http://127.0.0.1:8000`

### Development

Run the desktop app in development mode:

```bash
npm run tauri:dev
```

This will:
- Start the Vite dev server
- Launch the Tauri window with hot-reload enabled
- Connect to your backend API at `http://127.0.0.1:8000`

### Building

Build the desktop application for production:

```bash
npm run tauri:build
```

This creates:
- Windows: `.exe` installer in `src-tauri/target/release/bundle/`
- The installer includes all necessary dependencies

## 📁 Project Structure

```
frontend/
├── src/                      # React application source
├── src-tauri/                # Tauri (Rust) configuration
│   ├── src/
│   │   ├── main.rs          # Rust entry point
│   │   └── lib.rs           # Tauri app setup with plugins
│   ├── icons/               # Application icons
│   ├── capabilities/        # Permission configurations
│   ├── Cargo.toml           # Rust dependencies
│   └── tauri.conf.json      # Tauri configuration
├── .env                     # Web environment variables
├── .env.desktop             # Desktop environment variables
└── package.json             # Node.js dependencies
```

## 🔧 Configuration

### Backend API Connection

The desktop app connects to your FastAPI backend. Configure the API URL in `.env.desktop`:

```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

For production, you can:
1. Point to a remote server (e.g., `https://your-api.com/api/v1`)
2. Bundle the Python backend as a Tauri sidecar
3. Run the backend locally on each machine

### Window Configuration

Edit `src-tauri/tauri.conf.json` to customize:

```json
{
  "app": {
    "windows": [{
      "title": "Trace-X - Financial Fraud Detection",
      "width": 1600,
      "height": 1000,
      "minWidth": 1280,
      "minHeight": 720
    }]
  }
}
```

## 🔌 Desktop Features

The desktop app includes enhanced features through Tauri plugins:

### 1. File System Access

```typescript
import { exportEvidencePackage, exportCSV } from '@/lib/tauri';

// Export evidence reports
await exportEvidencePackage(evidenceData, accountId);

// Export CSV data
await exportCSV(csvData, 'report.csv');
```

### 2. Native Notifications

```typescript
import { showNotification } from '@/lib/tauri';

await showNotification(
  'New Alert',
  'Critical fraud detected in account 123456'
);
```

### 3. Secure Storage

```typescript
import { storeSet, storeGet, storeDelete } from '@/lib/tauri';

// Store authentication token securely
await storeSet('auth-token', token);

// Retrieve stored data
const token = await storeGet('auth-token');

// Delete stored data
await storeDelete('auth-token');
```

### 4. Platform Detection

```typescript
import { isTauri, getPlatform } from '@/lib/tauri';

if (isTauri()) {
  const platform = await getPlatform(); // 'windows', 'macos', 'linux'
  console.log('Running on desktop:', platform);
} else {
  console.log('Running in browser');
}
```

## 🔒 Security

### Permissions

The app uses Tauri's capability system for fine-grained permissions:

- **File System**: Read/write access to app data and downloads
- **HTTP**: Fetch API for backend communication
- **Dialogs**: Native file picker and message boxes
- **Notifications**: System tray notifications
- **Store**: Encrypted local storage

Permissions are defined in `src-tauri/capabilities/default.json`.

### API Security

- JWT tokens stored in secure storage (not sessionStorage)
- HTTPS connections enforced for production APIs
- CORS not required (native app, no browser restrictions)

## 🎨 Icons

Replace default icons in `src-tauri/icons/` with your branding:

- `icon.ico` - Windows icon
- `icon.png` - Source icon (1024x1024 recommended)
- Various PNG sizes for different platforms

## 📦 Distribution

After building, find installers in:

```
src-tauri/target/release/bundle/
├── msi/          # Windows installer (.msi)
├── nsis/         # Windows installer (.exe)
└── ...
```

### Installer Options

Edit `src-tauri/tauri.conf.json` for bundle options:

```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": null,  // Code signing certificate
      "digestAlgorithm": "sha256"
    }
  }
}
```

## 🐛 Troubleshooting

### Backend Connection Issues

If the desktop app can't connect to the API:

1. Ensure the backend is running: `cd ../api && python main.py`
2. Check the API URL in `.env.desktop`
3. Verify firewall settings allow localhost connections

### Build Errors

If Rust compilation fails:

```bash
# Update Rust
rustup update stable

# Clean and rebuild
cd src-tauri
cargo clean
cd ..
npm run tauri:build
```

### Missing Dependencies

If plugins fail to load:

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
rm -rf src-tauri/target
npm install
```

## 🔄 Dual Mode Support

The app supports both web and desktop modes:

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

This allows you to maintain a single codebase for both web and desktop deployments.

## 📝 Development Tips

1. **Hot Reload**: Changes to React code hot-reload automatically
2. **Rust Changes**: Require restarting `tauri:dev`
3. **DevTools**: Press `Ctrl+Shift+I` (Windows) to open developer tools
4. **Logs**: Rust logs appear in the terminal running `tauri:dev`

## 🚢 Production Deployment

### Option 1: Standalone Desktop App

Distribute the `.exe` installer to users. They need:
- The desktop app installed
- Access to the backend API (local or remote)

### Option 2: Backend Bundled

Bundle the Python API as a Tauri sidecar for a fully standalone app:

```json
{
  "bundle": {
    "externalBin": ["backend-server"]
  }
}
```

### Option 3: Hybrid

- Desktop app for investigators
- Web app for administrators
- Shared backend API

## 📚 Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Tauri API Reference](https://tauri.app/v1/api/js/)
- [Rust Documentation](https://doc.rust-lang.org/)

## 🤝 Support

For issues specific to the desktop app:
1. Check this README
2. Review `src-tauri/tauri.conf.json`
3. Inspect Rust logs in the terminal
4. Check browser DevTools (Ctrl+Shift+I)
