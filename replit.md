# WhatsApp Bot Admin Dashboard

## Overview

This is a comprehensive WhatsApp bot management system with a modern web-based admin dashboard. The application enables users to connect a WhatsApp bot, manage group interactions, configure commands, handle music requests, and monitor bot activity through an intuitive interface. The system is built as a full-stack application with real-time monitoring capabilities and extensive moderation features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Design System**: Dark theme with green accent colors, responsive design

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with organized route handlers
- **Development Tools**: TSX for TypeScript execution in development
- **Build Process**: ESBuild for production bundling

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Session Storage**: PostgreSQL-based session storage using connect-pg-simple

### Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL storage
- **Bot Authentication**: WhatsApp Web authentication using Baileys library
- **QR Code Generation**: Dynamic QR code generation for WhatsApp connection

### Core Features and Services
- **WhatsApp Integration**: Baileys library for WhatsApp Web protocol
- **Music Service**: YouTube integration with yt-dlp for music search and queueing
- **Group Management**: Automated group moderation with configurable settings
- **Command System**: Extensible bot command framework with categories
- **Real-time Monitoring**: Live connection status and activity logging
- **File Storage**: Multi-file authentication state management for WhatsApp sessions

### Database Schema Design
- **Users**: Basic user management with authentication
- **Bot Sessions**: WhatsApp connection state and session data
- **Groups**: Group metadata with moderation settings
- **Commands**: Configurable bot commands with categories and permissions
- **Logs**: Comprehensive activity logging with levels and sources
- **Music Queue**: Track queuing system for music requests
- **Stats**: Performance metrics and usage statistics

### API Architecture
- **Bot Management**: Connection control, QR code retrieval, session management
- **Group Operations**: CRUD operations for group settings and moderation
- **Command Management**: Enable/disable commands, category filtering
- **Logging System**: Activity monitoring with filtering and clearing capabilities
- **Music Integration**: Search, queue, and playback control endpoints

## External Dependencies

### Core Dependencies
- **@whiskeysockets/baileys**: WhatsApp Web API implementation
- **@neondatabase/serverless**: Serverless PostgreSQL driver
- **drizzle-orm**: Type-safe SQL ORM with PostgreSQL dialect
- **express**: Web application framework for Node.js
- **qrcode**: QR code generation for WhatsApp authentication

### Frontend Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Headless UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Minimalist routing library for React
- **react-hook-form**: Form state management with validation

### Development Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: JavaScript bundler for production builds
- **drizzle-kit**: Database schema management and migrations

### Music Service Integration
- **yt-dlp**: YouTube video/audio downloading and metadata extraction
- **child_process**: Node.js process execution for external commands

### Authentication and Session Management
- **connect-pg-simple**: PostgreSQL session store for Express
- **@hapi/boom**: HTTP error handling for connection management