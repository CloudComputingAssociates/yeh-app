// src/app/components/preferences-panel/preferences-panel.ts
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabService } from '../../services/tab.service';
import { PreferencesService } from '../../services/preferences.service';
import { NotificationService } from '../../services/notification.service';
import { FoodsComponent, SelectedFoodEvent } from '../foods/foods';

@Component({
  selector: 'app-preferences-panel',
  imports: [CommonModule, FoodsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel-container">
      <div class="panel-header">
        <h2 class="panel-title">Preferences</h2>
        <div class="header-buttons">
          <button
            class="save-btn"
            [class.has-changes]="preferencesService.hasUnsavedChanges()"
            [disabled]="!preferencesService.hasUnsavedChanges() || isSaving()"
            (click)="save()">
            {{ isSaving() ? 'Saving...' : 'Save' }}
          </button>
          <button class="close-btn" (click)="close()">Close</button>
        </div>
      </div>

      <!-- Confirmation dialog -->
      @if (showConfirmDialog()) {
        <div class="confirm-overlay" (click)="cancelClose()">
          <div class="confirm-dialog" (click)="$event.stopPropagation()">
            <p>You have unsaved changes. Close without saving?</p>
            <div class="confirm-buttons">
              <button class="confirm-btn discard" (click)="confirmClose()">Discard</button>
              <button class="confirm-btn cancel" (click)="cancelClose()">Cancel</button>
            </div>
          </div>
        </div>
      }

      <div class="panel-content">
        <div class="foods-section">
          <app-foods
            [mode]="'search'"
            [showAiButton]="false"
            [showPreferenceIcons]="true"
            [showFilterRadios]="true"
            (selectedFood)="onFoodSelected($event)" />
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./preferences-panel.scss']
})
export class PreferencesPanelComponent {
  private tabService = inject(TabService);
  protected preferencesService = inject(PreferencesService);
  private notificationService = inject(NotificationService);

  isSaving = signal(false);
  showConfirmDialog = signal(false);

  save(): void {
    if (!this.preferencesService.hasUnsavedChanges()) {
      return;
    }

    this.isSaving.set(true);
    this.preferencesService.saveAllChanges().subscribe({
      next: () => {
        this.isSaving.set(false);
        this.notificationService.show('Preferences saved', 'success');
      },
      error: (err) => {
        console.error('Failed to save preferences:', err);
        this.isSaving.set(false);
        this.notificationService.show('Failed to save preferences', 'error');
      }
    });
  }

  close(): void {
    if (this.preferencesService.hasUnsavedChanges()) {
      this.showConfirmDialog.set(true);
    } else {
      this.tabService.closeTab('preferences');
    }
  }

  confirmClose(): void {
    this.preferencesService.discardChanges();
    this.showConfirmDialog.set(false);
    this.tabService.closeTab('preferences');
  }

  cancelClose(): void {
    this.showConfirmDialog.set(false);
  }

  onFoodSelected(event: SelectedFoodEvent): void {
    console.log('Food selected in Preferences:', event.description);
  }
}
