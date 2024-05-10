module.exports = {
  saml: {
    cert: './config/saml.pem',
    // privateKey: './config/signingkey.pem',
    entryPoint: process.env.entryPoint,
    issuer: process.env.ISSUER,
    options: {
      failureFlash: true,
      failureRedirect: '/login',
    },
  },
}