import express from "express";
import {
  getSqliteResetPreview,
  resetSqliteTables,
} from "../services/resetSqlite.service.js";

const router = express.Router();

router.get("/preview", async (req, res) => {
  try {
    const preview = await getSqliteResetPreview();
    res.json(preview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/", async (req, res) => {
  try {
    const result = await resetSqliteTables();

    res.json({
      message: "Tables SQLite réinitialisées avec succès.",
      ...result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;