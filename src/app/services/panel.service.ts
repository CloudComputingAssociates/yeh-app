// src/app/services/panel.service.ts
import { Injectable, signal } from '@angular/core';

export type PanelType = 'account' | 'preferences';

@Injectable({
  providedIn: 'root'
})
export class PanelService {
  private activePanelSignal = signal<PanelType | null>(null);

  activePanel = this.activePanelSignal.asReadonly();

  /** Toggle panel - if same panel is already open, close it; otherwise open the new one */
  togglePanel(panel: PanelType): void {
    if (this.activePanelSignal() === panel) {
      this.activePanelSignal.set(null);
    } else {
      this.activePanelSignal.set(panel);
    }
  }

  /** Open a specific panel (non-toggle) */
  openPanel(panel: PanelType): void {
    this.activePanelSignal.set(panel);
  }

  closePanel(): void {
    this.activePanelSignal.set(null);
  }
}
