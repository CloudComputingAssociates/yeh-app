// src/app/top-app-bar/top-app-bar.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-top-app-bar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
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
        
        <button 
          class="profile-button" 
          (click)="navigateToProfile()"
          aria-label="View profile">
          <img 
            [src]="userProfileImage" 
            alt="User profile"
            class="profile-image" />
        </button>
      </div>
    </header>
  `,
  styleUrls: ['./top-app-bar.scss']
})
export class TopAppBarComponent {
  @Input() userProfileImage: string = '/images/profile_pic.jpg';
  @Output() menuClick = new EventEmitter<void>();
  
  constructor(private router: Router) {}

  onMenuClick(): void {
    this.menuClick.emit();
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }
}