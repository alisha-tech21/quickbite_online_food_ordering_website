const express = require("express");

const router = express.Router();

const {
  getPublicMenuItems,
  getPopularMenuItems,
  getBestSellerMenuItems,
  getMenuCategories,
} = require("../controllers/menuController");

router.get("/categories", getMenuCategories);
router.get("/popular", getPopularMenuItems);
router.get("/best-sellers", getBestSellerMenuItems);

router.get("/", getPublicMenuItems);

module.exports = router;
