import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'barbershop-83659',
        appId: '1:751360542093:web:10708e6fc090d4410ae9c4',
        storageBucket: 'barbershop-83659.firebasestorage.app',
        apiKey: 'AIzaSyBtWlzHXi7SNN2jnaWMAwba7lHLLPkHdNY',
        authDomain: 'barbershop-83659.firebaseapp.com',
        messagingSenderId: '751360542093',
        measurementId: 'G-5PRTLED3MP',
      })
    ),
    provideFirestore(() => getFirestore()),
  ],
};
