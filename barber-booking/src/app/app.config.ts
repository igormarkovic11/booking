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
import { initializeApp, provideFirebaseApp, getApp } from '@angular/fire/app';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { environment } from './environments/environment';
import { registerLocaleData } from '@angular/common';
import localeSr from '@angular/common/locales/sr-Latn';
import { getAuth, provideAuth } from '@angular/fire/auth';

registerLocaleData(localeSr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),

    // 1. Firebase app MUST come first
    provideFirebaseApp(() => initializeApp(environment.firebase)),

    // 2. Auth and Firestore AFTER the app is initialized
    provideAuth(() => getAuth()),
    provideFirestore(() =>
      initializeFirestore(getApp(), {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      }),
    ),

    provideAnimationsAsync(),
    { provide: LOCALE_ID, useValue: 'sr-Latn' },
  ],
};
