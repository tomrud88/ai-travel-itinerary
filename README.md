# 🤖✈️ AI Travel Itinerary Builder

> **Intelligent Travel Planning with Enterprise-Grade Infrastructure**

A production-ready web application that leverages AI to create personalized travel itineraries with persistent usage tracking. Built with React 19.x, Vite, TypeScript, and enterprise-grade Vercel KV storage.

![React](https://img.shields.io/badge/React-19.1.1-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF?logo=vite)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)
![Vercel KV](https://img.shields.io/badge/Vercel-KV-000000?logo=vercel)

## 🚀 Live Demo

**Production**: https://travel-guide-4jzxcpc3r-tomek198821wppls-projects.vercel.app  
**Development**: `http://localhost:5173`

## ✨ Features

### 🤖 AI-Powered Planning

- **Google Gemini Integration**: Advanced AI itinerary generation
- **Smart Budget Planning**: AI-optimized cost estimation
- **Contextual Recommendations**: Location-aware suggestions
- **Multi-Language Support**: Travel guides in multiple languages

### 🏢 Enterprise Infrastructure

- **Vercel KV Storage**: Persistent usage tracking with Upstash Redis
- **Multi-User Rate Limiting**: Global API usage limits across all users
- **Deployment Persistence**: Counters survive deployments and updates
- **Real-Time Monitoring**: Live usage tracking and verification

### 🎨 Modern Architecture

- **React 19.1.1** - Latest React features with concurrent rendering
- **TypeScript** - Full type safety and developer experience
- **Serverless Functions** - Scalable API endpoints on Vercel
- **Responsive Design** - Mobile-first with Tailwind CSS

## 🚀 Quick Start

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 Architecture Overview

### Frontend Structure

```
src/
├── components/
│   ├── AI/AIItineraryGenerator.tsx    # AI interface
│   ├── Travel/DestinationCard.tsx     # Interactive cards
│   ├── Layout/Header.tsx              # Navigation
│   └── FreepikBudgetTracker.tsx       # Usage monitoring
├── services/
│   ├── aiService.ts                   # Gemini AI integration
│   └── imageService.ts                # Freepik API client
└── types/index.ts                     # TypeScript definitions
```

### Backend API Structure

```
api/
├── gemini-usage.js                    # Persistent Gemini tracking
└── images/
    ├── search.js                      # Freepik API with KV storage
    └── budget-status.js               # Real-time usage stats
```

### Database Schema (Vercel KV)

- **`gemini-usage-global`**: Monthly/daily/minute tracking
- **`freepik-usage-global`**: Global rate limiting data

## 🔧 Configuration

### Required Environment Variables

```env
# API Keys
VITE_GOOGLE_AI_API_KEY=your-gemini-key
VITE_FREEPIK_API_KEY=your-freepik-key

# Vercel KV Database (Auto-configured via Upstash integration)
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

### Production Features

- ✅ **Persistent Usage Tracking**: API counters survive deployments
- ✅ **Multi-User Rate Limiting**: Global limits across all users
- ✅ **Real-Time Monitoring**: Live usage verification in console
- ✅ **Enterprise Reliability**: Upstash Redis with atomic operations

### Setup Instructions

1. **Deploy to Vercel**: Connect your repository
2. **Add Upstash Integration**: Go to Storage → Upstash for Redis
3. **Configure Environment**: Add API keys via Project Settings
4. **Deploy**: Automatic KV database connection

## 📊 Production Metrics

### API Usage Tracking

- **Real-Time Monitoring**: Live usage counters in browser console
- **Global Rate Limits**: Shared across all users and sessions
- **Persistent Storage**: Usage data survives deployments and restarts

### Performance Features

- **Serverless Architecture**: Auto-scaling Vercel functions
- **Redis Caching**: Sub-millisecond data access with Upstash
- **Concurrent Safety**: Atomic operations prevent race conditions

---

**Built with ❤️ for travelers everywhere** 🌍✈️  
**Enterprise-ready** • **Production-tested** • **Globally scalable**
