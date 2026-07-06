import { Component, input } from '@angular/core';
import type { DetailRow } from './detail-rows.types';

@Component({
  selector: 'vitalis-detail-rows',
  standalone: true,
  templateUrl: './detail-rows.component.html',
  styleUrl: './detail-rows.component.scss',
  host: {
    '[class.detail-rows-panel]': "variant() === 'panel'",
    '[class.detail-rows-stat]': "variant() === 'stat'"
  }
})
export class DetailRowsComponent {
  readonly rows = input.required<DetailRow[]>();
  /** `inline` → labeled paragraphs; `grid` → labeled cards; `panel` → h2 panels; `stat` → h3 stat cards; `blocks` → strong + paragraph blocks. */
  readonly variant = input<'inline' | 'grid' | 'panel' | 'stat' | 'blocks'>('inline');
}
