const stripe = require("stripe")(process.env.STRIPE_API_SECRET);

const express = require("express");
const router = express.Router();

const Offer = require("../models/Offer");
const User = require("../models/User");

/* ============================================ */
/* ======= Permet de vérifier un paiement ===== */
/* ============================================ */

router.post("/pay", async (req, res) => {
  const { stripeToken, userToken, offerData } = req.body;

  try {
    // Compare les données de l'offre transmise à celle présente en bdd
    const confirmOfferData = await Offer.findOne({ _id: offerData._id });

    // Si le prix correspond, on passe à la suite
    if (confirmOfferData.product_price !== offerData.product_price) {
      // Si un tel cas devait arriver, bannir l'utilisateur pour tentative de vol
      return res.status(400).json({
        success: false,
        message: "Purchase can't be done",
      });
    }

    const offerPrice = (confirmOfferData.product_price + 0.4 + 0.8)
      .toFixed(2)
      .replace(".", "");

    const stripeResponse = await stripe.charges.create({
      amount: offerPrice,
      currency: "eur",
      description: confirmOfferData.product_name,
      source: stripeToken,
    });

    // Si stripe valide le paiement
    if (stripeResponse.status === "succeeded") {
      // Récupère les informations de l'utilisateur
      const userData = await User.findOne({ token: userToken });

      //update au statut vendu et indique à qui l'article est vendu
      await Offer.updateOne(
        { _id: offerData._id },
        {
          sold: true,
          soldTo: userData._id,
        }
      );
    }

    res.status(200).json({
      success: true,
      data: stripeResponse,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

module.exports = router;
