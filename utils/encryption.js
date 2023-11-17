const sha256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

const encrypt = function (password) {
  // Création + Ajout du Salt
  const salt = uid2(32);
  const saltedPassword = password + salt;

  // Création du hash
  const hash = sha256(saltedPassword).toString(encBase64);

  // Génération du token
  const token = uid2(32);

  // Retourne les données
  return { salt: salt, hash: hash, token: token };
};

const isValidHash = function (password, salt, knownHash) {
  // Combinaison password et salt
  const saltedPassword = password + salt;

  // Génération du hash
  const hash = sha256(saltedPassword).toString(encBase64);

  // Comparaison du hash fourni et de celui calculé
  return hash === knownHash ? true : false;
};

module.exports.encrypt = encrypt;
module.exports.isValidHash = isValidHash;
