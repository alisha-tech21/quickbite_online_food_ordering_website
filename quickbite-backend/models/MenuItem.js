const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    name: { type: String, required: true, trim: true },
    description: String,
    category: { type: String, required: true },
    price: { type: Number, required: true },

    imageUrl: String,
    imagePublicId: String,

    tags: [String],

    isAvailable: { type: Boolean, default: true },

    options: [
      {
        name: String,
        choices: [String],
      },
    ],
  },
  { timestamps: true },
);

menuItemSchema.index({ restaurant: 1, category: 1 });

module.exports = mongoose.model("MenuItem", menuItemSchema);
