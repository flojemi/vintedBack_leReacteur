const validator = require("validator");
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

const User = require("../models/User");
const { encrypt, isValidHash } = require("../utils/encryption");

/* ====================================================== */
/* ========== Création d'un nouvel utilisateur ========== */
/* ====================================================== */

router.post("/user/signup", async (req, res) => {
  const { username, email, password, newsletter } = req.body;

  // Vérification de l'intégrité du username
  if (!username || username.length < 5) {
    return res.status(400).json({
      success: false,
      message: "You must provide a valid username (5 chars at least)",
    });
  }

  // Vérification de l'intégrité de l'email
  const isEmail = validator.isEmail(email);
  if (!isEmail) {
    return res.status(400).json({
      success: false,
      message: "You must provide a valid email",
    });
  }

  // Vérification de l'intégrité du mot de passe
  if (!password || password.length < 10) {
    return res.status(400).json({
      success: false,
      message: "You must provide a valid password (10 chars at least)",
    });
  }

  try {
    // Vérifie que l'utilisateur n'existe pas déjà en BDD
    const alreadyExist = await User.find({ email: email });
    if (alreadyExist[0] !== undefined) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Crypte le password
    const { salt, hash, token } = encrypt(password);

    // Création de l'objet qui représente le nouvel utilisateur
    const newUser = new User({
      email: email,
      account: {
        username: username,
      },
      newsletter: newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });

    // Sauvegarde dans la bdd
    const createdUser = await newUser.save();

    // Réponse faite au client
    res.status(201).json({
      success: true,
      data: {
        _id: createdUser._id,
        token: createdUser.token,
        account: {
          username: createdUser.account.username,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* ====================================================== */
/* ============== Connexion d'un utilisateur ============ */
/* ====================================================== */

router.post("/user/login", async (req, res) => {
  const { email, password } = req.body;

  // Vérification de l'intégrité de l'email
  const isEmail = validator.isEmail(email);
  if (!isEmail) {
    return res.status(400).json({
      success: false,
      message: "You must provide a valid email",
    });
  }

  // Vérification de l'intégrité du mot de passe
  if (!password) {
    return res.status(400).json({
      success: false,
      message: "You must provide a valid password",
    });
  }

  try {
    // Vérifie si l'utilisateur est connu en base de donnée
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Logs doesn't match",
      });
    }

    // // Vérifie l'état du compte pour s'assurer qu'il n'est pas bloqué
    // const fiveMinutesPast = Date.now() - 300000;
    // if (user.lockedTime > fiveMinutesPast) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Account is temporarily locked due to login attempts",
    //   });
    // }

    // Vérification du mot de passe, si les hash ne sont pas en phases
    if (!isValidHash(password, user.salt, user.hash)) {
      // // Nombre de tentative +1
      // user.loginTry += 1;
      // await user.save();

      // // Si 3 tentatives infructueuses
      // if (user.loginTry >= 3) {
      //   // Blocage du compte
      //   user.lockedTime = Date.now();
      //   await user.save();

      //   return res.status(400).json({
      //     success: false,
      //     message:
      //       "Too many login attempts, account is temporarily inaccessible",
      //   });
      // }

      // Mot de passe erroné
      return res.status(400).json({
        success: false,
        message: "Logs doesn't match",
      });
    }

    // Connexion de l'utilisateur réussie (remise à zéro du nombre de tentatives)
    user.loginTry = 0;
    await user.save();

    // Réponse faite au client
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        token: user.token,
        account: {
          username: user.account.username,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* ====================================================== */
/* ============== Get user info using token ============= */
/* ====================================================== */

router.get("/user/:token", async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.find({ token });

    res.status(200).json({
      success: true,
      data: {
        userId: user[0]._id,
        username: user[0].account.username,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
