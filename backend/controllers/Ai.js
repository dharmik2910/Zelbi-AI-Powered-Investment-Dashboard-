import * as ai from '../services/ai.service.js'
import User from '../models/User.js';

const PROMPT_LIMITS = {
    free: 5,
    pro: 100,
    elite: Infinity,
};

const getPromptLimit = (plan) => PROMPT_LIMITS[plan] ?? PROMPT_LIMITS.free;

export const getResult = async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const plan = user.subscriptionPlan || "free";
        const limit = getPromptLimit(plan);
        const currentCount = user.aiPromptCount || 0;

        if (limit !== Infinity && currentCount >= limit) {
            return res.status(429).json({
                error: `Prompt limit reached. You have used all ${limit} prompts on the ${plan} plan. Please upgrade to continue.`,
                plan,
                limit,
                promptCount: currentCount,
            });
        }

        const result = await ai.generateResult(prompt);

        user.aiPromptCount = currentCount + 1;
        await user.save();

        return res.status(200).json({
            result,
            aiPromptCount: user.aiPromptCount,
            plan,
            promptLimit: limit === Infinity ? -1 : limit,
        });
    } catch (err) {
        console.error("Error in getResult:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const analyzeStock = async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const plan = user.subscriptionPlan || "free";
        const limit = getPromptLimit(plan);
        const currentCount = user.aiPromptCount || 0;

        if (limit !== Infinity && currentCount >= limit) {
            return res.status(429).json({
                error: `Prompt limit reached. You have used all ${limit} prompts on the ${plan} plan. Please upgrade to continue.`,
                plan,
                limit,
                promptCount: currentCount,
            });
        }

        const result = await ai.generateResult(prompt);

        user.aiPromptCount = currentCount + 1;
        await user.save();

        return res.status(200).json({
            result,
            aiPromptCount: user.aiPromptCount,
            plan,
            promptLimit: limit === Infinity ? -1 : limit,
        });
    } catch (err) {
        console.error("Error in analyzeStock:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}