import { Component, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProfileMenuComponent } from '../profile-menu/profile-menu';

@Component({
  selector: 'app-top-app-bar',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, ProfileMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="top-app-bar">
      <div class="app-bar-content">
        <button 
          mat-icon-button
          class="menu-button"
          (click)="onMenuClick()"
          aria-label="Open navigation menu">
          <mat-icon>menu</mat-icon>
        </button>
        
        <h1 class="app-title">youeatinghealthy</h1>
        
        <app-profile-menu />
      </div>
    </header>
  `,
  styleUrls: ['./top-app-bar.scss']
})
export class TopAppBarComponent {
  @Output() menuClick = new EventEmitter<void>();

  onMenuClick(): void {
    this.menuClick.emit();
  }
}