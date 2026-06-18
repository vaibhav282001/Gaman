const User = require("../models/user.js");

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.renderLoginForm = (req, res) => {

    if (!req.session.redirectUrl) {
        req.session.redirectUrl =
            req.headers.referer || "/listings";
    }

    res.render("users/login.ejs");
};

module.exports.signup = async (req, res, next) => {

    try {

        let { username, email, password } = req.body;

        const newUser = new User({
            email,
            username
        });

        const registeredUser =
            await User.register(newUser, password);

        req.login(registeredUser, (err) => {

            if (err) {
                return next(err);
            }

            req.flash(
                "success",
                "Welcome to Gaman!"
            );

            res.redirect("/listings");

        });

    }

    catch (err) {

        req.flash("error", err.message);

        res.redirect("/signup");

    }

};

module.exports.login = async (req, res) => {

    let redirectUrl =
        res.locals.redirectUrl || "/listings";

    delete req.session.redirectUrl;

    req.flash("success", "Welcome back!");

    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {

    req.logout((err) => {

        if (err) {
            return next(err);
        }

        req.flash(
            "success",
            "Logged out successfully!"
        );

        res.redirect("/listings");

    });

};

module.exports.googleLoginCallback = (req, res) => {
    let redirectUrl = res.locals.redirectUrl || "/listings";
    delete req.session.redirectUrl;
    req.flash("success", "Welcome back! Logged in with Google.");
    res.redirect(redirectUrl);
};