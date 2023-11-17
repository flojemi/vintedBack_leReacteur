const mongoose = require("mongoose");
const express = require("express");

const Offer = require("../models/Offer");
const isAuthenticated = require("../utils/middleware");
const fileUpload = require("express-fileupload");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();

/* Route qui permet de filtrer sur l'ensemble des annonces */
router.get("/offers", async (req, res) => {
  try {
    // ===================================== \\
    // ======== 0) Get query Data ========== \\
    // ===================================== \\
    // Récupère la query String pour l'analyser
    const queryObj = { ...req.query };
    // Définition des termes utilisés pour la mise en forme du résultat
    const excludedFields = ["page", "sort", "limit", "fields"];
    // Suppression des mises en forme de queryObj pour ne conserver que les critères
    excludedFields.forEach((el) => delete queryObj[el]);

    // ===================================== \\
    // ====== 1) Criteria filtering ======== \\
    // ===================================== \\
    // Stringify pour pouvoir ajouter le dollar devant les opérateurs mongoose
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    // Monte la requête en transformant la string en objet (sans l'exécuter pour pouvoir chaîner les méthodes)
    let query = Offer.find(JSON.parse(queryStr));

    // ===================================== \\
    // ============= 2) Sorting ============ \\
    // ===================================== \\
    // Appliqué uniquement s'il y a un sort dans la query string (séparés d'une virgule dans la query et doivent être un espace dans la méthode mongoose)
    if (req.query.sort) {
      query = query.sort(req.query.sort.replace(",", " "));
    } else {
      // Tri par défaut par ordre croissant
      query = query.sort("product_price");
    }

    // ===================================== \\
    // ======== 4) Field limiting ========== \\
    // ===================================== \\
    // Sur le même principe que le point précédent, remplace la virgule par un espace pour la méthode
    if (req.query.fields) {
      query = query.select(req.query.fields.replace(",", " "));
    } else {
      // Retire par défaut la valeur __v
      query = query.select("-__v");
    }

    // ===================================== \\
    // ============ 5) Paginate ============ \\
    // ===================================== \\
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    // Si une page spécifique est demandée
    if (req.query.page) {
      // Vérifie qu'il y a assez de résultats à afficher
      const offersNumber = await Offer.countDocuments();
      console.log(skip, offersNumber);
      if (skip >= offersNumber) throw new Error("This page does not exist");
    }

    // Monte la requête dans tous les cas (soit avec les valeurs par défaut, soit avec celles présentes dans page)
    query = query.skip(skip).limit(limit);

    // ===================================== \\
    // ========= 6) Execute query ========== \\
    // ===================================== \\
    const result = await query;

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* Route qui permet de poste une offre */
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    // Récupération des éléments transmis avec la requête
    const infos = req.body;
    const files = req.files.picture;

    // TODO : Attention lorsqu'une seule image envoyée, ce n'est pas un array et files.map pose un problème = à corriger

    try {
      // Transformation des buffer et constructions des promesses
      const uploadPromises = files.map((file) => {
        const base64buffer = `data:${file.mimetype};base64,${file.data.toString(
          "base64"
        )}`;
        return cloudinary.uploader.upload(base64buffer, {
          folder: `/vinted/${req.user._id}`,
        });
      });

      // Exécution des promesses vers cloudinary
      const results = await Promise.all(uploadPromises);

      // Récupère les secure URL
      const secureUrlArray = results.map((result) => {
        return result.secure_url;
      });

      // Monte l'objet qui va être envoyé dans MongoDB
      const newOffer = new Offer({
        product_name: infos.title,
        product_description: infos.description,
        product_price: infos.price,
        product_details: [
          { MARQUE: infos.brand },
          { TAILLE: infos.size },
          { ETAT: infos.condition },
          { COULEUR: infos.color },
          { EMPLACEMENT: infos.city },
        ],
        owner: req.user._id,
        product_image: secureUrlArray,
      });

      // Sauvegarde les données sur MongoDB
      const data = await (
        await newOffer.save()
      ).populate({ path: "owner", select: "account" });

      // Retourne la réponse
      res.status(201).json({
        success: true,
        data: data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/* Route qui permet de récupérer une offre en fonction de son ID */
router.get("/offer/:id", async (req, res) => {
  try {
    const requiredOffer = await Offer.findById(req.params.id);

    res.status(200).json({
      success: true,
      data: requiredOffer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
