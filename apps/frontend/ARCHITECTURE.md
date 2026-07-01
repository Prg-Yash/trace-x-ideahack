# 🏗️ Trace-X Desktop Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     TRACE-X DESKTOP APP                      │
│                                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │            React Frontend (Your App)                │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Components, Pages, Hooks                     │  │    │
│  │  │  - Dashboard, Alerts, Graph Analytics        │  │    │
│  │  │  - Evidence, Accounts, etc.                  │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │                        ↓                           │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Desktop Integration Layer (NEW)             │  │    │
│  │  │  - src/lib/tauri.ts                          │  │    │
│  │  │  - src/lib/desktop-init.ts                   │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │                        ↓                           │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Tauri Bridge (JavaScript API)               │  │    │
│  │  │  - @tauri-apps/api                           │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Tauri Core (Rust Backend)                  │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Plugins:                                     │  │    │
│  │  │  - tauri-plugin-store (Secure Storage)       │  │    │
│  │  │  - tauri-plugin-dialog (Native Dialogs)      │  │    │
│  │  │  - tauri-plugin-fs (File System)             │  │    │
│  │  │  - tauri-plugin-notification (Notifications) │  │    │
│  │  │  - tauri-plugin-http (HTTP Client)           │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │           Operating System (Windows)               │    │
│  │  - File System                                     │    │
│  │  - Notifications                                   │    │
│  │  - WebView2 (Edge Chromium)                        │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    HTTP/HTTPS Requests
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   EXISTING BACKEND (Unchanged)               │
│                                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │         FastAPI Server (Python)                    │    │
│  │         http://127.0.0.1:8000/api/v1               │    │
│  └────────────────────────────────────────────────────┘    │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Databases                             │    │
│  │  ┌──────────────┐         ┌──────────────┐        │    │
│  │  │  PostgreSQL  │         │    Neo4j     │        │    │
│  │  │  (Relational)│         │    (Graph)   │        │    │
│  │  └──────────────┘         └──────────────┘        │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Interaction → API Request

```
User clicks button
    ↓
React Component
    ↓
API call (fetch) → src/lib/api.ts
    ↓
HTTP Request to http://127.0.0.1:8000/api/v1
    ↓
FastAPI Backend
    ↓
Database Query (PostgreSQL/Neo4j)
    ↓
JSON Response
    ↓
React Component (update state)
    ↓
UI Update
```

### 2. Desktop Feature Usage

```
User clicks "Export Evidence"
    ↓
React Component calls: exportEvidencePackage()
    ↓
src/lib/tauri.ts → saveFileDialog()
    ↓
Tauri Bridge (JavaScript)
    ↓
Tauri Core (Rust) → tauri-plugin-dialog
    ↓
Windows Native File Dialog
    ↓
User selects location
    ↓
Tauri Core → tauri-plugin-fs
    ↓
Write file to disk
    ↓
Success notification
```

## Component Layers

### Layer 1: UI Components (React)
```
src/
├── components/    # UI components
├── pages/         # Page components
├── hooks/         # React hooks
└── context/       # State management
```
**Status:** ✅ Unchanged (100% compatible)

### Layer 2: Desktop Integration (NEW)
```
src/lib/
├── tauri.ts           # Desktop utilities
├── desktop-init.ts    # Initialization
└── api.ts             # API client (unchanged)
```
**Status:** ✅ Added (backward compatible with web)

### Layer 3: Tauri Core (Rust)
```
src-tauri/
├── src/
│   ├── main.rs       # Entry point
│   └── lib.rs        # App setup + plugins
├── Cargo.toml        # Dependencies
└── tauri.conf.json   # Configuration
```
**Status:** ✅ New (desktop-only)

### Layer 4: Backend API (Python)
```
apps/api/
├── main.py           # FastAPI server
├── models/           # Database models
└── routes/           # API endpoints
```
**Status:** ✅ Unchanged (0 modifications)

## Communication Protocols

### Frontend ↔ Backend
```
Protocol: HTTP/HTTPS
Format: JSON
Authentication: JWT Bearer Token
Base URL: http://127.0.0.1:8000/api/v1
```

### React ↔ Tauri
```
Protocol: IPC (Inter-Process Communication)
Format: JSON (serialized/deserialized)
Bridge: @tauri-apps/api
Security: Capability-based permissions
```

### Tauri ↔ OS
```
Protocol: Native OS APIs
Rust bindings to:
- Windows API (File System)
- WebView2 (Browser Engine)
- COM APIs (Notifications)
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│  React App (Untrusted Zone)                             │
│  - User code                                             │
│  - Can only call allowed Tauri APIs                      │
└─────────────────────────────────────────────────────────┘
                        ↓
            ┌───────────────────────┐
            │  Capability System    │
            │  (Permission Check)   │
            └───────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Tauri Core (Trusted Zone)                              │
│  - Rust code                                             │
│  - Has OS-level permissions                              │
│  - Validates all requests                                │
└─────────────────────────────────────────────────────────┘
```

### Permission Scopes

**File System:**
- ✅ Read/Write: `$APPDATA`, `$DOWNLOAD`
- ❌ Blocked: System files, other user directories

**Network:**
- ✅ Allowed: Configured API domains
- ❌ Blocked: Arbitrary external requests

**Storage:**
- ✅ App storage (encrypted)
- ❌ Blocked: System registry, other app data

## Build Process

### Development Build
```
npm run tauri:dev
    ↓
┌────────────────────┐     ┌────────────────────┐
│  Vite Dev Server   │     │  Cargo Build       │
│  (Hot Reload)      │ +   │  (Debug Mode)      │
└────────────────────┘     └────────────────────┘
    ↓                           ↓
┌────────────────────┐     ┌────────────────────┐
│  React Bundle      │  →  │  Tauri Window      │
│  localhost:5173    │     │  with WebView2     │
└────────────────────┘     └────────────────────┘
```

### Production Build
```
npm run tauri:build
    ↓
┌────────────────────┐     ┌────────────────────┐
│  Vite Build        │     │  Cargo Build       │
│  (Optimized)       │ +   │  (Release Mode)    │
└────────────────────┘     └────────────────────┘
    ↓                           ↓
┌────────────────────┐     ┌────────────────────┐
│  Static Assets     │  →  │  Tauri Binary      │
│  dist/public/      │     │  .exe + WebView2   │
└────────────────────┘     └────────────────────┘
    ↓                           ↓
              ┌────────────────────┐
              │  NSIS/MSI Bundler  │
              └────────────────────┘
                        ↓
              ┌────────────────────┐
              │  Windows Installer │
              │  trace-x_1.0.0.exe │
              └────────────────────┘
```

## Deployment Modes

### Mode 1: Desktop + Remote Backend
```
┌──────────────┐                  ┌──────────────┐
│  Desktop App │  → Internet →    │ Remote Server│
│  (User PC)   │                  │ (Backend API)│
└──────────────┘                  └──────────────┘
```
**Use Case:** Enterprise with centralized backend

### Mode 2: Desktop + Local Backend
```
┌──────────────────────────────────────┐
│         User's PC                     │
│  ┌──────────────┐  ┌──────────────┐ │
│  │ Desktop App  │  │ Backend API  │ │
│  │  (Tauri)     │←→│  (Sidecar)   │ │
│  └──────────────┘  └──────────────┘ │
└──────────────────────────────────────┘
```
**Use Case:** Offline operation, portable app

### Mode 3: Hybrid (Recommended)
```
┌──────────────┐                  ┌──────────────┐
│  Desktop App │  ←→  Internet  ←→│ Remote Server│
│  (Investigators)                 │              │
└──────────────┘                  └──────────────┘
                                        ↑
                                        ↓
                                  ┌──────────────┐
                                  │   Web App    │
                                  │  (Admins)    │
                                  └──────────────┘
```
**Use Case:** Flexible deployment

## Technology Stack

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite 8
- **Language:** TypeScript
- **UI Library:** Radix UI + Tailwind CSS
- **State:** React Context + Hooks
- **Routing:** Wouter

### Desktop Shell
- **Framework:** Tauri 2.11
- **Language:** Rust 1.96
- **WebView:** WebView2 (Chromium)
- **IPC:** Tauri Bridge
- **Plugins:** Store, Dialog, FS, Notification, HTTP

### Backend (Unchanged)
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL + Neo4j
- **Auth:** JWT
- **API:** REST

## Performance Characteristics

### Memory Usage
```
Desktop App:     ~100-200 MB
└─ Tauri Core:   ~50 MB
└─ WebView2:     ~100 MB
└─ React App:    ~50 MB
```

### Startup Time
```
Cold Start:      1-3 seconds
Warm Start:      <1 second
Page Load:       <200ms
API Call:        50-500ms (network dependent)
```

### Bundle Size
```
Installer:       ~10-15 MB (compressed)
Installed:       ~30-50 MB
Runtime Download: 0 MB (self-contained)
```

## Comparison: Web vs Desktop

| Feature | Web App | Desktop App |
|---------|---------|-------------|
| **Installation** | None (browser) | One-time install |
| **Size** | ~5 MB (downloaded) | ~30 MB (installed) |
| **Startup** | Instant (cached) | 1-3 seconds |
| **Performance** | Good | Better (native) |
| **File Access** | Download folder only | Full file system |
| **Notifications** | Browser (limited) | Native OS |
| **Storage** | localStorage (5-10 MB) | Unlimited (encrypted) |
| **Offline** | Limited (PWA) | Possible (with backend) |
| **Security** | Browser sandbox | OS permissions |
| **Updates** | Automatic | Manual/Auto-update |
| **Backend Changes** | None | None |

## Key Design Decisions

### ✅ Why Tauri?
1. **Lightweight:** ~10 MB vs 50+ MB (Electron)
2. **Secure:** Rust + capability system
3. **Native:** Uses system WebView (no bundled Chromium)
4. **Fast:** Native performance
5. **Modern:** TypeScript + React compatible

### ✅ Why Keep Backend Separate?
1. **Zero API Changes:** Existing backend works as-is
2. **Flexibility:** Desktop or web can use same API
3. **Scalability:** Multiple clients, one backend
4. **Maintenance:** Backend updates independent

### ✅ Why Dual Build System?
1. **Compatibility:** Web and desktop from one codebase
2. **Testing:** Test in browser before building desktop
3. **Deployment:** Choose per environment
4. **Migration:** Gradual rollout possible

## Future Enhancements

### Planned
- [ ] Auto-updates (Tauri updater)
- [ ] System tray icon
- [ ] Global shortcuts
- [ ] Multi-window support

### Possible
- [ ] Offline mode with sync
- [ ] Bundle backend as sidecar
- [ ] macOS/Linux builds
- [ ] Biometric auth

## Conclusion

**Architecture Type:** Client-Server with Desktop Shell

**Key Characteristics:**
- ✅ Clean separation of concerns
- ✅ No backend modifications required
- ✅ Backward compatible with web
- ✅ Modern tech stack
- ✅ Secure by design
- ✅ Production ready

**Status:** ✅ Fully Implemented and Ready to Use
