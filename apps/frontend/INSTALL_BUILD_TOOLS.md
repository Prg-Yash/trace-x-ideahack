# 🔧 Install Visual Studio Build Tools (Required for Tauri)

## ⚠️ Important

You need **Visual Studio Build Tools** with C++ support to compile Rust/Tauri applications on Windows.

## Error You're Seeing

```
error: linker `link.exe` not found
note: the msvc targets depend on the msvc linker but `link.exe` was not found
note: please ensure that Visual Studio 2017 or later, or Build Tools for Visual Studio were installed with the Visual C++ option
```

## 🚀 Quick Installation (Option 1 - Recommended)

### Using winget (Command Line)

Run this command in PowerShell as Administrator:

```powershell
winget install Microsoft.VisualStudio.2022.BuildTools --override "--quiet --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

**Time:** ~5-10 minutes  
**Size:** ~7 GB download

---

## 🖱️ Manual Installation (Option 2)

### Step 1: Download Build Tools

Visit: https://visualstudio.microsoft.com/downloads/

Scroll down to "Tools for Visual Studio" and download:
**Build Tools for Visual Studio 2022**

### Step 2: Run Installer

1. Run the downloaded `vs_BuildTools.exe`
2. In the installer, select **"Desktop development with C++"**
3. Make sure these components are checked:
   - ✅ MSVC v143 - VS 2022 C++ x64/x86 build tools (Latest)
   - ✅ Windows 11 SDK (or Windows 10 SDK)
   - ✅ C++ CMake tools for Windows
4. Click **Install**
5. Wait for installation to complete (~7 GB)
6. Restart your computer

### Step 3: Verify Installation

Open a new terminal and run:

```bash
cargo --version
```

If you see the version, you're ready!

---

## 🎯 Alternative: Install Visual Studio Community (Option 3)

If you want the full Visual Studio IDE:

1. Download Visual Studio Community 2022: https://visualstudio.microsoft.com/
2. During installation, select **"Desktop development with C++"**
3. Install and restart

---

## ✅ After Installation

### Restart Your Terminal

Close all terminals and open a new one, then:

```bash
cd "C:\Users\YASH\OneDrive\Documents\Yash Docs\Hackathons\Idea2.0\trace-x\apps\frontend"
npm run tauri:dev
```

---

## 🐛 Troubleshooting

### Issue: Still seeing "link.exe not found"

**Solution:**
1. Restart your computer
2. Open a fresh PowerShell/CMD
3. Verify MSVC is in PATH:
   ```powershell
   where link.exe
   ```

### Issue: Installation failed

**Solution:**
1. Make sure you have ~20 GB free space
2. Run installer as Administrator
3. Disable antivirus temporarily
4. Try Option 2 (manual installation)

---

## 📋 What Gets Installed

- **MSVC Compiler** - C++ compiler and linker
- **Windows SDK** - Windows development libraries
- **CMake** - Build system tools
- **Total Size:** ~7 GB

---

## ⏱️ Estimated Time

- **Download:** 5-10 minutes (depends on internet speed)
- **Installation:** 10-15 minutes
- **Total:** ~20-30 minutes

---

## 🔄 After Installing Build Tools

1. **Close all terminals**
2. **Restart your computer** (recommended)
3. **Open new terminal**
4. **Navigate to frontend:**
   ```bash
   cd "C:\Users\YASH\OneDrive\Documents\Yash Docs\Hackathons\Idea2.0\trace-x\apps\frontend"
   ```
5. **Run desktop app:**
   ```bash
   npm run tauri:dev
   ```

---

## 📝 Quick Install Script

Save this as `install-build-tools.bat` and run as Administrator:

```batch
@echo off
echo ========================================
echo Installing Visual Studio Build Tools
echo ========================================
echo.
echo This will download and install ~7 GB
echo Press Ctrl+C to cancel, or
pause

winget install Microsoft.VisualStudio.2022.BuildTools --override "--quiet --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo IMPORTANT: Restart your computer now!
echo.
pause
```

---

## ✅ Verification Checklist

After installation and restart:

- [ ] Computer restarted
- [ ] Open new terminal
- [ ] Run: `cargo --version` (should work)
- [ ] Run: `where link.exe` (should find it)
- [ ] Navigate to frontend directory
- [ ] Run: `npm run tauri:dev`
- [ ] Desktop app opens successfully!

---

## 🎉 Success!

Once build tools are installed, you'll be able to:
- ✅ Build Tauri desktop applications
- ✅ Compile Rust code
- ✅ Create production installers
- ✅ Run `npm run tauri:dev` without errors

---

## 🆘 Still Having Issues?

Try this complete reset:

```powershell
# Clean Rust
rustup self uninstall

# Reinstall Rust
winget install --id Rustlang.Rustup

# Install Build Tools
winget install Microsoft.VisualStudio.2022.BuildTools

# Restart computer
shutdown /r /t 60

# After restart, try again
cd frontend
npm run tauri:dev
```

---

**Once Build Tools are installed, your Tauri desktop app will work perfectly!** 🚀
