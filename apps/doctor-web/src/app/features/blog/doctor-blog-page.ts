import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { DoctorBlogService, type DoctorBlogPost } from '../../core/services/doctor-blog.service';

function emptyModel() {
  return { slug: '', title: '', excerpt: '', content: '', category: '', readTime: '' };
}

@Component({
  selector: 'app-doctor-blog-page',
  imports: [CommonModule, FormField],
  templateUrl: './doctor-blog-page.html',
  styleUrl: './doctor-blog-page.scss'
})
export class DoctorBlogPage {
  private readonly api = inject(DoctorBlogService);

  readonly posts = signal<DoctorBlogPost[]>([]);
  readonly categories = signal<string[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');

  readonly createModel = signal(emptyModel());
  readonly createForm = form(this.createModel);
  readonly editingId = signal('');
  readonly editModel = signal(emptyModel());
  readonly editForm = form(this.editModel);

  constructor() {
    void this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const res = await this.api.listPosts();
      this.posts.set(res.posts ?? []);
      this.categories.set(res.categories ?? []);
    } catch {
      this.error.set('Could not load your articles.');
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
    this.saving.set(true);
    this.message.set('');
    try {
      const res = await this.api.createPost({
        ...m,
        content: m.content || null,
        readTime: m.readTime || null
      });
      this.message.set(res.message);
      this.createModel.set(emptyModel());
      await this.load();
    } catch {
      this.error.set('Could not save article. Check slug is unique.');
    } finally {
      this.saving.set(false);
    }
  }

  startEdit(post: DoctorBlogPost) {
    this.editingId.set(post.id);
    this.editModel.set({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content || '',
      category: post.category,
      readTime: post.readTime || ''
    });
  }

  cancelEdit() {
    this.editingId.set('');
  }

  async saveEdit() {
    const id = this.editingId();
    if (!id) return;
    const m = this.editModel();
    this.saving.set(true);
    this.message.set('');
    try {
      const res = await this.api.updatePost(id, {
        ...m,
        content: m.content || null,
        readTime: m.readTime || null
      });
      this.message.set(res.message);
      this.editingId.set('');
      await this.load();
    } catch {
      this.error.set('Could not update article.');
    } finally {
      this.saving.set(false);
    }
  }

  async removeDraft(id: string) {
    if (!confirm('Delete this draft?')) return;
    this.saving.set(true);
    try {
      await this.api.deletePost(id);
      this.message.set('Draft deleted.');
      await this.load();
    } catch {
      this.error.set('Only unpublished drafts can be deleted.');
    } finally {
      this.saving.set(false);
    }
  }
}
