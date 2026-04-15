import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type SupportedLang = 'sr' | 'en';

const LANG_KEY = 'app_lang';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  readonly languages: { code: SupportedLang; flag: string; label: string }[] = [
    { code: 'sr', flag: 'rs', label: 'SR' },
    { code: 'en', flag: 'gb', label: 'EN' },
  ];

  constructor(private translate: TranslateService) {}

  init(): void {
    const saved = localStorage.getItem(LANG_KEY) as SupportedLang | null;
    const lang = saved ?? 'sr';
    this.translate.addLangs(['sr', 'en']);
    this.translate.setDefaultLang('sr');
    this.translate.use(lang);
  }

  get current(): SupportedLang {
    return (this.translate.currentLang ?? 'sr') as SupportedLang;
  }

  switch(lang: SupportedLang): void {
    this.translate.use(lang);
    localStorage.setItem(LANG_KEY, lang);
  }
}
