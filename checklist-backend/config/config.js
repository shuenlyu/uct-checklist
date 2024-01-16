module.exports = {
  saml: {
    cert: './config/saml.pem',
    privateKey: './config/signingkey.pem',
    entryPoint: 'https://dev-79714403.okta.com/app/dev-79714403_checklist_1/exkegalrk86tKRcN35d7/sso/saml',
    logoutUrl: 'https://dev-79714403.okta.com/app/dev-79714403_checklist_1/exkegalrk86tKRcN35d7/slo/saml',
    issuer: process.env.ISSUER,
    options: {
      failureFlash: true,
      failureRedirect: '/login',
    },
  },
}