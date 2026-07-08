import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppFooterComponent } from './app-footer.component';
import { AppHeaderComponent } from './app-header.component';
import { ClinicApiClient } from './clinic-api/clinic-api.client';
import { API_PATHS } from './core/constants/api-paths.constants';
import { BLOG_PAGE_CONTENT } from './core/constants/public-site-content.constants';
import { SimpleMarkdownPipe } from './core/pipes/simple-markdown.pipe';
import { WhatsappLinkService } from './core/services/whatsapp-link.service';

type BlogPostDetail = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string | null;
  category: string;
  readTime?: string | null;
  publishedAt?: string | null;
  createdAt: string;
};

@Component({
  selector: 'app-blog-detail',
  imports: [CommonModule, RouterLink, AppHeaderComponent, AppFooterComponent, SimpleMarkdownPipe],
  templateUrl: './blog-detail.component.html',
})
export class BlogDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly client = new ClinicApiClient();
  private readonly whatsappSvc = inject(WhatsappLinkService);

  readonly whatsappLink = this.whatsappSvc.url;
  readonly copy = BLOG_PAGE_CONTENT;
  readonly post = signal<BlogPostDetail | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }
      void this.load(slug);
    });
  }

  private async load(slug: string) {
    this.loading.set(true);
    this.notFound.set(false);
    try {
      const res = await this.client.get<{ post: BlogPostDetail }>(API_PATHS.BLOG_POST(slug));
      this.post.set(res.post);
    } catch {
      this.post.set(null);
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
      window.scrollTo(0, 0);
    }
  }

  postDate(post: BlogPostDetail) {
    const raw = post.publishedAt || post.createdAt;
    return new Date(raw).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
