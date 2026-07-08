import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OperationsMobileLayoutService {
  readonly pageFocus = signal(false);

  setPageFocus(on: boolean) {
    this.pageFocus.set(on);
  }

  clearPageFocus() {
    this.pageFocus.set(false);
  }
}
