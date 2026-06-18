if(process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsmate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError.js');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");

const listingRouter = require('./routes/listing.js');
const reviewRouter = require('./routes/review.js');
const userRouter = require('./routes/user.js');
  
// Set EJS as the templating engine and use ejs-mate for layout support
app.engine('ejs', ejsmate);
// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '/public')));

// Configure session middleware
const sessionOptions = {
    secret: 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 1 week
        maxAge: 1000 * 60 * 60 * 24 * 7
    },
};

// Use session and flash middleware
app.use(session(sessionOptions));
app.use(flash());


// Passport.js configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

// Configure Google Strategy
const GoogleStrategy = require("passport-google-oauth20").Strategy;
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || "PLACEHOLDER_CLIENT_ID",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "PLACEHOLDER_CLIENT_SECRET",
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : "";
            let username = profile.displayName.replace(/\s+/g, '').toLowerCase();
            // Ensure username is unique in database
            let userExists = await User.findOne({ username });
            if (userExists) {
                username = username + "_" + Math.floor(Math.random() * 10000);
            }
            user = new User({
                googleId: profile.id,
                username: username,
                email: email || (username + "@gmail.com")
            });
            await user.save();
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return done(null, false);
        }
        const user = await User.findById(id)
            .populate('wishlist')
            .populate('bookings.listing');
        if (!user) {
            return done(null, false);
        }
        done(null, user);
    } catch (err) {
        console.error("Error deserializing user:", err);
        done(null, false);
    }
});



// Middleware to make flash messages available in all views
app.use((req, res, next) => {

    res.locals.success = req.flash("success");

    res.locals.error = req.flash("error");

    res.locals.currentUser = req.user;

    next();

});




app.use('/listings', listingRouter);
app.use('/listings/:id/reviews', reviewRouter);
app.use('/', userRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on  http://localhost:${port}/listings`);
});

// Catch-all route for handling 404 errors - page not found
app.use((req, res, next) => {
    next(new ExpressError("Page Not Found", 404));
});


//flash messages and error handling
app.use((err, req, res, next) => {
    // Default values
    let statusCode = err.statusCode || 500;
    let message = err.message || "Something went wrong";

    // 🔥 Handle specific errors
    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid ID or data format";
    }

    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors).map(e => e.message).join(", ");
    }

    // Attach back to err (for EJS)
    err.statusCode = statusCode;
    err.message = message;

    res.locals.success = [];
    res.locals.error = [];
    res.locals.currentUser = req.user || null;

    res.status(statusCode).render("error.ejs", { err });
});


// Call the main function to connect to MongoDB
main().then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB:', err);
});

// Connect to MongoDB
async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
}
