import {
  ApplicationConfig,
  LOCALE_ID,
  provideZoneChangeDetection,
  importProvidersFrom,
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
import localeEn from '@angular/common/locales/en';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import * as en from '../../public/i18n/en.json';
import * as sr from '../../public/i18n/sr.json';

registerLocaleData(localeSr);
registerLocaleData(localeEn);

const translations: Record<string, any> = { en, sr };

class StaticTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of(translations[lang] ?? translations['sr']);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),

    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() =>
      initializeFirestore(getApp(), {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      }),
    ),

    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'sr',
        loader: {
          provide: TranslateLoader,
          useClass: StaticTranslateLoader,
        },
      }),
    ),

    provideAnimationsAsync(),
    { provide: LOCALE_ID, useValue: 'sr-Latn' },
  ],
};
