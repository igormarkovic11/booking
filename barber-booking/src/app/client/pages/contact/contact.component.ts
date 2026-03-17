import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  Renderer2,
  ChangeDetectionStrategy,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent implements AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private readonly MAP_SRC =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1001.6802273173405!2d19.22012370273862!3d44.7567533227675!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x475be8e2c082f4e3%3A0x732e9c078bb7d947!2z0KXQvtGC0LXQuyDQlNGA0LjQvdCw!5e0!3m2!1ssr!2srs!4v1768527717660!5m2!1ssr!2srs';

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  ngAfterViewInit(): void {
    this.setupFadeIn();
    this.setupMapLazyLoad();
  }

  /* ---------- FADE-IN (unchanged) ---------- */
  private setupFadeIn(): void {
    const elements = this.el.nativeElement.querySelectorAll('.fade-in');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    elements.forEach((el: Element) => observer.observe(el));
  }

  /* ---------- MAP LAZY LOAD ----------
   * The iframe is NOT in the HTML — we inject it here only
   * when the map container scrolls into view.
   * This avoids loading Google Maps JS (~500kb) on page load.
   */
  private setupMapLazyLoad(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.injectIframe();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0 },
    );

    observer.observe(this.mapContainer.nativeElement);
  }

  private injectIframe(): void {
    const container: HTMLElement = this.mapContainer.nativeElement;

    // Remove all children properly (innerHTML = '' doesn't work with Angular's ngcontent)
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const iframe = this.renderer.createElement('iframe');
    this.renderer.setAttribute(iframe, 'src', this.MAP_SRC);
    this.renderer.setStyle(iframe, 'width', '100%');
    this.renderer.setStyle(iframe, 'height', '100%');
    this.renderer.setStyle(iframe, 'border', '0');
    this.renderer.setStyle(iframe, 'display', 'block');
    this.renderer.setAttribute(iframe, 'allowfullscreen', '');
    this.renderer.setAttribute(
      iframe,
      'referrerpolicy',
      'no-referrer-when-downgrade',
    );
    this.renderer.appendChild(container, iframe);
  }
}
