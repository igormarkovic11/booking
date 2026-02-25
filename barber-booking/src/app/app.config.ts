import {
  ApplicationConfig,
  LOCALE_ID,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { environment } from './environments/environment';
import { registerLocaleData } from '@angular/common'; // Ovo je ključno
import localeSr from '@angular/common/locales/sr-Latn'; // Srpska latinica

registerLocaleData(localeSr); // Registrujemo srpski

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideAnimationsAsync(),
    { provide: LOCALE_ID, useValue: 'sr-Latn' }, // Postavljamo srpski kao glavni jezik
  ],
};
