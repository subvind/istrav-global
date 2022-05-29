istrav-backend
========
application for deploying and managing /community_folder/ platforms

### istrav
- clients: linked with auth0
- clientPlatforms: CRUD /for_example/ [dev, staging, production]
- platformLicenseKeys: JWTs for limiting permission to software
- projects: github public repositories

### payment processing
- `in-istrav-db-name` // `in-platform-db-name`
- stripeCustomers // tenants
- stripeProducts // websites
- stripePrices // amounts
- stripeInvoices // bills
- stripeSubscriptions // licenseKeys
- stripePaymentIntents // charges
- stripePaymentMethods // moneyAddresses

#### libraries used
- https://www.npmjs.com/package/jsonwebtoken // keys
- https://github.com/heroku/node-heroku-client // deployments
- https://github.com/upptime/upptime // production uptime

```bash
$ wrangler generate todos
$ cd todos
```

### deploy
```bash
$ cd projects
$ wrangler publish
```