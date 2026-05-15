import { Router } from "express";
import { getMyProfile, updateMyProfile } from "../controllers/profileController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { uploadCV } from "../middlewares/uploadMiddleware.js";

const router = Router();

// Protect all user routes with auth middleware
router.use(requireAuth);

router.get("/", getMyProfile);
router.put("/", uploadCV.single("cv"), updateMyProfile);

export default router;
