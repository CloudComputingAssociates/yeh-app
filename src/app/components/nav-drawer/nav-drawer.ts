// src/app/nav-drawer/nav-drawer.ts
import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Router } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-nav-drawer',
  standalone: true,
  imports: [CommonModule, MatSidenavModule, MatIconModule, MatListModule],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav
        #drawer
        mode="over"
        [opened]="false"
        class="nav-drawer">
        
        <!-- Drawer Header -->
        <div class="drawer-header">
          <div class="user-info">
            <img 
              src="images/profile_pic.png" 
              alt="Profile" 
              class="drawer-profile-image" />
            <div class="user-details">
              <h3 class="user-name">You Eating Healthy</h3>
              <p class="user-subtitle">What should I eat?</p>
            </div>
          </div>
          <button 
            mat-icon-button 
            (click)="drawer.close()"
            class="close-button"
            aria-label="Close menu">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Menu Items -->
        <mat-nav-list class="menu-list">
          <mat-list-item 
            *ngFor="let item of menuItems"
            (click)="navigateTo(item.route, drawer)"
            class="menu-item">
            <span class="menu-icon">{{ item.icon }}</span>
            <span class="menu-label">{{ item.label }}</span>
            <mat-icon class="chevron-icon">chevron_right</mat-icon>
          </mat-list-item>
        </mat-nav-list>
      </mat-sidenav>

      <!-- Main Content -->
      <mat-sidenav-content>
        <ng-content></ng-content>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styleUrls: ['./nav-drawer.scss']
})
export class NavDrawerComponent {
  @ViewChild('drawer') drawer!: MatSidenav;
  @Output() drawerToggle = new EventEmitter<void>();

  menuItems: MenuItem[] = [
    { label: 'Home', icon: '🏠', route: '/' },
    { label: 'Foods', icon: '🍽️', route: '/foods' },
    { label: 'Plan', icon: '📋', route: '/plan' },
    { label: 'Prep', icon: '👨‍🍳', route: '/prep' },
    { label: 'Trend', icon: '📈', route: '/trend' }  // Also fixed typo: 'trand' → 'trend'
  ];

  constructor(private router: Router) {}

  toggleDrawer(): void {
    this.drawer.toggle();
  }

  navigateTo(route: string, drawer: MatSidenav): void {
    this.router.navigate([route]);
    drawer.close();
  }
}