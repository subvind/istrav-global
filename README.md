isTrav-backend
========

### Functions
- isTrav triggers a usage report once per 1 minute
- isTrav keeps a platform's current level that represents what is being charged at this moment
- isTrav keeps a platform's max level that represents what the client is willing to be charged
- clients will be warned if a platforms current level is near the max level at their discretion
- isTrav generates new license keys for platforms once per 1 day or on a change of level status
- platforms know which license keys are legit and which are not legit because they are signed by isTrav
- platform's task scheduling runs a cron once per 1 minute to update the platform's config with the authentic license key from isTrav
- if platforms are unable to connect with isTrav 
- then they remain disabled if they were disable and remain active if they were active
- after a platform's license key is applied if the current level is over the max level then it should disable
- because inside the platform's license key the data says { valid: false } so the platform disables
- because platforms in-memory cache returns { isActive: false } and every request to the API checks on this value before doing anything platforms remain disabled
- becuase isTrav triggers usage reports every 1 minute therefor means platforms shouldn't take any longer than 1 minute plus or minus a few seconds to shutdown after surpassing the max level of requests per day or max level of requests per month or max level of active users per hour allowances
- because everyone can publicly verify a platfrom anyone can know if a platform is running genuine or not
- meaning platforms that [return illegitimate or no license key at all, return { isActive: true } when it should not, or return fake reports] are noticed and handled acordingly.

### Workers
- reports
- license-keys
- checks
- projects
- levels
- tenants

### Database Tables
- reports
- levels
- licenseKeys
- tenants
- platforms
- websites
- clients
- stripeCustomers            
- stripeProducts             
- stripePrices               
- stripeInvoices 
- stripeSubscriptions
- stripePaymentIntents
- stripePaymentMethods

### Table Fields & Relations
- reports: {createdAt, }
- levels: {number, activeUsers, price, name, description}
- tenants: {level, clients, platforms}
- platforms: {tenant, backendDomainName, licenseKey, websites}
- websites: {platform, frontendDomainName}
- licenseKeys: {platform, validate, mac, expiry}
- clients: {firebaseAuthId, token, tenant}
- payments: [customers, products, prices, invoices, subscriptions, paymentIntents, paymentMethods]

### Level Limits
```bash
number | activeUsersPerHour | requestsPerDay | requestsPerMonth | price
0        25                                                       free  
1        100                                                      $60
2        200                                                      $120
3        300                                                      $180
```

#### 3rd Party Libraries
- id: https://www.npmjs.com/package/uuid
- tokens: https://github.com/tsndr/cloudflare-worker-jwt
- routing: https://github.com/kwhitley/itty-router
