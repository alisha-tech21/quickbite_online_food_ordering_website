const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },

    seq: {
      type: Number,
      default: 82000,
    },
  },
  {
    timestamps: false,
  },
);

module.exports = mongoose.model("Counter", counterSchema);
