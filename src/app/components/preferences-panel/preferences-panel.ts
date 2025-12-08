// src/app/components/preferences-panel/preferences-panel.ts
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PanelService } from '../../services/panel.service';
import { NotificationService } from '../../services/notification.service';
import { UserSettingsService } from '../../services/user-settings.service';

@Component({
  selector: 'app-preferences-panel',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel-container">
      <div class="panel-header">
        <h2 class="panel-title">Preferences</h2>
        <button class="close-btn" (click)="close()">Close</button>
      </div>

      <div class="panel-content">
        <div class="settings-section">
          <h3 class="section-title">Food Search</h3>
          <label class="checkbox-setting">
            <input
              type="checkbox"
              [checked]="userSettings.yehApprovedFoodsOnly()"
              (change)="onYehApprovedChange($event)" />
            <span class="checkbox-label">YEH Approved Foods Only</span>
          </label>
          <p class="setting-description">When enabled, food searches will default to showing only YEH-approved foods.</p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./preferences-panel.scss']
})
export class PreferencesPanelComponent {
  private panelService = inject(PanelService);
  private notificationService = inject(NotificationService);
  protected userSettings = inject(UserSettingsService);

  close(): void {
    this.panelService.closePanel();
  }

  onYehApprovedChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.userSettings.setYehApprovedFoodsOnly(checked);
    this.notificationService.show('Setting saved');
  }
}
