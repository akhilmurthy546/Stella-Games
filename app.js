const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const methodOverride = require("method-override");
const flash = require("connect-flash");

mongoose.connect("mongodb://localhost:27017/video_game_service", {
	useNewUrlParser: true,
	useUnifiedTopology: true
})
.then(() => console.log("Connected to DB"))
.catch(error => console.log(error.message));

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
// seedDB();

// PASSPORT CONFIGURATION
app.use(require("express-session")({
	secret: "Akhil",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

// Landing Page
app.get("/", (req, res) => {
	res.render("landing");
});

// Register Route
app.post("/register", (req, res) => {
	User.register(new User({username: req.body.user.username, subscribed: false}), req.body.user.password)
	.then(user => {
		console.log("registered");
		req.login(user, (err) => {
    		if (err) {
				req.flash("error", err);
				return next(err);
			}
  		});
		console.log("authenticated");
			req.flash("success", "Welcome " + req.body.user.username + "!");
			res.redirect("/");
	})
	.catch(error => {
		console.log(error.message);
		req.flash("error", error.message);
		return res.redirect("/");
	});
});

// Login Route
app.post("/login", passport.authenticate("local", {
	successRedirect: "/",
	failureRedirect: "/",
	failureFlash: true,
	successFlash: 'Welcome!'
}), (req, res) => {});

// Edit Route
app.post("/edit", (req, res) => {
	var user = req.user;
	user.username = req.body.username;
	if (req.body.subscribed) user.subscribed = true;
	if (req.body.unsubscribed) user.subscribed = false;
	user.save()
	.then(user => {
		req.login(user, (err) => {
    		if (err) {
				req.flash("error", err);
				return next(err);
			}

    		console.log("After relogin: ");
    		console.info(req.user);
  		});
		
		req.flash("success", "Changed " + user.username + "'s account details");
		res.redirect("/");
	})
	.catch(error => {
		console.log(error.message);
		req.flash("error", error.message);
		res.redirect("/");
	});
});

// Forgot Password Route
app.post("/forgotPassword", (req, res) => {
	if (req.body.password1 !== req.body.password2) {
		req.flash("error", "Passwords do not match. Try again!");
		return res.redirect("/");
	}
	User.findByUsername(req.user.username)
	.then(user => {
		user.setPassword(req.body.password1)
		.then(() => {
			user.save();
			req.flash("success", "Password changed");
			res.redirect("/");
		})
		.catch(error => {
			req.flash("error", error.message);
			res.redirect("/");
		});
	})
	.catch(error => {
		console.log(error.message);
		res.redirect("/");
	})
});

// Logout Route
app.get("/logout", (req, res) => {
	req.logout();
	req.flash("success", "Logged out!");
	res.redirect("/");
});

app.listen("3000", () => console.log("Listening on port 3000"));