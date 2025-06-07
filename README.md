# DriverScan Pro

A modern Windows desktop application for managing system drivers with AI-assisted troubleshooting, performance analytics, and security checks.

## Features

- Driver scanning and analysis
- Automatic driver updates
- Driver backup and restore functionality
- AI-assisted troubleshooting
- Performance analytics
- Security checks
- Modern, user-friendly interface

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Windows 10/11

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/driverscan-pro.git
cd driverscan-pro
```

2. Install dependencies:
```bash
npm install
cd src
npm install
cd ..
```

## Development

To run the application in development mode:

```bash
npm run dev
```

This will start both the Electron main process and the React development server.

## Building

To build the application for production:

```bash
npm run build
npm run package
```

The packaged application will be available in the `dist` directory.

## Project Structure

```
driverscan-pro/
├── main.js              # Electron main process
├── package.json         # Main package.json
├── src/                 # React application
│   ├── src/
│   │   ├── App.js      # Main React component
│   │   └── ...
│   └── package.json    # React dependencies
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License. 