# Deployment Guide

This document provides a step-by-step guide for deploying DriverScan Pro.

## Pre-Deployment Checklist

- [ ] All tests pass
- [ ] Application runs correctly in development mode
- [ ] Version numbers are updated in `package.json` and `src/package.json`
- [ ] README.md is up to date
- [ ] All dependencies are correctly listed
- [ ] Build configuration is correct
- [ ] Icon files are in place (`assets/icon.ico`)

## Building for Production

### Step 1: Clean Previous Builds

```bash
# Clean React build
cd src
npm run clean
cd ..

# Remove previous Electron builds
rm -rf dist-electron
```

### Step 2: Install Dependencies

Ensure all dependencies are installed:

```bash
# Install root dependencies
npm install

# Install React app dependencies
cd src
npm install
cd ..
```

### Step 3: Build the React Application

```bash
npm run build
```

This will:
- Compile the React application
- Bundle assets with Vite
- Output to `src/dist/`

### Step 4: Test the Built Application

Before packaging, test that the built files work:

```bash
npm start
```

The application should load from `src/dist/index.html` in production mode.

### Step 5: Package the Electron Application

```bash
npm run package
```

Or use the combined command:

```bash
npm run build:electron
```

This will:
- Create a Windows installer (NSIS)
- Output to `dist-electron/` directory
- Generate `DriverScan Pro Setup X.X.X.exe`

## Distribution

### Windows Distribution

The installer (`DriverScan Pro Setup X.X.X.exe`) can be distributed directly to users.

**File Location**: `dist-electron/DriverScan Pro Setup X.X.X.exe`

**Installation Requirements**:
- Windows 10/11 (x64)
- Administrator privileges (for driver operations)

### Creating a GitHub Release

1. **Tag the Release**:
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

2. **Create Release on GitHub**:
   - Go to Releases → Draft a new release
   - Select the tag you just created
   - Add release notes
   - Upload `DriverScan Pro Setup X.X.X.exe`
   - Publish the release

3. **Optional: Generate Checksums**:
   ```bash
   # Windows PowerShell
   Get-FileHash "dist-electron\DriverScan Pro Setup X.X.X.exe" -Algorithm SHA256
   ```

## Troubleshooting Build Issues

### Issue: Build fails with module not found

**Solution**: Ensure all dependencies are installed in both root and `src/` directories.

### Issue: React build fails

**Solution**: 
- Check that Vite is properly configured
- Verify `src/vite.config.js` is correct
- Check for TypeScript errors (if using TypeScript)

### Issue: Electron packaging fails

**Solution**:
- Ensure `electron-builder` is installed: `npm install -D electron-builder`
- Check that `src/dist/` exists (build React app first)
- Verify icon file exists: `assets/icon.ico`
- Check Windows SDK is installed (if on Windows)

### Issue: Application won't start after packaging

**Solution**:
- Check that `main.js` is using correct paths
- Verify `src/dist/index.html` exists
- Check preload script path in `main.js`
- Review console logs for errors

## Optimization Tips

1. **Reduce Bundle Size**:
   - Remove unused dependencies
   - Use production builds of React
   - Enable code splitting in Vite

2. **Improve Build Time**:
   - Use parallel builds where possible
   - Cache node_modules
   - Use incremental builds

3. **Security**:
   - Always use `contextIsolation: true`
   - Never enable `nodeIntegration` in renderer
   - Whitelist IPC channels in preload script

## Automated Deployment (CI/CD)

### GitHub Actions Example

Create `.github/workflows/build.yml`:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm install
          cd src && npm install
      
      - name: Build React app
        run: npm run build
      
      - name: Build Electron app
        run: npm run package
      
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: installer
          path: dist-electron/*.exe
```

## Version Management

When releasing a new version:

1. Update version in `package.json`:
   ```json
   "version": "1.0.1"
   ```

2. Update version in `src/package.json` (if applicable):
   ```json
   "version": "1.0.1"
   ```

3. Commit changes:
   ```bash
   git add package.json src/package.json
   git commit -m "Bump version to 1.0.1"
   ```

4. Tag and push:
   ```bash
   git tag v1.0.1
   git push origin main --tags
   ```

## Post-Deployment

After deployment:

- [ ] Test the installer on a clean system
- [ ] Verify all features work correctly
- [ ] Check application logs for errors
- [ ] Monitor user feedback
- [ ] Update documentation if needed

