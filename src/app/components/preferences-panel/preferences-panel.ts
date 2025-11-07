// src/app/components/preferences-panel/preferences-panel.ts
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelService } from '../../services/panel.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-preferences-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel-overlay">
      <div class="panel-header">
        <h2 class="panel-title">Preferences</h2>
        <button class="close-btn" (click)="close()">Close</button>
      </div>

      <div class="panel-content">
        <p class="placeholder-text">Preferences</p>
        <p class="placeholder-subtext">(Coming soon)</p>
      </div>
    </div>
  `,
  styleUrls: ['./preferences-panel.scss']
})
export class PreferencesPanelComponent {
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
