// src/app/chat/display.ts
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ChatViewComponent } from './chat-view';
import { PlanViewComponent } from './plan-view';

interface ChatTab {
  id: string;
  label: string;
  component: any;
  closeable: boolean;
}

@Component({
  selector: 'app-chat-display',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    ChatViewComponent,
    PlanViewComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chat-display-container">
      <mat-tab-group 
        [(selectedIndex)]="activeTabIndex"
        class="chat-tabs">
        
        @for (tab of tabs(); track tab.id) {
          <mat-tab>
            <ng-template mat-tab-label>
              <span class="tab-label-text">{{ tab.label }}</span>
              @if (tab.closeable) {
                <button 
                  mat-icon-button 
                  class="tab-close-btn"
                  (click)="closeTab($event, tab.id)"
                  [attr.aria-label]="'Close ' + tab.label + ' tab'">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </ng-template>
            
            <div class="tab-content">
              @if (tab.id === 'chat') {
                <app-chat-view />
              } @else if (tab.id === 'plan') {
                <app-plan-view />
              }
            </div>
          </mat-tab>
        }
        
      </mat-tab-group>
    </div>
  `,
  styleUrls: ['./display.scss']
})
export class ChatDisplayComponent {
  tabs = signal<ChatTab[]>([
    {
      id: 'chat',
      label: 'Chat',
      component: ChatViewComponent,
      closeable: false
    }
  ]);

  activeTabIndex = 0;

  closeTab(event: Event, tabId: string): void {
    event.stopPropagation();
    
    const currentTabs = this.tabs();
    const tabIndex = currentTabs.findIndex(t => t.id === tabId);
    
    if (tabIndex === -1 || !currentTabs[tabIndex].closeable) {
      return;
    }

    // Remove the tab
    const newTabs = currentTabs.filter(t => t.id !== tabId);
    this.tabs.set(newTabs);

    // Switch to Chat tab if we closed the active tab
    if (this.activeTabIndex === tabIndex) {
      this.activeTabIndex = 0;
    } else if (this.activeTabIndex > tabIndex) {
      this.activeTabIndex--;
    }
  }

  addPlanTab(): void {
    const currentTabs = this.tabs();
    const hasPlanTab = currentTabs.some(t => t.id === 'plan');
    
    if (!hasPlanTab) {
      this.tabs.set([
        ...currentTabs,
        {
          id: 'plan',
          label: 'Plan',
          component: PlanViewComponent,
          closeable: true
        }
      ]);
      
      // Switch to the new Plan tab
      this.activeTabIndex = currentTabs.length;
    }
  }

  switchToChat(): void {
    this.activeTabIndex = 0;
  }
}