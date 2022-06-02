istrav-backend
========
This project is for selling code that clients get to run on their own servers using product activation license keys. 

For example ... the code we are selling on istrav.com is a monolithic platform called /community_folder/ which can be tied along with other additional websites and mobile apps.

In order to sell code we'll need some sort of Key Management Service or KMS and that's partly what istrav-backend does under the hood. The other part is integration with a payment processor called Stripe so code may be billed in a monthly subscription like model. Then lastly is integration with the code we are selling itself; referred to as platforms.

These platforms have levels and each level has a limit to how many active users it may hold and the number of daily requests and monthly requests it may process. These platforms are also containers or nestjs driven and are fairly stable as they may also run in the cloud. So we'll need an even more redundant system for our base and that's CloudFlare Workers! 

These Workers are used with an equally powerful Key Value or KV database. The workers themselves are javascript isolates that have a 0ms cold start and the code runs in over 250 strategic locations around the globe. This istrav-backend along with a Single Page App or SPA that runs in a Content Delivery Network or CDN makes isTrav one crazy scalable, performant, and highly available application for client area and business operations.

So why not code and deploy everyhthing to the cloud as Workers? Well, isTrav's monolithic platform or /community_folder/ is deployable to heroku, kubernetes, and bare metal; it is not as redundant as 250 serverless location however it's much more cost effective.

### Manage subscriptions, recurring payments, and billing
"Stripe Billing is the fastest way for your business to bill customers with subscriptions or invoices. Capture more revenue, support new products or business models, and accept recurring payments globally." - Stripe

### Key Management Service (KMS)
"Key management refers to management of cryptographic keys in a cryptosystem. This includes dealing with the generation, exchange, storage, use, crypto-shredding and replacement of keys. It includes cryptographic protocol design, key servers, user procedures, and other relevant protocols." - Wikipedia

### Workflow
- isTrav triggers a usage report once per 1 minute
- isTrav keeps a platform's current level that represents what is being charged at this moment
- isTrav keeps a platform's max level that represents what the client is willing to be charged
- clients will be warned if a platforms current level is near the max level at their discretion
- isTrav generates new license keys for platforms once per 1 day or on a change of level status
- platforms know which license keys are legit and which are not legit because they are signed and verifiable by isTrav
- platform's task scheduling runs a cron once per 1 minute to update the platform's config with the authentic license key from isTrav
- if platforms are unable to connect with isTrav 
- then they remain disabled if they were disable and remain active if they were active
- after a platform's license key is applied if the current level is over the max level then it should disable
- because inside the platform's license key the data says { valid: false } so the platform disables
- because platforms in-memory cache returns { isActive: false } and every request to the API checks on this value before doing anything platforms remain disabled
- becuase isTrav triggers usage reports every 1 minute therefor means platforms shouldn't take any longer than 1 minute plus or minus a few seconds to shutdown after surpassing the max level of requests per day or max level of requests per month or max level of active users per hour allowances
- because everyone can publicly verify a platfrom anyone can know if a platform is running genuine or not
- meaning platforms that [return illegitimate or no license key at all, return { isActive: true } when it should not, or return fake reports] are noticed and handled acordingly.

### CloudFlare Workers
- checks
- clients
- levels
- license-keys
- platforms
- projects
- reports
- tenants
- websites

### KV Database Tables
- clients
- levels
- licenseKeys
- platforms
- reports
- tenants
- websites

### Table Fields & Relations
- clients: {firebaseAuthId, token, tenant}
- levels: {amount, number, activeUsers, requestsPerDay, requestsPerMonth, name, description, stripeProduct, stripePrice}
- licenseKeys: {platform, validate, mac, expiry}
- platforms: {tenant, backendDomainName, licenseKey, websites, stripeSubscription}
- reports: {createdAt, activeUsersPastHour, requestsPastDay, requestsPastMonth}
- stripe: [customers, products, prices, invoices, subscriptions, paymentIntents, paymentMethods]
- tenants: {level, clients, platforms, stripeCustomer}
- websites: {platform, frontendDomainName}

### Level Limits
```bash
number | activeUsersPerHour | requestsPerDay | requestsPerMonth | amount
0        25                                                       free  
1        100                                                      $60
2        200                                                      $120
3        300                                                      $180
```

#### 3rd Party Libraries
- id: https://www.npmjs.com/package/uuid
- tokens: https://github.com/tsndr/cloudflare-worker-jwt
- routing: https://github.com/kwhitley/itty-router
