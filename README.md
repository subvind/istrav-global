istrav-backend
========
application for deploying and managing /community_folder/ platforms

### istrav
- licenseKeys: JWTs for limiting permission to software
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
This project uses GitHub Actions where the master branch is production.
```bash
$ git add .
$ git commit -m "anything"
$ git push
```