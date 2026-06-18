const Listings = require('../models/listing.js');
const Review = require('../models/review.js');

module.exports.createReview = async (req, res) => {
    let { id } = req.params;
    let listing = await Listings.findById(id);
    let newReview  = new Review(req.body.review);
    newReview.author = req.user._id;
    listing.reviews.push(newReview );
    await newReview.save();
    await listing.save();
    // res.send("Review added successfully");
    console.log("Review added successfully");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyReview = async (req, res) => {
    let {id, reviewId } = req.params;

    await Listings.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);

    res.redirect(`/listings/${id}`);
};