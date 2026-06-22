import express from 'express';
import * as aiController from '../controllers/Ai.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/analyze', auth, aiController.analyzeStock);
router.post('/get-result', auth, aiController.getResult);

export default router;