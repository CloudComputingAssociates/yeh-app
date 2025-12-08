// src/app/components/account-panel/account-panel.ts
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelService } from '../../services/panel.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-account-panel',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel-container">
      <div class="panel-header">
        <h2 class="panel-title">Account</h2>
        <button class="close-btn" (click)="close()">Close</button>
      </div>

      <div class="panel-content">
        <p class="placeholder-text">Account settings</p>
        <p class="placeholder-subtext">(Coming soon)</p>
      </div>
    </div>
  `,
  styleUrls: ['./account-panel.scss']
})
export class AccountPanelComponent {
  private panelService = inject(PanelService);
  private notificationService = inject(NotificationService);

  close(): void {
    this.panelService.closePanel();
  }

  // Example save method for future use
  protected saveField(field: string, value: unknown): void {
    // Save logic here
    this.notificationService.show('Saved');
  }
}
