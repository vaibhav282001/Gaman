const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync.js');
const ExpressError = require('../utils/ExpressError.js');
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require('../middleware.js');
const listingController = require("../controllers/listings.js");

const multer  = require('multer')
const { storage } = require('../cloudConfig.js');

const upload = multer({ storage: storage });
//below is the code for multer with local storage, we will replace it with cloudinary storage
//const upload = multer({ dest: 'uploads/' })

router
    .route("/")
    // 📌 GET ALL LISTINGS
    .get(wrapAsync(listingController.index))
    // 📌 CREATE LISTING
    .post(isLoggedIn,upload.single('listing[image]'), validateListing , wrapAsync(listingController.createListing));

// 📌 NEW LISTING FORM
router.get("/new", isLoggedIn, listingController.renderNewForm);

router
    .route("/:id")
    // 📌 SHOW SINGLE LISTING
    .get(wrapAsync(listingController.showListing))
    // 📌 UPDATE LISTING
    .put(isLoggedIn, isOwner,upload.single('listing[image]'), validateListing, wrapAsync(listingController.updateListing))
    // 📌 DELETE LISTING
    .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

// 📌 EDIT FORM
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

// 📌 FAVORITE TOGGLE
router.post("/:id/favorite", isLoggedIn, wrapAsync(listingController.toggleFavorite));

// 📌 RESERVE STAY
router.post("/:id/reserve", isLoggedIn, wrapAsync(listingController.reserveStay));

module.exports = router;