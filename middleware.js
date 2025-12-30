const Toilet = require('./models/toilet');
const User = require('./models/user')

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl; // so we can send them back after login
    req.flash('error', 'You must be signed in first');
    return res.redirect('/login');
  }
  next();
};

module.exports.isAdmin = async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user || !user.isAdmin) {
    req.flash('error', 'You do not have admin privileges');
    return res.redirect('/');
  }
  next();
};

module.exports.isAuthor = async (req, res, next) => {
  const { id } = req.params;
  const toilet = await Toilet.findById(id);

  if (!toilet) {
    return res.status(404).json({ error: "Toilet not found" });
  }

  if (!toilet.author || !toilet.author.equals(req.user._id)) {
    return res.status(403).json({ error: "You do not have permission" });
  }

  next();
};

