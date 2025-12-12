// src/app/components/app-bar/app-bar.ts
import { Component, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProfileMenuComponent } from '../profile-menu/profile-menu';

@Component({
  selector: 'app-app-bar',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, ProfileMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="app-bar">
      <div class="app-bar-content">
        <button
          mat-icon-button
          class="menu-button"
          (click)="onMenuClick()"
          aria-label="Open navigation menu">
          <mat-icon>menu</mat-icon>
        </button>

        <span class="app-title">you eating healthy</span>

        <app-profile-menu />
      </div>
    </header>
  `,
  styleUrls: ['./app-bar.scss']
})
export class AppBarComponent {
  @Output() menuClick = new EventEmitter<void>();

  onMenuClick(): void {
    this.menuClick.emit();
  }
}
