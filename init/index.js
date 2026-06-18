
// const mongoose = require('mongoose');
// const initData = require('./data.js');
// const Listing = require('../Models/listing.js');

// async function main() {
//     await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
// }

// main()
//     .then(() => console.log('Connected to MongoDB'))
//     .catch((err) => console.log(err));

// const initDB = async () => {
//     // Delete old listings
//     await Listing.deleteMany({});

//     // Add owner to every listing
//     const newData = initData.data.map((obj) => ({
//         ...obj,
//         owner: new mongoose.Types.ObjectId("69ec61d0d164fefe4021aa69")
//     }));

//     // Insert new listings
//     await Listing.insertMany(newData);

//     console.log("Database initialized");
// };

// initDB();




const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
require("dotenv").config({ path: "../.env" });

const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});

  for (let obj of initData.data) {
    let response = await geocodingClient
      .forwardGeocode({
        query: obj.location,
        limit: 1,
      })
      .send();

    obj.geometry = response.body.features[0].geometry;
  }

  await Listing.insertMany(initData.data);
  console.log("Database initialized");
};

initDB();