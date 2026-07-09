import express from "express";
import userRoute from "./user.route.js";
import jourFerieRoute from "./jourFerie.route.js";

const router = express.Router();

router.use("/users", userRoute);
router.use("/jours-feries", jourFerieRoute);

export default router;