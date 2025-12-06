# LocalFinTrack

A local financial tracking application built with Electron.js that works entirely offline.

## Features

- **100% Offline Operation**: No internet connection required
- **Secure Authentication**: Password-protected access with role-based permissions
- **User Management**: Super Admin can create and manage Admin and Viewer accounts
- **Financial Tracking**: Record income and expenses with categorization
- **Reporting**: Generate monthly reports with charts and export to PDF
- **Data Security**: Encrypted local database storage
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Roles & Permissions

1. **Super Admin** (initial account: username `admin`, temporary password `Admin@123`)
   - Full access to all features
   - Can manage users
   - Can view audit logs

2. **Admin** (created by Super Admin)
   - Can add/edit/delete transactions & categories (if granted permission)
   - Can export PDF reports
   - Can backup database
   - Cannot manage users

3. **Viewer**
   - Can only view transactions
   - Can export monthly PDF reports

## Installation

### Prerequisites

- Node.js (version 16 or higher)
- npm (comes with Node.js)

### Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd electronApp
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up the database:
   ```
   npx prisma migrate dev --name init
   npx prisma generate
   ```

### Running the Application

To start the application in development mode:
```
npm start
```

### Building the Application

To build for your current platform:
```
npm run build
```

To build for specific platforms:
```
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## First-Time Setup

On first run, the application will:
1. Generate a random 256-bit encryption key and store it securely
2. Create an encrypted SQLite database at:
   - Windows: `%APPDATA%\Local\LocalFinTrack\data.db`
   - macOS: `~/Library/Application Support/LocalFinTrack/data.db`
   - Linux: `~/.config/LocalFinTrack/data.db`
3. Create the initial Super Admin user with username `admin` and temporary password `Admin@123`

You will be prompted to change the temporary password on first login.

## Security Features

- Database encryption with randomly generated keys
- Password hashing with bcrypt
- No external network requests (blocked by application)
- Clipboard clearing on app close (when containing sensitive data)

## Technologies Used

- **Electron.js**: Cross-platform desktop application framework
- **Prisma**: Database ORM for SQLite
- **SQLite**: Local database storage
- **bcrypt.js**: Password hashing
- **Chart.js**: Data visualization
- **PDFMake**: PDF report generation

## License

This project is licensed under the MIT License - see the LICENSE file for details.