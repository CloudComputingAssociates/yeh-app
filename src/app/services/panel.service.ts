// src/app/services/panel.service.ts
import { Injectable, signal } from '@angular/core';

export type PanelType = 'profile' | 'settings' | 'preferences';

@Injectable({
  providedIn: 'root'
})
export class PanelService {
  private activePanelSignal = signal<PanelType | null>(null);

  activePanel = this.activePanelSignal.asReadonly();

  openPanel(panel: PanelType): void {
    this.activePanelSignal.set(panel);
  }

  closePanel(): void {
    this.activePanelSignal.set(null);
  }
}
