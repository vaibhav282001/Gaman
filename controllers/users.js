const User = require("../models/user.js");

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs", { hideNavbar: true });
};

module.exports.renderLoginForm = (req, res) => {

    if (!req.session.redirectUrl) {
        req.session.redirectUrl =
            req.headers.referer || "/listings";
    }

    res.render("users/login.ejs", { hideNavbar: true });
};

module.exports.signup = async (req, res, next) => {

    try {

        let { username, email, password } = req.body;
        
        if (username) {
            username = username.trim();
        }

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

module.exports.renderProfile = async (req, res) => {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.render("users/profile.ejs", { user });
};