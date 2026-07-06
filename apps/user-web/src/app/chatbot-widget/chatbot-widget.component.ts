import {
  Component, ElementRef, ViewChild, AfterViewChecked,
  inject, signal, OnInit, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService } from '../core/services/chatbot.service';
import { PublicConfigService } from '../core/services/public-config.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot-widget.component.html',
  styleUrl: './chatbot-widget.component.scss'
})
export class ChatbotWidgetComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesEnd') private messagesEnd!: ElementRef<HTMLDivElement>;

  readonly chat = inject(ChatbotService);
  private readonly publicConfig = inject(PublicConfigService);
  private readonly auth = inject(AuthService);
  inputText = '';
  private shouldScroll = false;
  readonly showBadge = signal(false);
  readonly whatsappUrl = signal('https://wa.me/');

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn() && this.chat.sessionId()) {
        void this.chat.linkToUser();
      }
    });
  }

  ngOnInit() {
    void this.publicConfig.get().then(cfg => this.whatsappUrl.set(this.publicConfig.whatsappUrl(cfg)));

    setTimeout(() => {
      if (!this.chat.isOpen()) this.showBadge.set(true);
    }, 5000);
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  openChat() {
    this.showBadge.set(false);
    this.chat.open();
    this.shouldScroll = true;
  }

  toggleChat() {
    if (!this.chat.isOpen()) {
      this.showBadge.set(false);
    }
    this.chat.toggle();
    this.shouldScroll = true;
  }

  selectOption(option: string) {
    if (option === 'Close chat') {
      this.chat.close();
      return;
    }
    if (option === 'Start a new question') {
      this.chat.resetSession();
      this.shouldScroll = true;
      return;
    }
    this.shouldScroll = true;
    void this.chat.sendMessage(option);
  }

  send() {
    const text = this.inputText.trim();
    if (!text || this.chat.isLoading()) return;
    this.inputText = '';
    this.shouldScroll = true;
    this.chat.sendMessage(text);
  }

  onEnter(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }

  private scrollToBottom() {
    try {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      // no-op
    }
  }

  formatMessage(text: string): string {
    return text.replace(/\n/g, '<br>');
  }
}
