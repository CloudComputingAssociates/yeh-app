// src/app/services/user-settings.service.ts
import { Injectable, signal, computed } from '@angular/core';

export interface UserSettings {
  yehApprovedFoodsOnly: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  yehApprovedFoodsOnly: true
};

@Injectable({
  providedIn: 'root'
})
export class UserSettingsService {
  private settingsSignal = signal<UserSettings>(DEFAULT_SETTINGS);

  /** Read-only access to all settings */
  readonly settings = this.settingsSignal.asReadonly();

  /** Convenience accessor for YEH Approved Foods Only setting */
  readonly yehApprovedFoodsOnly = computed(() => this.settingsSignal().yehApprovedFoodsOnly);

  /** Update YEH Approved Foods Only setting */
  setYehApprovedFoodsOnly(value: boolean): void {
    this.settingsSignal.update(settings => ({
      ...settings,
      yehApprovedFoodsOnly: value
    }));
    // TODO: Auto-save to database when User API endpoints are ready
    console.log('User setting updated: yehApprovedFoodsOnly =', value);
  }

  /** Update multiple settings at once */
  updateSettings(partial: Partial<UserSettings>): void {
    this.settingsSignal.update(settings => ({
      ...settings,
      ...partial
    }));
    // TODO: Auto-save to database when User API endpoints are ready
  }

  /** Reset settings to defaults */
  resetToDefaults(): void {
    this.settingsSignal.set(DEFAULT_SETTINGS);
  }
}
