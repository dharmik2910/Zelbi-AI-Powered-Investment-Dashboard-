import * as ai from '../services/ai.service.js'
import User from '../models/User.js';
import { getPromptLimit, refreshSubscriptionState } from '../utils/subscription.js';

const MAX_PROMPT_CHARS = 8000;

const handleAiRequest = (mode) => async (req, res) => {
    try {
        const { prompt, history } = req.body;
        if (!prompt || typeof prompt !== "string") {
            return res.status(400).json({ error: "Prompt is required" });
        }
        if (prompt.length > MAX_PROMPT_CHARS) {
            return res.status(400).json({ error: "Prompt is too long" });
        }

        const user = await refreshSubscriptionState(await User.findById(req.user.id));
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const plan = user.subscriptionPlan || "free";
        const limit = getPromptLimit(plan);

        // Reserve a prompt atomically so parallel requests can't exceed the limit
        const quotaFilter = limit === Infinity
            ? { _id: user._id }
            : { _id: user._id, aiPromptCount: { $lt: limit } };
        const reserved = await User.findOneAndUpdate(
            quotaFilter,
            { $inc: { aiPromptCount: 1 } },
            { new: true }
        );

        if (!reserved) {
            return res.status(429).json({
                error: `Prompt limit reached. You have used all ${limit} prompts on the ${plan} plan. Please upgrade to continue.`,
                plan,
                limit,
                promptCount: user.aiPromptCount || 0,
            });
        }

        let result;
        try {
            result = await ai.generateResult({
                prompt,
                history: Array.isArray(history) ? history : [],
                mode,
            });
        } catch (err) {
            // Give the prompt back if the AI call failed
            await User.updateOne({ _id: user._id }, { $inc: { aiPromptCount: -1 } });
            throw err;
        }

        return res.status(200).json({
            result,
            aiPromptCount: reserved.aiPromptCount,
            plan,
            promptLimit: limit === Infinity ? -1 : limit,
        });
    } catch (err) {
        console.error(`Error in AI ${mode} request:`, err);
        return res.status(500).json({ error: "The AI service is unavailable. Please try again shortly." });
    }
}

export const getResult = handleAiRequest("chat");
export const analyzeStock = handleAiRequest("analysis");
