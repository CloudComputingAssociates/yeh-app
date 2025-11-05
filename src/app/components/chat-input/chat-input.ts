// src/app/chat/chat-input.ts
import { Component, signal, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chat-input-container">
      <div class="input-wrapper">
        
        <!-- Mic Button (Left) -->
        <button 
          mat-icon-button 
          class="input-icon-btn mic-btn"
          (click)="onMicClick()"
          [attr.aria-label]="'Record voice message'">
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
          [attr.aria-label]="isTalkMode() ? 'Exit conversation mode' : 'Enter conversation mode'">
          TALK
        </button>

        <!-- Camera Button (Right, Disabled) -->
        <button 
          mat-icon-button 
          class="input-icon-btn camera-btn"
          [disabled]="true"
          [attr.aria-label]="'Upload image (coming soon)'">
          <mat-icon>photo_camera</mat-icon>
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

  messageSubmit = output<string>();
  voiceRecord = output<void>();
  talkModeToggle = output<boolean>();

  onMicClick(): void {
    this.voiceRecord.emit();
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