import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { AdminApi } from '../../../core/services/admin-api';

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string | null;
  category: string;
  readTime?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
};

function emptyModel() {
  return { slug: '', title: '', excerpt: '', content: '', category: '', readTime: '', isPublished: false };
}

@Component({
  selector: 'app-blog-page',
  imports: [CommonModule, FormField],
  templateUrl: './blog-page.html',
  styleUrl: './blog-page.scss'
})
export class BlogPage {
  readonly posts = signal<BlogPost[]>([]);
  readonly loading = signal(false);
  readonly mutating = signal(false);
  readonly error = signal('');
  readonly message = signal('');

  readonly createModel = signal(emptyModel());
  readonly createForm = form(this.createModel);
  editingId = signal<string | null>(null);
  readonly editModel = signal(emptyModel());
  readonly editForm = form(this.editModel);

  expandedId = signal<string | null>(null);

  constructor(private readonly api: AdminApi) { void this.load(); }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const res = await this.api.listBlogPosts();
      this.posts.set(res.posts);
    } catch {
      this.error.set('Could not load posts.');
    } finally {
      this.loading.set(false);
    }
  }

  autoSlug() {
    const title = this.createModel().title;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    this.createModel.update((m) => ({ ...m, slug }));
  }

  async create() {
    const m = this.createModel();
    this.mutating.set(true);
    this.message.set('');
    try {
      await this.api.createBlogPost({ ...m, content: m.content || null, readTime: m.readTime || null });
      this.message.set('Post created.');
      this.createModel.set(emptyModel());
      await this.load();
    } catch {
      this.error.set('Could not create post. Check that the slug is unique.');
    } finally {
      this.mutating.set(false);
    }
  }

  startEdit(p: BlogPost) {
    this.editingId.set(p.id);
    this.editModel.set({ slug: p.slug, title: p.title, excerpt: p.excerpt, content: p.content || '', category: p.category, readTime: p.readTime || '', isPublished: p.isPublished });
  }
  cancelEdit() { this.editingId.set(null); }

  async saveEdit() {
    const id = this.editingId();
    if (!id) return;
    const m = this.editModel();
    this.mutating.set(true);
    this.message.set('');
    try {
      await this.api.updateBlogPost(id, { ...m, content: m.content || null, readTime: m.readTime || null });
      this.message.set('Post updated.');
      this.editingId.set(null);
      await this.load();
    } catch {
      this.error.set('Could not update post.');
    } finally {
      this.mutating.set(false);
    }
  }

  async togglePublish(p: BlogPost) {
    this.mutating.set(true);
    try {
      await this.api.updateBlogPost(p.id, { isPublished: !p.isPublished });
      this.message.set(p.isPublished ? 'Unpublished.' : 'Published.');
      await this.load();
    } catch {
      this.error.set('Could not update.');
    } finally {
      this.mutating.set(false);
    }
  }

  async remove(id: string) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    this.mutating.set(true);
    try {
      await this.api.deleteBlogPost(id);
      this.message.set('Deleted.');
      await this.load();
    } catch {
      this.error.set('Could not delete.');
    } finally {
      this.mutating.set(false);
    }
  }

  toggleExpand(id: string) {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }
}
