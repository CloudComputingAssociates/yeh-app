// src/app/components/main-body/main-body.ts
import { Component, ChangeDetectionStrategy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TabService } from '../../services/tab.service';
import { ChatComponent } from '../chat/chat';
import { TodayComponent } from '../today/today';
import { PlanComponent } from '../plan/plan';

@Component({
  selector: 'app-main-body',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    ChatComponent,
    TodayComponent,
    PlanComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="main-body-container">
      <mat-tab-group
        [selectedIndex]="tabService.activeTabIndex()"
        (selectedIndexChange)="onTabIndexChange($event)"
        class="main-body-tabs">

        @for (tab of tabService.tabs(); track tab.id; let i = $index) {
          <mat-tab>
            <ng-template mat-tab-label>
              <span class="tab-label-text">{{ tab.label }}</span>
            </ng-template>

            <div class="tab-content">
              @if (tab.id === 'chat') {
                <app-chat />
              } @else if (tab.id === 'today') {
                <app-today />
              } @else if (tab.id === 'plan') {
                <app-plan />
              } @else if (tab.id === 'progress') {
                <div class="placeholder-content">
                  <p class="placeholder-text">Progress view - Coming soon</p>
                </div>
              } @else if (tab.id === 'shop') {
                <div class="placeholder-content">
                  <p class="placeholder-text">Shop view - Coming soon</p>
                </div>
              }
            </div>
          </mat-tab>
        }

      </mat-tab-group>
    </div>
  `,
  styleUrls: ['./main-body.scss']
})
export class MainBodyComponent {
  tabService = inject(TabService);

  onTabIndexChange(index: number): void {
    // When user manually clicks a tab, update the service
    const tabs = this.tabService.tabs();
    if (tabs[index]) {
      this.tabService.switchToTab(tabs[index].id);
    }
  }
}
