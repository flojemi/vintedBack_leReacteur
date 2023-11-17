const mongoose = require("mongoose");

const Offer = mongoose.model("Offer", {
  product_name: {
    type: String,
    max: 50,
    required: true,
  },
  product_description: {
    type: String,
    max: 500,
    required: true,
  },
  product_price: {
    type: Number,
    max: 100000,
    required: true,
  },
  product_details: Array,
  product_image: Object,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = Offer;
