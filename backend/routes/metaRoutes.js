import express from 'express';
import { auth } from '../middleware/auth.js';
import * as metaController from '../controllers/metaController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Note: Meta routes don't need privilege checking as they only provide metadata
router.get('/privileges', metaController.getPrivilegeModules);

export default router; 