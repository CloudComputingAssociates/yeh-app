// src/app/components/chat/chat.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chat-container">
      <div class="chat-messages">
        <div class="placeholder-content">
          <p class="placeholder-text">Chat messages will appear here</p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./chat.scss']
})
export class ChatComponent {}
