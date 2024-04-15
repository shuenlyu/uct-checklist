module.exports = {
  saml: {
    cert: './config/saml.pem',
    privateKey: './config/signingkey.pem',
    entryPoint: 'https://uct.okta.com/app/uct_checklistgenerator_1/exkipeegl6rxC8YPz4x7/sso/saml',
    logoutUrl: 'https://uct.okta.com/app/uct_checklistgenerator_1/exkipeegl6rxC8YPz4x7/slo/saml',
    issuer: process.env.ISSUER,
    options: {
      failureFlash: true,
      failureRedirect: '/login',
    },
  },
}