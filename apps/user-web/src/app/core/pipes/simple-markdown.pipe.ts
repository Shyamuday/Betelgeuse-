import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'simpleMarkdown', standalone: true })
export class SimpleMarkdownPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    if (!value?.trim()) return '';

    const escaped = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const html = escaped
      .split(/\n\n+/)
      .map((block) => {
        const trimmed = block.trim();
        if (!trimmed) return '';

        const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
        if (heading) {
          const level = heading[1].length;
          const tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
          return `<${tag}>${this.inline(heading[2])}</${tag}>`;
        }

        if (/^[-*]\s/m.test(trimmed)) {
          const items = trimmed
            .split('\n')
            .map((line) => line.replace(/^[-*]\s+/, '').trim())
            .filter(Boolean);
          return `<ul>${items.map((item) => `<li>${this.inline(item)}</li>`).join('')}</ul>`;
        }

        return `<p>${this.inline(trimmed.replace(/\n/g, '<br>'))}</p>`;
      })
      .join('');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private inline(text: string) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
  }
}
