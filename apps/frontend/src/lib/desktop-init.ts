/**
 * Desktop Initialization
 * Initialize Tauri-specific features when running as desktop app
 */

import { isTauri, showNotification } from './tauri';

export const initializeDesktopFeatures = async () => {
    if (!isTauri()) {
        console.log('Running in web mode');
        return;
    }

    console.log('Initializing desktop features...');

    try {
        // Request notification permissions
        if ('__TAURI__' in window) {
            const tauri = (window as any).__TAURI__;

            // Check if notification permission is granted
            const isGranted = await tauri.notification.isPermissionGranted();

            if (!isGranted) {
                const permission = await tauri.notification.requestPermission();
                console.log('Notification permission:', permission);
            }

            // Set up window event handlers
            await tauri.event.listen('tauri://close-requested', () => {
                console.log('Application closing...');
            });

            // Log successful initialization
            console.log('Desktop features initialized successfully');
        }
    } catch (error) {
        console.error('Failed to initialize desktop features:', error);
    }
};

// Helper to show desktop-specific alerts
export const showDesktopAlert = async (
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' = 'info'
) => {
    if (!isTauri()) {
        // Fallback to browser alert
        alert(`${title}\n\n${message}`);
        return;
    }

    try {
        const tauri = (window as any).__TAURI__;
        await tauri.dialog.message(message, {
            title,
            type,
        });
    } catch (error) {
        console.error('Failed to show desktop alert:', error);
        alert(`${title}\n\n${message}`);
    }
};

// Helper to confirm actions
export const confirmDesktopAction = async (
    title: string,
    message: string
): Promise<boolean> => {
    if (!isTauri()) {
        // Fallback to browser confirm
        return confirm(`${title}\n\n${message}`);
    }

    try {
        const tauri = (window as any).__TAURI__;
        const result = await tauri.dialog.confirm(message, {
            title,
            type: 'warning',
        });
        return result;
    } catch (error) {
        console.error('Failed to show confirmation dialog:', error);
        return confirm(`${title}\n\n${message}`);
    }
};

// Window management helpers
export const minimizeWindow = async () => {
    if (!isTauri()) return;

    try {
        const tauri = (window as any).__TAURI__;
        const window = await tauri.window.getCurrent();
        await window.minimize();
    } catch (error) {
        console.error('Failed to minimize window:', error);
    }
};

export const maximizeWindow = async () => {
    if (!isTauri()) return;

    try {
        const tauri = (window as any).__TAURI__;
        const window = await tauri.window.getCurrent();
        await window.toggleMaximize();
    } catch (error) {
        console.error('Failed to maximize window:', error);
    }
};

export const closeWindow = async () => {
    if (!isTauri()) return;

    try {
        const tauri = (window as any).__TAURI__;
        const window = await tauri.window.getCurrent();
        await window.close();
    } catch (error) {
        console.error('Failed to close window:', error);
    }
};
