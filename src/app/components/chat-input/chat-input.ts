// src/app/chat/chat-input.ts
import { Component, signal, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chat-input-container">
      <div class="input-wrapper">
        
        <!-- Mic Button (Left) -->
        <button
          mat-icon-button
          class="input-icon-btn mic-btn"
          [class.active]="isMicActive()"
          (click)="toggleMic()"
          [attr.aria-label]="isMicActive() ? 'Stop recording' : 'Start recording'"
          matTooltip="Voice input"
          matTooltipPosition="above"
          [matTooltipShowDelay]="500"
          [matTooltipHideDelay]="5000">
          <mat-icon>mic</mat-icon>
        </button>

        <!-- Text Input (Center) -->
        <textarea
          #textInput
          class="message-input"
          [(ngModel)]="messageText"
          (keydown)="onKeyDown($event)"
          [placeholder]="placeholder()"
          [attr.aria-label]="'Message input'"
          rows="2"></textarea>

        <!-- Talk Button (Right) -->
        <button
          class="talk-btn"
          [class.active]="isTalkMode()"
          (click)="toggleTalkMode()"
          [attr.aria-label]="isTalkMode() ? 'Exit conversation mode' : 'Enter conversation mode'"
          matTooltip="YEH speaks"
          matTooltipPosition="above"
          [matTooltipShowDelay]="500"
          [matTooltipHideDelay]="5000">
          <img src="/images/speak-icon.png" alt="Talk to me" class="talk-icon" />
        </button>

      </div>
    </div>
  `,
  styleUrls: ['./chat-input.scss']
})
export class ChatInputComponent {
  messageText = '';
  placeholder = signal('yeh? ');
  isTalkMode = signal(false);
  isMicActive = signal(false);

  messageSubmit = output<string>();
  voiceRecord = output<boolean>();
  talkModeToggle = output<boolean>();

  toggleMic(): void {
    const newMode = !this.isMicActive();
    this.isMicActive.set(newMode);
    this.voiceRecord.emit(newMode);
  }

  toggleTalkMode(): void {
    const newMode = !this.isTalkMode();
    this.isTalkMode.set(newMode);
    this.talkModeToggle.emit(newMode);
  }

  onKeyDown(event: KeyboardEvent): void {
    // Submit on Enter (without Shift)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submitMessage();
    }
  }

  submitMessage(): void {
    const text = this.messageText.trim();
    if (text) {
      this.messageSubmit.emit(text);
      this.messageText = '';
    }
  }
}