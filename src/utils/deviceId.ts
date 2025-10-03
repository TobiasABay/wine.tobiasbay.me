// Device ID utility to prevent duplicate player joins
const DEVICE_ID_KEY = 'wine_tasting_device_id';

export function getDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
        // Generate a new device ID using a combination of timestamp and random number
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
}

export function clearDeviceId(): void {
    localStorage.removeItem(DEVICE_ID_KEY);
}
