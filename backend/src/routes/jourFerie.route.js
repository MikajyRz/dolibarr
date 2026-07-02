import express from "express";
import {
  getAllJoursFeries,
  getJourFerieById,
  createJourFerie,
  updateJourFerie,
  deleteJourFerie,
} from "../services/jourFerie.service.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const joursFeries = await getAllJoursFeries();
    res.json(joursFeries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const jourFerie = await getJourFerieById(req.params.id);

    if (!jourFerie) {
      return res.status(404).json({ error: "Jour férié introuvable" });
    }

    res.json(jourFerie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { nom, date } = req.body;

    if (!nom || !date) {
      return res.status(400).json({
        error: "Le nom et la date sont obligatoires",
      });
    }

    const jourFerie = await createJourFerie({ nom, date });

    res.status(201).json(jourFerie);
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(409).json({
        error: "Un jour férié existe déjà pour cette date",
      });
    }

    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { nom, date } = req.body;

    if (!nom || !date) {
      return res.status(400).json({
        error: "Le nom et la date sont obligatoires",
      });
    }

    const result = await updateJourFerie(req.params.id, { nom, date });

    if (result.changes === 0) {
      return res.status(404).json({ error: "Jour férié introuvable" });
    }

    res.json({
      id: result.id,
      nom: result.nom,
      date: result.date,
    });
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(409).json({
        error: "Un jour férié existe déjà pour cette date",
      });
    }

    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await deleteJourFerie(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Jour férié introuvable" });
    }

    res.json({
      message: "Jour férié supprimé avec succès",
      id: result.id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;