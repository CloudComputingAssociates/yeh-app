// src/app/chat/chat-view.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-view',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chat-view-container">
      <div class="placeholder-content">
        <p class="placeholder-text">Chat view placeholder</p>
      </div>
    </div>
  `,
  styleUrls: ['./chat-view.scss']
})
export class ChatViewComponent {}