import express from "express";
import jourFerieRoute from "./jourFerie.route.js";
import resetSqliteRoute from "./resetSqlite.route.js";

const router = express.Router();

router.use("/jours-feries", jourFerieRoute);
router.use("/reset-sqlite", resetSqliteRoute);

export default router;
