// src/app/components/preferences-panel/preferences-panel.ts
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabService } from '../../services/tab.service';
import { FoodsComponent, SelectedFoodEvent } from '../foods/foods';

@Component({
  selector: 'app-preferences-panel',
  imports: [CommonModule, FoodsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel-container">
      <div class="panel-header">
        <h2 class="panel-title">Preferences</h2>
        <button class="close-btn" (click)="close()">Close</button>
      </div>

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

  close(): void {
    this.tabService.closeTab('preferences');
  }

  onFoodSelected(event: SelectedFoodEvent): void {
    console.log('Food selected in Preferences:', event.description);
  }
}
