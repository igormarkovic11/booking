# Barber Booking System

[![Angular](https://img.shields.io/badge/Angular-18.1.0-DD0031?style=flat&logo=angular)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.2-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-18.0.1-FFCA28?style=flat&logo=firebase)](https://firebase.google.com/)
[![Angular Material](https://img.shields.io/badge/Material-18.2.14-009688?style=flat&logo=material-design)](https://material.angular.io/)

A modern, responsive barber shop booking application built with Angular 18, Firebase, and Angular Material. The application provides a seamless booking experience for clients and comprehensive management tools for administrators.

## ✨ Features

### Client Features
- **📅 Appointment Booking** - Easy-to-use booking interface
- **👨‍💼 Barber Selection** - Choose your preferred barber
- **⏰ Time Slot Selection** - View available time slots
- **📱 Responsive Design** - Works on all devices
- **🌍 Multi-language Support** - Internationalization with ngx-translate
- **📱 Progressive Web App (PWA)** - Installable and works offline

### Admin Features
- **📊 Dashboard** - Overview of bookings and statistics
- **📅 Appointment Management** - View, edit, and manage appointments
- **👥 Customer Management** - Track customer information
- **⚙️ Settings** - Configure business hours, services, and preferences

## 🛠️ Tech Stack

### Frontend
- **Angular 18.1.0** - Modern web framework
- **TypeScript 5.5.2** - Type-safe development
- **Angular Material 18.2.14** - UI component library
- **RxJS 7.8.0** - Reactive programming
- **Angular CDK 18.2.14** - Component development kit

### Backend & Services
- **Firebase 18.0.1** - Backend platform
  - Authentication
  - Firestore Database
  - Cloud Storage
  - Hosting

### Additional Features
- **Angular Service Worker** - PWA functionality
- **ngx-translate 17.0.0** - Internationalization
- **Angular Router** - Client-side routing

## 📁 Project Structure

```
barber-booking/
├── public/              # Static assets
├── src/
│   ├── app/
│   │   ├── admin/      # Admin panel components
│   │   ├── client/     # Client-facing components
│   │   ├── core/       # Core services and guards
│   │   ├── shared/     # Shared components and utilities
│   │   ├── layout/     # Layout components
│   │   └── environments/ # Environment configurations
│   └── assets/
│       ├── icons/      # App icons
│       └── images/     # Images and graphics
├── angular.json        # Angular configuration
├── firebase.json       # Firebase configuration
├── ngsw-config.json    # Service worker configuration
└── vercel.json         # Vercel deployment config
```

## 🔧 Technology Overview

### Backend Services
The application uses Firebase for backend functionality:
- **Authentication** - Secure user authentication
- **Firestore** - Real-time database
- **Storage** - File storage for images
- **Hosting** - Application deployment

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run unit tests
- `npm run watch` - Build and watch for changes

## 🌍 Internationalization

The application supports multiple languages through ngx-translate. Language files can be found in the assets folder.

## 📱 PWA Features

This application is a Progressive Web App with:
- Offline functionality
- Installable on mobile and desktop
- Push notifications support
- Fast loading with service worker caching

## 🎨 UI/UX

The application uses Angular Material for a clean, modern interface:
- Material Design components
- Consistent theming
- Responsive layouts
- Accessible components

## 🚀 Deployment

The project is configured for deployment on:
- **Vercel** - Frontend hosting
- **Firebase** - Backend services

## 📄 License

This project is private. All rights reserved.

## 👤 Author

**Igor Marković**
- GitHub: [@igormarkovic11](https://github.com/igormarkovic11)

## 🙏 Acknowledgments

- Angular team for the framework
- Firebase for backend services
- Angular Material for UI components
