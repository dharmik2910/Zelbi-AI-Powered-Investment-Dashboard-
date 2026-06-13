import express from 'express';
import { generateResult } from '../services/ai.service.js';
import * as aiController from '../controllers/Ai.js';

const router = express.Router();

router.post('/analyze', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }
        const result = await generateResult(prompt);
        return res.status(200).json({ result });
    } catch (error) {
        console.error('Error in AI analysis:', error);
        res.status(500).json({ error: 'Failed to analyze stock' });
    }
});

router.post('/get-result', aiController.getResult);

export default router;