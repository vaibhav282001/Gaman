
const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require('./utils/ExpressError.js');
const { listingSchema, reviewSchema } = require('./schema.js');
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;  // 🔥 important
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.status(401).json({ success: false, error: "Please log in to proceed." });
        }
        return res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;

    let listing = await Listing.findById(id);

    if (!listing.owner.equals(res.locals.currentUser._id)) {
        req.flash("error", "You are not the owner of this listing");
        return res.redirect(`/listings/${id}`);
    }

    next();
};


// 🔍 VALIDATION MIDDLEWARE
module.exports.validateListing = (req, res, next) => {
    if (!req.body.listing) {
        throw new ExpressError(400, "Listing data is missing");
    }

    let { error } = listingSchema.validate(req.body);
    if (error) {
        let msg = error.details.map(el => el.message).join(", ");
        throw new ExpressError(400, msg);
    } else {
        next();
    }
};


module.exports.validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let msg =error.details.map(el => el.message).join(", ");
        throw new ExpressError(400, msg);
        console.log(msg);
    }
    else {
        next();
    }   
};




module.exports.isReviewAuthor = async (req, res, next) => {
    let {id, reviewId } = req.params;

    let review = await Review.findById(reviewId);

    if (!review.author.equals(res.locals.currentUser._id)) {
        req.flash("error", "You are not the author of this review");
        return res.redirect(`/listings/${id}`);
    }

    next();
};