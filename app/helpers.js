'use strict';

exports.authMiddleware = (req, res, next) => {
  if (req.session.hat && req.session.hat.authenticated === true) {
    return next();
  } else {
    return res.redirect('/hat/login');
  }
};