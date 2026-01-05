# Notes App

A secure, single-user notes application with Markdown support.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure authentication

Create a `.env` file:

```bash
cp .env.example .env
```

Generate a password hash:

```bash
npm run hash-password your-password-here
```

Copy the generated hash and add it to your `.env` file:

```
USERNAME=admin
PASSWORD_HASH=<paste-hash-here>
NODE_ENV=development
PORT=3000
```

### 3. Run the application

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm run build
npm start
```

## Features

- Secure username/password authentication
- Session-based login (7-day sessions)
- HTTP-only cookies for security
- Mobile-friendly responsive design

## Environment Variables

- `USERNAME` - Login username (default: admin)
- `PASSWORD_HASH` - Bcrypt hash of the password (required)
- `NODE_ENV` - Environment mode (development/production)
- `PORT` - Server port (default: 3000)
