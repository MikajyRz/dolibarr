import express from "express";
import userRoute from "./user.route.js";

const router = express.Router();

router.use("/users", userRoute);

export default router;