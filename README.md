# Web3 Content Platform Frontend

A modern React.js 18 + TypeScript frontend for a walletless Web3 content platform that combines YouTube and TikTok functionality.

## Features

- 🎥 Video streaming with HLS/LL-HLS support
- 📱 Responsive design (mobile-first)
- 🌙 Dark/Light theme toggle (default dark)
- 💰 Walletless Web3 tipping system
- 📤 Resumable uploads up to 20GB+
- 🔒 Adult content compliance (18+ age gate, 2257 compliance)
- 🌍 Geo-restriction capabilities
- 💬 Real-time interactions via WebSocket
- ♿ WCAG accessibility compliance

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod
- **Video**: HLS.js
- **Uploads**: TUS protocol
- **Real-time**: Socket.io
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Update environment variables in `.env.local`

5. Start development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `REACT_APP_API_BASE` - Backend API URL
- `REACT_APP_WS_URL` - WebSocket server URL
- `REACT_APP_ADULT` - Enable adult content features (1/0)
- `REACT_APP_FEATURE_FLAGS` - Comma-separated feature flags

## Project Structure

```
src/
├── components/         # Reusable UI components
├── pages/             # Page components
├── providers/         # React context providers
├── hooks/             # Custom React hooks
├── lib/               # Utility functions
├── routes/            # Route configuration
├── styles/            # Global styles
└── types/             # TypeScript type definitions
```

## Compliance Features

This platform includes adult content compliance features:

- **Age Gate**: 18+ verification with persistent consent
- **2257 Compliance**: ID verification and model release workflow
- **Geo-blocking**: Country-based content restrictions
- **Content Reporting**: User reporting and moderation queue
- **Forensic Watermarking**: Session-unique video watermarks

## Contributing

1. Follow the existing code style
2. Run `npm run lint` and `npm run type-check` before committing
3. Write meaningful commit messages
4. Test your changes thoroughly

## License

Private - All rights reserved