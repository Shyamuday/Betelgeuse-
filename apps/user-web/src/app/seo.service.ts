import { DOCUMENT } from '@angular/common';
import { inject, Service } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ClinicApiClient } from './clinic-api/clinic-api.client';
import { SEO_DEFAULTS } from './core/constants/branding.constants';
import { PublicPagesService } from './core/services/public-pages.service';

type DiseaseSeo = {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalPath?: string;
};

@Service()
export class SeoService {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly apiClient = inject(ClinicApiClient);
  private readonly publicPages = inject(PublicPagesService);

  private readonly siteUrl = SEO_DEFAULTS.SITE_URL;
  private readonly defaultTitle = SEO_DEFAULTS.DEFAULT_TITLE;
  private readonly defaultDescription = SEO_DEFAULTS.DEFAULT_DESCRIPTION;
  private readonly defaultImage = `${this.siteUrl}/favicon.ico`;

  init() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        void this.applyRouteSeo();
      });
  }

  private async applyRouteSeo() {
    const routeData = this.getLeafRoute(this.activatedRoute).snapshot.data;
    const diseaseSeo = await this.getDiseaseSeoFromUrl();
    const approachSeo = await this.getApproachSeoFromPage();
    const publicPageSeo = await this.getPublicPageSeoFromUrl();

    const seoTitle =
      diseaseSeo.metaTitle ||
      approachSeo.metaTitle ||
      publicPageSeo.metaTitle ||
      routeData['seoTitle'] ||
      this.defaultTitle;
    const seoDescription =
      diseaseSeo.metaDescription ||
      approachSeo.metaDescription ||
      publicPageSeo.metaDescription ||
      routeData['seoDescription'] ||
      this.defaultDescription;
    const seoKeywords =
      diseaseSeo.keywords ||
      approachSeo.keywords ||
      publicPageSeo.keywords ||
      routeData['seoKeywords'] ||
      [];
    const canonicalPath =
      diseaseSeo.canonicalPath || publicPageSeo.canonicalPath || this.router.url;
    const canonicalUrl = `${this.siteUrl}${canonicalPath === '/' ? '' : canonicalPath}`;
    const ogTitle = diseaseSeo.ogTitle || approachSeo.ogTitle || publicPageSeo.ogTitle || seoTitle;
    const ogDescription =
      diseaseSeo.ogDescription ||
      approachSeo.ogDescription ||
      publicPageSeo.ogDescription ||
      seoDescription;
    const ogImage = diseaseSeo.ogImage || publicPageSeo.ogImage || this.defaultImage;

    this.title.setTitle(seoTitle);
    this.meta.updateTag({ name: 'description', content: seoDescription });
    this.meta.updateTag({
      name: 'keywords',
      content: Array.isArray(seoKeywords) ? seoKeywords.join(', ') : '',
    });

    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: ogTitle });
    this.meta.updateTag({ property: 'og:description', content: ogDescription });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ property: 'og:image', content: ogImage });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: ogTitle });
    this.meta.updateTag({ name: 'twitter:description', content: ogDescription });
    this.meta.updateTag({ name: 'twitter:image', content: ogImage });

    this.upsertCanonical(canonicalUrl);
  }

  private getLeafRoute(route: ActivatedRoute): ActivatedRoute {
    let current = route;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current;
  }

  private upsertCanonical(url: string) {
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private async getDiseaseSeoFromUrl(): Promise<DiseaseSeo> {
    const match = this.router.url.match(/^\/treatments\/([^/?#]+)/);
    if (!match) {
      return {};
    }

    const slug = decodeURIComponent(match[1]);
    const canonicalPath = `/treatments/${slug}`;

    try {
      const response = await this.apiClient.get<{
        disease: {
          seoTitle?: string | null;
          seoDescription?: string | null;
          publicImageUrl?: string | null;
          name: string;
        };
      }>(`/diseases/by-slug/${encodeURIComponent(slug)}`);

      const live = response.disease;
      const metaTitle = live.seoTitle || `${live.name} | HopeHub Care`;
      const metaDescription = live.seoDescription || '';

      return {
        metaTitle,
        metaDescription,
        ogTitle: metaTitle,
        ogDescription: metaDescription,
        ogImage: live.publicImageUrl || undefined,
        canonicalPath,
      };
    } catch {
      return { canonicalPath };
    }
  }

  private async getApproachSeoFromPage(): Promise<DiseaseSeo> {
    if (!this.router.url.startsWith('/why-successful')) {
      return {};
    }

    return {
      metaTitle: 'Why HopeHub Works | HopeHub Care',
      metaDescription:
        'See how HopeHub Care combines structured intake, expert matching, online consultation, safety checks, and connected follow-up.',
      keywords: [
        'online healthcare',
        'expert consultation',
        'digital health platform',
        'patient follow-up',
        'care coordination',
        'teleconsultation',
      ],
      ogTitle: 'Why HopeHub Works',
      ogDescription:
        'Structured online care with the right expert, organised records, and follow-up that stays connected.',
    };
  }

  private async getPublicPageSeoFromUrl(): Promise<DiseaseSeo> {
    const path = this.router.url.split('?')[0].replace(/^\/+/, '') || 'home';
    if (path.startsWith('treatments/')) return {};
    const slugAliases: Record<string, string> = {
      '': 'home',
      'our-doctors': 'our-providers',
      'talk-to-doctor': 'talk-to-provider',
    };
    const slug = slugAliases[path] || path;
    const page = await this.publicPages.bySlug(slug);
    const seo = page?.seo;
    if (!seo) return {};
    return {
      metaTitle: seo.seoTitle,
      metaDescription: seo.seoDescription,
      keywords: seo.seoKeywords,
      ogTitle: seo.ogTitle,
      ogDescription: seo.ogDescription,
      ogImage: seo.ogImage,
      canonicalPath: seo.canonicalPath,
    };
  }
}
