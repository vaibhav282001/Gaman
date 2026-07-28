const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");
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
        async (req, res, next) => {
            console.log("LOGIN ATTEMPT:", req.body);
            if (req.body && req.body.username) {
                let inputUsername = req.body.username.trim();
                
                // Allow login by email OR username case-insensitively
                const User = require("../models/user.js");
                const isEmail = inputUsername.includes('@');
                
                let query = {};
                if (isEmail) {
                    query = { email: new RegExp('^' + inputUsername + '$', 'i') };
                } else {
                    query = { username: new RegExp('^' + inputUsername + '$', 'i') };
                }

                const existingUser = await User.findOne(query);
                if (existingUser) {
                    req.body.username = existingUser.username; // passport-local expects the exact DB username
                } else {
                    req.body.username = inputUsername; // fallback
                }
            }
            next();
        },
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

router.get("/profile", isLoggedIn, wrapAsync(userController.renderProfile));

module.exports = router;
