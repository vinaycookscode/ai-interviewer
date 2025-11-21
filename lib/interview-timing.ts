/**
 * Check if an interview can be started based on scheduled time
 * Allows starting 15 minutes before and after scheduled time
 */
export function canStartInterview(scheduledTime: Date | null): boolean {
    if (!scheduledTime) {
        // If no scheduled time, allow starting anytime
        return true;
    }

    const now = new Date();
    const diff = scheduledTime.getTime() - now.getTime();
    const minutesDiff = diff / (1000 * 60);

    // Allow starting 15 minutes before and after scheduled time
    return minutesDiff >= -15 && minutesDiff <= 15;
}

/**
 * Get human-readable time until interview
 */
export function getTimeUntilInterview(scheduledTime: Date | null): string {
    if (!scheduledTime) {
        return "Available now";
    }

    const now = new Date();
    const diff = scheduledTime.getTime() - now.getTime();
    const minutesDiff = Math.floor(diff / (1000 * 60));
    const hoursDiff = Math.floor(minutesDiff / 60);
    const daysDiff = Math.floor(hoursDiff / 24);

    if (minutesDiff < -15) {
        return "Window closed";
    } else if (minutesDiff >= -15 && minutesDiff <= 15) {
        return "Available now";
    } else if (minutesDiff < 60) {
        return `Starts in ${minutesDiff} minutes`;
    } else if (hoursDiff < 24) {
        return `Starts in ${hoursDiff} hour${hoursDiff > 1 ? 's' : ''}`;
    } else {
        return `Starts in ${daysDiff} day${daysDiff > 1 ? 's' : ''}`;
    }
}
