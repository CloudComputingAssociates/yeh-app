// src/app/components/membership-gate/membership-gate.ts
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-membership-gate',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="membership-overlay">
      <mat-card class="membership-card">
        <mat-card-content>
          <div class="logo-section">
            <img src="images/yeh_logo_dark.png" alt="You Eating Healthy" class="brand-logo">
            <h2 class="app-title">you eating healthy</h2>
          </div>
          
          <h1 class="headline">Take charge of your nutrition</h1>
          
          <p class="subhead">
            AI-powered meal planning and tracking with a 24/7 nutrition coach. 
            Get personalized guidance, understand your food choices, and track your progress.
          </p>
          
          <div class="pricing-section">
            <div class="pricing-options">
              <div class="price-option">
                <div class="price-label">Monthly</div>
                <div class="price-amount">$9.99<span class="price-period">/mo</span></div>
              </div>
              
              <div class="price-option featured">
                <div class="save-badge">Save 17%</div>
                <div class="price-label">Annual</div>
                <div class="price-amount">$99.99<span class="price-period">/yr</span></div>
              </div>
            </div>
          </div>
          
          <button 
            mat-raised-button 
            color="primary" 
            class="join-button"
            (click)="login()">
            Join Now
          </button>
          
          <p class="terms">
            By joining, you agree to our Terms of Service and Privacy Policy
          </p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrls: ['./membership-gate.scss']
})
export class MembershipGateComponent {
  private auth = inject(AuthService);
  
  login(): void {
    this.auth.loginWithRedirect();
  }
}