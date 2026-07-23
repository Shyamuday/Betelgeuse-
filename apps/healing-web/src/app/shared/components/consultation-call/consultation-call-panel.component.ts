import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ConsultationWebrtcCallService } from './consultation-webrtc-call.service';
import type { CallMode, CallSignalingSocket, IceServerConfig } from './webrtc-call.types';

@Component({
  selector: 'app-consultation-call-panel',
  standalone: true,
  template: `
    @if (canCall()) {
      <div class="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-sm font-semibold text-blue-950">{{ statusLabel() }}</p>
            @if (call.error()) {
              <p class="mt-1 text-sm text-red-700">{{ call.error() }}</p>
            }
          </div>

          <div class="flex flex-wrap gap-2">
            @if (call.state() === 'idle' || call.state() === 'ended') {
              <button
                type="button"
                class="call-btn bg-blue-600 hover:bg-blue-700"
                (click)="start('audio')"
                [disabled]="busy()"
              >
                Voice call
              </button>
              <button
                type="button"
                class="call-btn bg-green-600 hover:bg-green-700"
                (click)="start('video')"
                [disabled]="busy()"
              >
                Video call
              </button>
            }
            @if (call.state() === 'ringing' && call.incomingCall()) {
              <button
                type="button"
                class="call-btn bg-green-600 hover:bg-green-700"
                (click)="accept()"
              >
                Accept
              </button>
              <button type="button" class="call-btn bg-red-600 hover:bg-red-700" (click)="reject()">
                Decline
              </button>
            }
            @if (call.state() === 'connected' || call.state() === 'connecting') {
              <button
                type="button"
                class="call-btn bg-gray-700 hover:bg-gray-800"
                (click)="toggleMic()"
              >
                {{ micOn() ? 'Mute' : 'Unmute' }}
              </button>
              @if (call.callMode() === 'video') {
                <button
                  type="button"
                  class="call-btn bg-gray-700 hover:bg-gray-800"
                  (click)="toggleCamera()"
                >
                  {{ cameraOn() ? 'Camera off' : 'Camera on' }}
                </button>
              }
              <button type="button" class="call-btn bg-red-600 hover:bg-red-700" (click)="hangUp()">
                End call
              </button>
            }
          </div>
        </div>

        @if (call.state() === 'connected' || call.state() === 'connecting') {
          <audio #remoteAudio autoplay></audio>
        }

        @if (isVideoActive()) {
          <div class="relative mt-3 aspect-video overflow-hidden rounded-lg bg-gray-950">
            <video #remoteVideo class="h-full w-full object-cover" autoplay playsinline></video>
            <video
              #localVideo
              class="absolute bottom-3 right-3 h-24 w-32 rounded-md border border-white/70 object-cover shadow-lg"
              autoplay
              playsinline
              muted
            ></video>
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      .call-btn {
        border-radius: 0.375rem;
        color: #fff;
        font-size: 0.875rem;
        font-weight: 700;
        min-height: 2.5rem;
        padding: 0.5rem 0.75rem;
        transition: background-color 150ms ease;
      }

      .call-btn:disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
      }
    `,
  ],
})
export class ConsultationCallPanelComponent implements OnChanges, OnDestroy {
  readonly call = inject(ConsultationWebrtcCallService);

  @Input() consultationId = '';
  @Input() targetUserId = '';
  @Input() socket: CallSignalingSocket | null = null;
  @Input() iceServers: IceServerConfig[] = [{ urls: 'stun:stun.l.google.com:19302' }];
  @Input() enabled = true;

  @ViewChild('localVideo') localVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteAudio') remoteAudioRef?: ElementRef<HTMLAudioElement>;

  readonly busy = signal(false);
  readonly micOn = signal(true);
  readonly cameraOn = signal(true);

  constructor() {
    effect(() => {
      const local = this.call.localStream();
      const el = this.localVideoRef?.nativeElement;
      if (el) el.srcObject = local;
    });
    effect(() => {
      const remote = this.call.remoteStream();
      const el = this.remoteVideoRef?.nativeElement;
      if (el) el.srcObject = remote;
    });
    effect(() => {
      const remote = this.call.remoteStream();
      const el = this.remoteAudioRef?.nativeElement;
      if (el) el.srcObject = remote;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['socket']?.currentValue) {
      this.call.bindSocket(changes['socket'].currentValue as CallSignalingSocket);
    }
  }

  ngOnDestroy(): void {
    this.call.cleanup();
  }

  canCall(): boolean {
    return this.enabled && !!this.consultationId && !!this.targetUserId && !!this.socket;
  }

  isVideoActive(): boolean {
    return (
      this.call.callMode() === 'video' &&
      (this.call.state() === 'connected' || this.call.state() === 'connecting')
    );
  }

  statusLabel(): string {
    const map: Record<string, string> = {
      idle: 'Voice & video consultation available',
      ringing: this.call.incomingCall() ? 'Incoming call...' : 'Calling...',
      connecting: 'Connecting...',
      connected: this.call.callMode() === 'video' ? 'On video call' : 'On voice call',
      ended: 'Call ended',
      error: 'Call error',
    };
    return map[this.call.state()] ?? '';
  }

  async start(mode: CallMode): Promise<void> {
    if (!this.socket || !this.consultationId || !this.targetUserId) return;
    this.busy.set(true);
    try {
      await this.call.startCall({
        socket: this.socket,
        consultationId: this.consultationId,
        targetUserId: this.targetUserId,
        mode,
        iceServers: this.iceServers,
      });
    } catch {
      // The service sets the visible error state.
    } finally {
      this.busy.set(false);
    }
  }

  accept(): void {
    void this.call.acceptIncoming(this.iceServers);
  }

  reject(): void {
    const targetUserId = this.call.pendingOffer()?.fromUserId ?? this.targetUserId;
    if (!this.consultationId || !targetUserId) return;
    this.call.rejectCall({ consultationId: this.consultationId, targetUserId });
  }

  hangUp(): void {
    if (!this.consultationId || !this.targetUserId) return;
    this.call.endCall({ consultationId: this.consultationId, targetUserId: this.targetUserId });
  }

  toggleMic(): void {
    const next = !this.micOn();
    this.micOn.set(next);
    this.call.setMicEnabled(next);
  }

  toggleCamera(): void {
    const next = !this.cameraOn();
    this.cameraOn.set(next);
    this.call.setCameraEnabled(next);
  }
}
