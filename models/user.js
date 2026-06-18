const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    googleId: {
        type: String,
    },
    wishlist: [{
        type: Schema.Types.ObjectId,
        ref: 'Listing'
    }],
    bookings: [{
        listing: {
            type: Schema.Types.ObjectId,
            ref: 'Listing'
        },
        checkIn: {
            type: Date,
            default: Date.now
        },
        checkOut: {
            type: Date,
            default: Date.now
        },
        guests: {
            type: Number,
            default: 1
        },
        totalPrice: Number
    }]
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);