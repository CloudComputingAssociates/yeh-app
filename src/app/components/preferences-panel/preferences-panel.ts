// src/app/components/preferences-panel/preferences-panel.ts
import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabService } from '../../services/tab.service';
import { PreferencesService } from '../../services/preferences.service';
import { NotificationService } from '../../services/notification.service';
import { UserSettingsService, DefaultFoodList, MealsPerDay, FastingType } from '../../services/user-settings.service';
import { FoodsComponent, SelectedFoodEvent } from '../foods/foods';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-preferences-panel',
  imports: [CommonModule, FormsModule, FoodsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel-container">
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
        <!-- Settings Section with grouped boxes and buttons -->
        <div class="settings-section">
          <!-- On startup grouping -->
          <div class="settings-group">
            <div class="group-header">On Startup</div>
            <div class="group-content">
              <div class="setting-row">
                <label class="setting-label">Foods</label>
                <select
                  class="setting-select"
                  [ngModel]="userSettingsService.defaultFoodList()"
                  (ngModelChange)="onDefaultFoodListChange($event)">
                  <option value="yeh">YEH Approved</option>
                  <option value="myfoods">My Foods</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Food Plan grouping -->
          <div class="settings-group">
            <div class="group-header">Food Plan</div>
            <div class="group-content vertical">
              <div class="setting-row">
                <label class="setting-label">Meals</label>
                <select
                  class="setting-select"
                  [ngModel]="userSettingsService.mealsPerDay()"
                  (ngModelChange)="onMealsPerDayChange($event)">
                  <option [ngValue]="1">1 meal</option>
                  <option [ngValue]="2">2 meals</option>
                  <option [ngValue]="3">3 meals</option>
                  <option [ngValue]="4">4 meals</option>
                  <option [ngValue]="5">5 meals</option>
                  <option [ngValue]="6">6 meals</option>
                </select>
              </div>
              <div class="setting-row">
                <label class="setting-label">Fasting</label>
                <select
                  class="setting-select"
                  [ngModel]="userSettingsService.fastingType()"
                  (ngModelChange)="onFastingTypeChange($event)">
                  <option value="none">None</option>
                  <option value="16:8">16:8</option>
                  <option value="18:6">18:6</option>
                  <option value="20:4">20:4</option>
                  <option value="omad">OMAD</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Save button - icon style -->
          <div class="action-buttons">
            <button
              class="icon-btn save-btn"
              [class.has-changes]="hasAnyChanges()"
              [disabled]="!hasAnyChanges() || isSaving()"
              (click)="save()"
              title="Save changes">
              ✓
            </button>
          </div>
        </div>

        <!-- Foods Section -->
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
export class PreferencesPanelComponent implements OnInit {
  private tabService = inject(TabService);
  protected preferencesService = inject(PreferencesService);
  protected userSettingsService = inject(UserSettingsService);
  private notificationService = inject(NotificationService);

  isSaving = signal(false);
  showConfirmDialog = signal(false);
  settingsChanged = signal(false);

  ngOnInit(): void {
    // Load user settings when panel opens
    this.userSettingsService.loadSettings().subscribe();
  }

  hasAnyChanges(): boolean {
    return this.preferencesService.hasUnsavedChanges() || this.settingsChanged();
  }

  onDefaultFoodListChange(value: DefaultFoodList): void {
    this.userSettingsService.setDefaultFoodList(value);
    this.settingsChanged.set(true);
  }

  onMealsPerDayChange(value: MealsPerDay): void {
    this.userSettingsService.setMealsPerDay(value);
    this.settingsChanged.set(true);
  }

  onFastingTypeChange(value: FastingType): void {
    this.userSettingsService.setFastingType(value);
    this.settingsChanged.set(true);
  }

  save(): void {
    if (!this.hasAnyChanges()) {
      return;
    }

    this.isSaving.set(true);

    // Build array of save operations
    const saveOps = [];
    if (this.preferencesService.hasUnsavedChanges()) {
      saveOps.push(this.preferencesService.saveAllChanges());
    }
    if (this.settingsChanged()) {
      saveOps.push(this.userSettingsService.saveSettings());
    }

    if (saveOps.length === 0) {
      this.isSaving.set(false);
      return;
    }

    forkJoin(saveOps).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.settingsChanged.set(false);
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
    if (this.hasAnyChanges()) {
      this.showConfirmDialog.set(true);
    } else {
      this.tabService.closeTab('preferences');
    }
  }

  confirmClose(): void {
    this.preferencesService.discardChanges();
    this.settingsChanged.set(false);
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
