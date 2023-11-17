const dotenv = require("dotenv");
dotenv.config();

// Import des packages
// const cors = require("cors");
const mongoose = require("mongoose");
const express = require("express");

const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");

// Connection à la base de donnée
mongoose
  .connect(process.env.ATLAS_URI)
  .then(() => {
    console.log("🟢 Database successfully connected");
  })
  .catch((error) => {
    console.log("🔴", error.message);
  });

// Création du serveur
const app = express();
// app.use(cors());
app.use(express.json());

// Gestion des routes
app.use(userRoutes);
app.use(offerRoutes);

app.all("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "This page does not exist",
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🟢 Listening on port ${PORT}`);
});
