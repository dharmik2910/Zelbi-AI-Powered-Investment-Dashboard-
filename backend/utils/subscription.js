const PROMPT_LIMITS = {
    free: 5,
    pro: 100,
    elite: Infinity,
};

const PROMPT_RESET_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;

export const getPromptLimit = (plan) => PROMPT_LIMITS[plan] ?? PROMPT_LIMITS.free;

/**
 * Downgrades expired paid plans and resets the monthly AI prompt count.
 * Saves the user only if something changed.
 * @param {Object} user - A User mongoose document
 * @returns {Promise<Object>} - The same user document
 */
export const refreshSubscriptionState = async (user) => {
    if (!user) return user;

    const now = Date.now();
    let changed = false;

    if (
        user.subscriptionPlan &&
        user.subscriptionPlan !== "free" &&
        user.subscriptionExpiry &&
        new Date(user.subscriptionExpiry).getTime() <= now
    ) {
        user.subscriptionPlan = "free";
        user.subscriptionExpiry = null;
        changed = true;
    }

    const lastReset = user.promptCountResetAt ? new Date(user.promptCountResetAt).getTime() : 0;
    if (now - lastReset >= PROMPT_RESET_INTERVAL_MS) {
        user.aiPromptCount = 0;
        user.promptCountResetAt = new Date(now);
        changed = true;
    }

    if (changed) {
        await user.save();
    }
    return user;
};
