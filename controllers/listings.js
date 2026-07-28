const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const ExpressError = require("../utils/ExpressError.js");


module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index", { allListings });
};

module.exports.renderNewForm = async (req, res) => {
    res.render("listings/new");
};

module.exports.showListing = async (req, res) => {
        const { id } = req.params;
    
        const listing = await Listing.findById(id)
        .populate(
            {path:"reviews", 
                populate: {
                    path: "author"
                },
            }
        )
        .populate("owner");
    
        if (!listing) {
            throw new ExpressError(404, "Listing not found");
        }
    
        console.log(listing.geometry);
        res.render("listings/show", {
            listing,
            mapToken
        });
    };

module.exports.createListing = async (req, res) => {

    const response = await geocodingClient
        .forwardGeocode({
            query: req.body.listing.location,
            limit: 1
        })
        .send();

    // Check if location found
    if (!response.body.features.length) {
        req.flash("error", "Invalid location entered");
        return res.redirect("/listings/new");
    }

    const newListing = new Listing(req.body.listing);

    newListing.owner = req.user._id;

    if (req.files && req.files.length > 0) {
        newListing.image = {
            url: req.files[0].path,
            filename: req.files[0].filename
        };
        newListing.images = req.files.map(f => ({
            url: f.path,
            filename: f.filename
        }));
    }

    newListing.geometry = response.body.features[0].geometry;

    const savedListing = await newListing.save();

    console.log(savedListing);

    req.flash("success", "Listing created successfully!");
    res.redirect("/listings");
};


module.exports.renderEditForm = async (req, res) => {
        const { id } = req.params;
    
        const listing = await Listing.findById(id);
    
        if (!listing) {
            throw new ExpressError(404, "Listing not found");
        }
    
        if (listing.owner.toString() !== req.user._id.toString()) {
            req.flash("error", "You are not the owner of this listing");
            return res.redirect(`/listings/${id}`);
        }

        let originalImageUrl=listing.image.url;
        originalImageUrl =originalImageUrl.replace("/upload", "/upload/w_250/"); // Resize image for display in edit form
        res.render("listings/edit", { listing, originalImageUrl });
    };

module.exports.updateListing = async (req, res) => {

    const { id } = req.params;

    const updatedListing = await Listing.findByIdAndUpdate(
        id,
        req.body.listing,
        {
            runValidators: true,
            returnDocument: "after"
        }
    );

    if (!updatedListing) {
        throw new ExpressError(404, "Listing not found");
    }

    // Re-geocode updated location
    if (req.body.listing.location) {

        const response = await geocodingClient
            .forwardGeocode({
                query: req.body.listing.location,
                limit: 1
            })
            .send();

        if (response.body.features.length) {
            updatedListing.geometry =
                response.body.features[0].geometry;
        }
    }

    if (req.files && req.files.length > 0) {
        updatedListing.image = {
            url: req.files[0].path,
            filename: req.files[0].filename
        };
        updatedListing.images = req.files.map(f => ({
            url: f.path,
            filename: f.filename
        }));
    }

    await updatedListing.save();

    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;

    const deletedListing = await Listing.findByIdAndDelete(id);

    if (!deletedListing) {
        throw new ExpressError(404, "Listing not found");
    }

    req.flash("success", "Listing deleted successfully!");
    res.redirect("/listings");
};

module.exports.toggleFavorite = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    
    // Clean up any null (deleted) listings from the wishlist
    user.wishlist = user.wishlist.filter(item => item !== null);
    
    const index = user.wishlist.findIndex(item => {
        if (!item) return false;
        const itemId = item._id ? item._id.toString() : item.toString();
        return itemId === id.toString();
    });
    
    let action = "";
    if (index > -1) {
        user.wishlist.splice(index, 1);
        action = "removed";
    } else {
        user.wishlist.push(id);
        action = "added";
    }
    await user.save();
    res.json({ success: true, action, wishlist: user.wishlist });
};

module.exports.reserveStay = async (req, res) => {
    const { id } = req.params;
    const { checkIn, checkOut, guests, totalPrice } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    
    user.bookings.push({
        listing: id,
        checkIn: checkIn || new Date(),
        checkOut: checkOut || new Date(),
        guests: guests || 1,
        totalPrice: totalPrice || 0
    });
    
    await user.save();
    res.json({ success: true, message: "Listing booked successfully!" });
};
