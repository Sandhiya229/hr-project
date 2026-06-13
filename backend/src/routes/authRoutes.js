import { Router } from 'express';
import { 
  loginUser, 
  logoutUser, 
  getCurrentUser,
  forgotPassword,
  resetPassword,
  googleAuthCallback,
  checkAdminSetup,
  setupAdmin
} from '../controllers/authController.js';
import { verifyJWT } from '../middlewares/authMiddleware.js';

const router = Router();

router.route('/login').post(loginUser);
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password').post(resetPassword);
router.route('/google-callback').post(googleAuthCallback);
router.route('/google').post(googleAuthCallback); // Alias for easier frontend integration
router.route('/check-admin-setup').get(checkAdminSetup);
router.route('/setup-admin').post(setupAdmin);

// Secured routes
router.route('/logout').post(verifyJWT, logoutUser);
router.route('/me').get(verifyJWT, getCurrentUser);

export default router;
