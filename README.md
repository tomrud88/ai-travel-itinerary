# 🤖✈️ AI Travel Itinerary Builder

> **Intelligent Travel Planning with Modern Web Technologies**

A cutting-edge web application that leverages AI to create personalized travel itineraries based on user preferences. Built with React 19.x, Vite, Tailwind CSS, Framer Motion, and Apollo GraphQL.

![React](https://img.shields.io/badge/React-19.1.1-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF?logo=vite)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)
![Framer Motion](https://img.shields.io/badge/Framer-Motion-pink?logo=framer)

## 🚀 Live Demo

**Development Server**: `http://localhost:5173`

## ✨ Features

### 🤖 AI-Powered Planning

- **Intelligent Itinerary Generation**: AI creates personalized daily plans
- **Smart Recommendations**: Context-aware suggestions
- **Budget Optimization**: AI-optimized budget planning
- **Natural Language Processing**: Travel guides in multiple languages

### 🎨 Modern UI/UX

- **Framer Motion Animations**: Smooth interactive animations
- **Responsive Design**: Mobile-first with Tailwind CSS
- **Glass-effect UI**: Modern backdrop blur design
- **Interactive Cards**: Hover effects and transitions

### 📊 Tech Stack

- **React 19.1.1** - Latest React features
- **Vite 7.1.7** - Lightning-fast development
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animation library
- **Apollo GraphQL** - Data management

## 🚀 Quick Start

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 Project Structure

```
src/
├── components/
│   ├── Layout/Header.tsx       # Navigation with animations
│   ├── Travel/DestinationCard.tsx  # Interactive cards
│   └── AI/AIItineraryGenerator.tsx # AI interface
├── graphql/client.ts           # Apollo setup
├── types/index.ts              # TypeScript definitions
└── App.tsx                     # Main application
```

## 🔧 Configuration

### Environment Variables

```env
VITE_GRAPHQL_ENDPOINT=your-api-endpoint
VITE_AI_API_KEY=your-ai-key
```

### Custom Tailwind Classes

```css
.card {
  @apply bg-white rounded-xl shadow-lg p-6;
}
.glass-effect {
  @apply bg-white/80 backdrop-blur-sm;
}
```

**Built with ❤️ for travelers everywhere** 🌍✈️
