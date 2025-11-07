// src/app/components/settings-panel/settings-panel.ts
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelService } from '../../services/panel.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel-overlay">
      <div class="panel-header">
        <h2 class="panel-title">Settings</h2>
        <button class="close-btn" (click)="close()">Close</button>
      </div>

      <div class="panel-content">
        <p class="placeholder-text">Settings</p>
        <p class="placeholder-subtext">(Coming soon)</p>
      </div>
    </div>
  `,
  styleUrls: ['./settings-panel.scss']
})
export class SettingsPanelComponent {
  private panelService = inject(PanelService);
  private notificationService = inject(NotificationService);

  close(): void {
    this.panelService.closePanel();
  }

  // Example save method for future use
  protected saveField(field: string, value: any): void {
    // Save logic here
    this.notificationService.show('Saved ✓');
  }
}
