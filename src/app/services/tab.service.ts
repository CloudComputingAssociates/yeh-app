// src/app/services/tab.service.ts
import { Injectable, signal } from '@angular/core';

export interface Tab {
  id: string;
  label: string;
  closeable: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TabService {
  private tabsSignal = signal<Tab[]>([
    {
      id: 'chat',
      label: 'Chat',
      closeable: false
    }
  ]);

  private activeTabIndexSignal = signal<number>(0);

  // Expose signals as readonly
  tabs = this.tabsSignal.asReadonly();
  activeTabIndex = this.activeTabIndexSignal.asReadonly();

  toggleTab(tabId: string, label: string): void {
    const currentTabs = this.tabsSignal();
    const existingTabIndex = currentTabs.findIndex(t => t.id === tabId);

    if (existingTabIndex !== -1) {
      // Tab exists - check if it's active
      if (this.activeTabIndexSignal() === existingTabIndex) {
        // Active tab clicked - close it
        this.closeTab(tabId);
      } else {
        // Inactive tab clicked - switch to it
        this.activeTabIndexSignal.set(existingTabIndex);
      }
    } else {
      // Tab doesn't exist - add it
      this.tabsSignal.set([
        ...currentTabs,
        {
          id: tabId,
          label,
          closeable: true
        }
      ]);
      // Switch to the new tab
      this.activeTabIndexSignal.set(currentTabs.length);
    }
  }

  openTab(tabId: string, label: string): void {
    const currentTabs = this.tabsSignal();
    const existingTabIndex = currentTabs.findIndex(t => t.id === tabId);

    if (existingTabIndex !== -1) {
      // Tab already exists, just switch to it
      this.activeTabIndexSignal.set(existingTabIndex);
    } else {
      // Add new tab
      this.tabsSignal.set([
        ...currentTabs,
        {
          id: tabId,
          label,
          closeable: true
        }
      ]);
      // Switch to the new tab
      this.activeTabIndexSignal.set(currentTabs.length);
    }
  }

  closeTab(tabId: string): void {
    const currentTabs = this.tabsSignal();
    const tabIndex = currentTabs.findIndex(t => t.id === tabId);

    if (tabIndex === -1 || !currentTabs[tabIndex].closeable) {
      return;
    }

    // Remove the tab
    const newTabs = currentTabs.filter(t => t.id !== tabId);
    this.tabsSignal.set(newTabs);

    // Adjust active tab index if needed
    const currentActiveIndex = this.activeTabIndexSignal();
    if (currentActiveIndex === tabIndex) {
      // Closed the active tab, switch to Chat (index 0)
      this.activeTabIndexSignal.set(0);
    } else if (currentActiveIndex > tabIndex) {
      // Active tab is after the closed tab, decrement index
      this.activeTabIndexSignal.set(currentActiveIndex - 1);
    }
  }

  switchToChat(): void {
    this.activeTabIndexSignal.set(0);
  }

  switchToTab(tabId: string): void {
    const currentTabs = this.tabsSignal();
    const tabIndex = currentTabs.findIndex(t => t.id === tabId);
    if (tabIndex !== -1) {
      this.activeTabIndexSignal.set(tabIndex);
    }
  }
}
