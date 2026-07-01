/**
 * Tauri Desktop Integration Utilities
 * Provides helper functions for desktop-specific features
 */

// Check if running in Tauri desktop environment
export const isTauri = (): boolean => {
    return typeof window !== 'undefined' && '__TAURI__' in window;
};

// Get Tauri API if available
export const getTauriAPI = () => {
    if (isTauri()) {
        return (window as any).__TAURI__;
    }
    return null;
};

// Platform detection
export const getPlatform = async (): Promise<string> => {
    if (!isTauri()) return 'web';

    try {
        const tauri = getTauriAPI();
        const platform = await tauri.os.platform();
        return platform;
    } catch (error) {
        console.error('Failed to get platform:', error);
        return 'unknown';
    }
};

// Show native notification
export const showNotification = async (title: string, body: string) => {
    if (!isTauri()) {
        // Fallback to web notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body });
        }
        return;
    }

    try {
        const tauri = getTauriAPI();
        await tauri.notification.sendNotification({
            title,
            body,
        });
    } catch (error) {
        console.error('Failed to show notification:', error);
    }
};

// Save file dialog
export const saveFileDialog = async (
    defaultPath?: string,
    filters?: Array<{ name: string; extensions: string[] }>
): Promise<string | null> => {
    if (!isTauri()) {
        console.warn('Save dialog only available in desktop mode');
        return null;
    }

    try {
        const tauri = getTauriAPI();
        const result = await tauri.dialog.save({
            defaultPath,
            filters,
        });
        return result;
    } catch (error) {
        console.error('Failed to open save dialog:', error);
        return null;
    }
};

// Open file dialog
export const openFileDialog = async (
    filters?: Array<{ name: string; extensions: string[] }>,
    multiple?: boolean
): Promise<string | string[] | null> => {
    if (!isTauri()) {
        console.warn('Open dialog only available in desktop mode');
        return null;
    }

    try {
        const tauri = getTauriAPI();
        const result = await tauri.dialog.open({
            filters,
            multiple: multiple || false,
        });
        return result;
    } catch (error) {
        console.error('Failed to open file dialog:', error);
        return null;
    }
};

// Write file to disk
export const writeFile = async (
    path: string,
    contents: string | Uint8Array
): Promise<boolean> => {
    if (!isTauri()) {
        console.warn('File writing only available in desktop mode');
        return false;
    }

    try {
        const tauri = getTauriAPI();
        await tauri.fs.writeFile({
            path,
            contents,
        });
        return true;
    } catch (error) {
        console.error('Failed to write file:', error);
        return false;
    }
};

// Read file from disk
export const readFile = async (path: string): Promise<string | null> => {
    if (!isTauri()) {
        console.warn('File reading only available in desktop mode');
        return null;
    }

    try {
        const tauri = getTauriAPI();
        const contents = await tauri.fs.readTextFile(path);
        return contents;
    } catch (error) {
        console.error('Failed to read file:', error);
        return null;
    }
};

// Store data persistently (secure storage)
export const storeSet = async (key: string, value: any): Promise<boolean> => {
    if (!isTauri()) {
        // Fallback to localStorage
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Failed to store data:', error);
            return false;
        }
    }

    try {
        const tauri = getTauriAPI();
        const { Store } = tauri.store;
        const store = new Store('.settings.dat');
        await store.set(key, value);
        await store.save();
        return true;
    } catch (error) {
        console.error('Failed to store data:', error);
        return false;
    }
};

// Get stored data
export const storeGet = async <T = any>(key: string): Promise<T | null> => {
    if (!isTauri()) {
        // Fallback to localStorage
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Failed to get stored data:', error);
            return null;
        }
    }

    try {
        const tauri = getTauriAPI();
        const { Store } = tauri.store;
        const store = new Store('.settings.dat');
        const value = await store.get(key);
        return value as T;
    } catch (error) {
        console.error('Failed to get stored data:', error);
        return null;
    }
};

// Delete stored data
export const storeDelete = async (key: string): Promise<boolean> => {
    if (!isTauri()) {
        // Fallback to localStorage
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Failed to delete stored data:', error);
            return false;
        }
    }

    try {
        const tauri = getTauriAPI();
        const { Store } = tauri.store;
        const store = new Store('.settings.dat');
        await store.delete(key);
        await store.save();
        return true;
    } catch (error) {
        console.error('Failed to delete stored data:', error);
        return false;
    }
};

// Export evidence package to file
export const exportEvidencePackage = async (
    data: any,
    accountId: string
): Promise<boolean> => {
    const filename = `evidence-${accountId}-${Date.now()}.json`;

    if (!isTauri()) {
        // Fallback to browser download
        try {
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Failed to export evidence:', error);
            return false;
        }
    }

    try {
        const path = await saveFileDialog(filename, [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] },
        ]);

        if (!path) return false;

        return await writeFile(path, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Failed to export evidence:', error);
        return false;
    }
};

// Export CSV data
export const exportCSV = async (
    data: string,
    filename: string
): Promise<boolean> => {
    if (!isTauri()) {
        // Fallback to browser download
        try {
            const blob = new Blob([data], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Failed to export CSV:', error);
            return false;
        }
    }

    try {
        const path = await saveFileDialog(filename, [
            { name: 'CSV Files', extensions: ['csv'] },
            { name: 'All Files', extensions: ['*'] },
        ]);

        if (!path) return false;

        return await writeFile(path, data);
    } catch (error) {
        console.error('Failed to export CSV:', error);
        return false;
    }
};
