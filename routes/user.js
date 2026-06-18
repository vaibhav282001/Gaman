const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users.js");

router
    .route("/signup")
    .get(userController.renderSignupForm)
    .post(wrapAsync(userController.signup));

router
    .route("/login")
    .get(userController.renderLoginForm)
    .post(
        saveRedirectUrl,
        passport.authenticate("local", {
            failureRedirect: "/login",
            failureFlash: true,
        }),
        userController.login
    );

// Google OAuth Routes
router.get("/auth/google", saveRedirectUrl, passport.authenticate("google", {
    scope: ["profile", "email"]
}));

router.get("/auth/google/callback",
    saveRedirectUrl,
    passport.authenticate("google", {
        failureRedirect: "/login",
        failureFlash: true,
    }),
    userController.googleLoginCallback
);

router.get("/logout", userController.logout);

module.exports = router;
