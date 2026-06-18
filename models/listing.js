const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const listingSchema = new Schema({

    title: {
        type: String,
        required: true
    },

    description: String,

    image: {
    url: String,
    filename: String,
    },

    price: Number,

    location: String,

    country: String,

    reviews: [{
        type: Schema.Types.ObjectId,
        ref: 'Review'
    }],

    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    // For future use, if we want to categorize listings
    // category: {
    //     type: String,
    //     enum: ['Trending', 'Rooms', 'Iconic Cities', 'Castles', 'Amazing Pools', 'Camping', 'Farm', 'Arctic', 'Design', 'Tropical', 'Mansions', 'Treehouses', 'Beachfront'],
    //     required: true
    // },

});

listingSchema.post("findOneAndDelete", async (listing) => {

    if (listing) {

        const Review = mongoose.model("Review");

        await Review.deleteMany({
            _id: { $in: listing.reviews }
        });

    }

});

module.exports =
    mongoose.models.Listing ||
    mongoose.model('Listing', listingSchema);