const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: {
    type: String,
    required: true,
    unique: true,
  },
  account: {
    username: String,
    avatar: Object,
  },
  newsletter: {
    type: Boolean,
    default: false,
  },
  loginTry: {
    type: Number,
    default: 0,
  },
  lockedTime: {
    type: Number,
    default: 0,
  },
  token: String,
  hash: String,
  salt: String,
});

module.exports = User;
