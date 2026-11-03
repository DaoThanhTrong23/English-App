/**
 * Test Harness for Mobile English E2E Tests
 * Provides an in-memory execution runtime simulating React Native Mobile behaviors,
 * state persistence (SecureStore), API interceptors, and user actions.
 */

import assert from 'node:assert/strict';
import { createDefaultMockState, type MockState } from './mock-api';

export interface MobileClientState {
  currentRoute: string;
  secureStore: Record<string, string>;
  activeUser: MockState['users'][0] | null;
  currentTheme: 'light' | 'dark';
  notificationsEnabled: boolean;
  reminderTime: string;
  isOnline: boolean;
  activeDialog: { title: string; message: string; buttons: Array<{ text: string; onPress?: () => void }> } | null;
  activeToast: { message: string; type: 'success' | 'error' | 'info' } | null;
}

export let sharedState: MockState = createDefaultMockState();
export let clientState: MobileClientState = createDefaultClientState();

export function createDefaultClientState(): MobileClientState {
  return {
    currentRoute: '/(auth)/login',
    secureStore: {},
    activeUser: null,
    currentTheme: 'light',
    notificationsEnabled: true,
    reminderTime: '20:00',
    isOnline: true,
    activeDialog: null,
    activeToast: null,
  };
}

export function resetState(): MockState {
  sharedState = createDefaultMockState();
  clientState = createDefaultClientState();
  return sharedState;
}

// ==========================================
// MOCK SECURE STORE
// ==========================================
export const mockSecureStore = {
  async getItemAsync(key: string): Promise<string | null> {
    return clientState.secureStore[key] ?? null;
  },
  async setItemAsync(key: string, value: string): Promise<void> {
    clientState.secureStore[key] = value;
  },
  async deleteItemAsync(key: string): Promise<void> {
    delete clientState.secureStore[key];
  },
};

// ==========================================
// MOCK ROUTER
// ==========================================
export const mockRouter = {
  push(route: string) {
    clientState.currentRoute = route;
  },
  replace(route: string) {
    clientState.currentRoute = route;
  },
  back() {
    clientState.currentRoute = '/';
  },
};

// ==========================================
// MOCK NOTIFICATIONS & ALERTS
// ==========================================
export function showMockAlert(title: string, message: string, buttons: Array<{ text: string; onPress?: () => void }> = []) {
  clientState.activeDialog = { title, message, buttons };
}

export function showMockToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  clientState.activeToast = { message, type };
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

