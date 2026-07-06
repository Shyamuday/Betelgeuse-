import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReceptionApiService } from '../../services/reception-api.service';

const FOLLOW_UP_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'NEEDS_CALLBACK', label: 'Needs callback' },
  { value: 'CALLED', label: 'Called' },
  { value: 'NO_ANSWER', label: 'No answer' },
  { value: 'WHATSAPP_SENT', label: 'WhatsApp sent' },
  { value: 'REGISTERED', label: 'Registered' },
  { value: 'BOOKED', label: 'Booked consultation' },
  { value: 'NOT_INTERESTED', label: 'Not interested' },
  { value: 'CLOSED', label: 'Closed' }
] as const;

type FollowUpFilter = 'ALL' | 'NEEDS_CALLBACK' | 'NEW' | 'CALLED' | 'REGISTERED';

@Component({
  selector: 'app-visitor-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './visitor-leads.component.html',
  styleUrl: './visitor-leads.component.scss'
})
export class VisitorLeadsComponent {
  private readonly api = inject(ReceptionApiService);

  readonly leads = signal<any[]>([]);
  readonly selected = signal<any | null>(null);
  readonly loading = signal(false);
  readonly detailLoading = signal(false);
  readonly mutating = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly followUpFilter = signal<FollowUpFilter>('NEEDS_CALLBACK');
  readonly stats = signal<any | null>(null);

  readonly followUpOptions = FOLLOW_UP_OPTIONS;

  selectedStatus = 'NEEDS_CALLBACK';
  operatorNote = '';

  constructor() {
    void this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const filter = this.followUpFilter();
      const [res, statsRes] = await Promise.all([
        this.api.listVisitorLeads(filter === 'ALL' ? undefined : filter),
        this.api.getVisitorLeadStats()
      ]);
      this.leads.set(res.leads);
      this.stats.set(statsRes.stats);
    } catch {
      this.error.set('Could not load visitor leads.');
    } finally {
      this.loading.set(false);
    }
  }

  async setFilter(status: FollowUpFilter) {
    this.followUpFilter.set(status);
    this.selected.set(null);
    await this.load();
  }

  async selectLead(id: string) {
    this.detailLoading.set(true);
    this.message.set('');
    try {
      const res = await this.api.getVisitorLead(id);
      this.selected.set(res.lead);
      this.selectedStatus = res.lead.followUpStatus;
      this.operatorNote = res.lead.operatorNote ?? '';
    } catch {
      this.error.set('Could not load lead.');
    } finally {
      this.detailLoading.set(false);
    }
  }

  async markCalled() {
    const lead = this.selected();
    if (!lead) return;
    this.mutating.set(true);
    try {
      const res = await this.api.updateVisitorLeadFollowUp(lead.id, {
        followUpStatus: 'CALLED',
        operatorNote: this.operatorNote || undefined,
        markCalled: true
      });
      this.selected.set(res.lead);
      this.selectedStatus = 'CALLED';
      this.message.set('Marked as called.');
      await this.load();
    } catch {
      this.error.set('Could not update follow-up.');
    } finally {
      this.mutating.set(false);
    }
  }

  async saveFollowUp() {
    const lead = this.selected();
    if (!lead) return;
    this.mutating.set(true);
    try {
      const res = await this.api.updateVisitorLeadFollowUp(lead.id, {
        followUpStatus: this.selectedStatus,
        operatorNote: this.operatorNote || undefined,
        markCalled: this.selectedStatus === 'CALLED'
      });
      this.selected.set(res.lead);
      this.message.set('Follow-up saved.');
      await this.load();
    } catch {
      this.error.set('Could not save follow-up.');
    } finally {
      this.mutating.set(false);
    }
  }

  followUpLabel(status: string): string {
    return this.followUpOptions.find((o) => o.value === status)?.label ?? status;
  }

  sourceLabel(source: string): string {
    switch (source) {
      case 'CHAT_BOT': return 'Chat';
      case 'HOME_BOOKING': return 'Home booking';
      case 'PROMO_POPUP': return 'Promo popup';
      default: return source;
    }
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  leadPreview(lead: any): string {
    return lead.concern ?? lead.visitorName ?? lead.visitorPhone ?? 'Website inquiry';
  }
}
