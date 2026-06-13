import { Router } from 'express';
import { verifyJWT } from '../middlewares/authMiddleware.js';
import { getMyProjects, updateProjectProgress } from '../controllers/employeeController.js';
import { uploadFile } from '../middlewares/uploadMiddleware.js';

const router = Router();

// Secure all employee routes
router.use(verifyJWT);

router.route('/projects')
  .get(getMyProjects);

router.route('/projects/:id/progress')
  .post(uploadFile.single('attachment'), updateProjectProgress);

export default router;
