/**
 * Check if an interview can be started based on scheduled time
 * Only allows starting AT or AFTER the scheduled time
 */
export function canStartInterview(scheduledTime: Date | null): boolean {
    if (!scheduledTime) {
        // If no scheduled time, allow starting anytime
        return true;
    }

    const now = new Date();
    // Only allow starting if current time >= scheduled time
    return now >= scheduledTime;
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

    if (diff <= 0) {
        return "Available now";
    }

    const minutesDiff = Math.floor(diff / (1000 * 60));
    const hoursDiff = Math.floor(minutesDiff / 60);
    const daysDiff = Math.floor(hoursDiff / 24);

    if (minutesDiff < 60) {
        return `Starts in ${minutesDiff} minute${minutesDiff !== 1 ? 's' : ''}`;
    } else if (hoursDiff < 24) {
        const remainingMins = minutesDiff % 60;
        return `Starts in ${hoursDiff}h ${remainingMins}m`;
    } else {
        const remainingHours = hoursDiff % 24;
        return `Starts in ${daysDiff}d ${remainingHours}h`;
    }
}
