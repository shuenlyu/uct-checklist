const fs = require('fs');
const passport = require('passport');
const Strategy = require('passport-saml').Strategy;

const config = require('./config');

const users = [];

const samlStrategy = new Strategy({
    issuer: config.saml.issuer,
    protocol: `${process.env.PROTOCOL}://`,
    path: '/login/callback',
    entryPoint: config.saml.entryPoint,
    cert: fs.readFileSync(config.saml.cert, 'utf-8'),
    privateKey: fs.readFileSync(config.saml.privateKey, 'utf-8'),
    logoutUrl: config.saml.logoutUrl,
  },
  (user, done) => {
    if (!users.includes(user)) {
      users.push(user);
    }
    return done(null, user);
  });

passport.serializeUser((user, done) => {
  done(null, user);
})

passport.deserializeUser((user, done) => {
  done(null, user);
})

passport.use(samlStrategy);

module.exports = samlStrategy;