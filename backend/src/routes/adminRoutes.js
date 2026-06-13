import { Router } from 'express';
import { verifyJWT, verifyAdmin } from '../middlewares/authMiddleware.js';
import {
  createEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee,
  createProject,
  getProjects,
  updateProject,
  deleteProject,
  assignProject,
  getDashboardStats
} from '../controllers/adminController.js';

const router = Router();

// Secure all admin routes
router.use(verifyJWT, verifyAdmin);

// Stats
router.route('/stats').get(getDashboardStats);

// Employee Management
router.route('/employees')
  .post(createEmployee)
  .get(getEmployees);

router.route('/employees/:id')
  .put(updateEmployee)
  .delete(deleteEmployee);

// Project Management
router.route('/projects')
  .post(createProject)
  .get(getProjects);

router.route('/projects/:id')
  .put(updateProject)
  .delete(deleteProject);

router.route('/projects/:id/assign')
  .post(assignProject);

export default router;
