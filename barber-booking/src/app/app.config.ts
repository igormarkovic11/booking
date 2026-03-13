import {
  ApplicationConfig,
  LOCALE_ID,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import {
  initializeFirestore,
  provideFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from '@angular/fire/firestore';
import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { environment } from './environments/environment';
import { registerLocaleData } from '@angular/common'; // Ovo je ključno
import localeSr from '@angular/common/locales/sr-Latn'; // Srpska latinica
import { getAuth, provideAuth } from '@angular/fire/auth';

registerLocaleData(localeSr); // Registrujemo srpski

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAuth(() => getAuth()),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => {
      const app = initializeApp(environment.firebase);
      return initializeFirestore(app, {
        // Koristimo persistentLocalCache sa menadžerom za više tabova
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    }),
    provideAnimationsAsync(),
    { provide: LOCALE_ID, useValue: 'sr-Latn' }, // Postavljamo srpski kao glavni jezik
  ],
};
