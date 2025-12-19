# DriverScan Pro

A modern Windows desktop application for managing system drivers with AI-assisted troubleshooting, performance analytics, and security checks.

![DriverScan Pro](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)

## Features

- **Driver Scanning & Analysis** - Scan and analyze all system drivers with detailed information
- **AI-Assisted Error Analysis** - Advanced error message analysis using machine learning models
- **Driver Rollback** - Safely rollback drivers to previous versions
- **Modern UI** - Beautiful, responsive interface with dark mode support
- **System Information** - Display detailed system and OS information
- **Real-time Status** - Monitor driver health and status in real-time

## Screenshots

The application features a clean, modern interface with:
- Dashboard overview with driver statistics
- Detailed driver list with filtering capabilities
- Error analysis panel with severity indicators
- Dark/Light mode theme switching

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) - Comes with Node.js
- **Windows 10/11** - Required for driver management features
- **Administrator privileges** - Required for driver operations

## Installation

### For End Users

1. Download the latest release from the [Releases](https://github.com/yourusername/driverscan-pro/releases) page
2. Run the installer (`DriverScan Pro Setup.exe`)
3. Follow the installation wizard
4. Launch the application from the Start Menu or desktop shortcut

### For Developers

1. Clone the repository:
```bash
git clone https://github.com/yourusername/driverscan-pro.git
cd driverscan-pro
```

2. Install root dependencies:
```bash
npm install
```

3. Install React app dependencies:
```bash
cd src
npm install
cd ..
```

## Development

### Running in Development Mode

To run the application in development mode with hot-reload:

```bash
npm run dev
```

This will:
- Start the Vite development server on `http://localhost:5173`
- Launch Electron with DevTools enabled
- Enable hot module replacement for faster development

### Project Structure

```
driverscan-pro/
├── main.js                 # Electron main process
├── package.json            # Root package.json with Electron dependencies
├── assets/                 # Application assets (icons, etc.)
│   └── icon.ico           # Application icon
├── src/                    # React frontend application
│   ├── App.jsx            # Main React component
│   ├── index.jsx          # React entry point
│   ├── index.html         # HTML template
│   ├── index.css          # Global styles
│   ├── preload.js         # Electron preload script (IPC bridge)
│   ├── components/        # React components
│   ├── package.json       # React app dependencies
│   ├── vite.config.js     # Vite configuration
│   └── tailwind.config.js # Tailwind CSS configuration
└── README.md              # This file
```

## Building for Production

### Step 1: Build the React Application

Build the React frontend:

```bash
npm run build
```

This compiles the React app and outputs to `src/dist/`.

### Step 2: Package the Electron Application

Package the application into a distributable format:

```bash
npm run package
```

Or use the combined command:

```bash
npm run build:electron
```

The packaged application will be available in the `dist-electron/` directory:
- Windows installer: `DriverScan Pro Setup 1.0.0.exe`

### Build Configuration

The build configuration is defined in `package.json` under the `build` section:

- **App ID**: `com.driverscan.pro`
- **Product Name**: `DriverScan Pro`
- **Target**: Windows NSIS installer (x64)
- **Output**: `dist-electron/` directory

## Deployment

### Creating a Release

1. **Update Version**: Update the version in `package.json` (and `src/package.json` if applicable)

2. **Build the Application**:
   ```bash
   npm run build:electron
   ```

3. **Test the Build**: Test the installer on a clean Windows system

4. **Create a Release**:
   - Tag the release: `git tag v1.0.0`
   - Push the tag: `git push origin v1.0.0`
   - Create a GitHub release with:
     - Release notes
     - The installer file (`DriverScan Pro Setup X.X.X.exe`)
     - Checksums for verification

### Distribution

The application is distributed as a Windows installer (NSIS):
- **One-click installation** - Users can choose installation directory
- **Desktop shortcut** - Automatically created
- **Start Menu shortcut** - Automatically created
- **Uninstaller** - Included for easy removal

## Configuration

### Environment Variables

The application supports the following environment variables:

- `NODE_ENV` - Set to `production` for production builds
- `ELECTRON_IS_DEV` - Set to `1` to force development mode

### Electron Store

User preferences (like theme) are stored using `electron-store` in:
- Windows: `%APPDATA%\DriverScan Pro\config.json`

## Troubleshooting

### Common Issues

**Issue: Application won't start**
- Ensure Node.js v18+ is installed
- Check that all dependencies are installed: `npm install`
- Verify the build completed successfully: `npm run build`

**Issue: Driver scanning fails**
- Ensure the application is run with Administrator privileges
- Check Windows system requirements
- Verify `systeminformation` package is properly installed

**Issue: Build fails**
- Ensure all dependencies are installed in both root and `src/` directories
- Check that `electron-builder` is installed: `npm install -D electron-builder`
- Verify Node.js version compatibility

**Issue: DevTools not opening in development**
- Check that port 5173 is available
- Verify Vite dev server is running: `npm run dev:react`

### Debugging

Enable verbose logging:
```bash
DEBUG=* npm run dev
```

Check Electron logs in the console output.

## Security

- **Context Isolation**: Enabled for secure IPC communication
- **Node Integration**: Disabled in renderer process
- **Preload Script**: Whitelisted IPC channels only
- **No Remote Module**: Disabled for security

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Test changes thoroughly
- Update documentation as needed

## Technologies Used

- **Electron** - Cross-platform desktop framework
- **React** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Heroicons** - Icon library
- **React Hot Toast** - Toast notifications
- **systeminformation** - System info library
- **@xenova/transformers** - ML models for error analysis
- **electron-store** - Persistent storage

## License

This project is licensed under the ISC License.

## Support

For issues, questions, or contributions:
- Open an issue on [GitHub](https://github.com/yourusername/driverscan-pro/issues)
- Check existing documentation
- Review the code comments

## Changelog

### Version 1.0.0
- Initial release
- Driver scanning and analysis
- AI-assisted error analysis
- Driver rollback functionality
- Dark/Light mode support
- Modern UI with Tailwind CSS

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- UI components from [Headless UI](https://headlessui.com/)
- Icons from [Heroicons](https://heroicons.com/)
