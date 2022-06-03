istrav-backend
========
This project is about selling code that clients get to run on their own servers. 

In order for a programmer to be rightfuly compensated for their work isTrav limits code usage to clients by the number of requests the code processes daily, the number of requests the code processes monthly, and the number of active users in the past hour the code has had. It is the clients resposibility to leave our reporting code alone and keep usage stats legit. It is our resposibility to manage, collect, save, bill, and keep clients up to date on code usage permission.

So there is a reports collecting that we do on our side. We then generate and verify product activation license keys for every code platform which reveals whos code is genuine or whos is not and to what extent. Remember keys and locks are really just for show. It is mearly a way of saying and telling someone we don't want you here. After all anyone with bolt cutters could bypass that lock if they really wanted to. Fortunately, our cort systems treat that act of UI as fact and then use it against you with terms like "willing, knowingly, and premeditated" ... not to mention the evidence left behind. If an attacker persists then I guess nature would take over and it would come down to survival of the fitest // or perhaps, "2001: A Deep Space Odyssey"; monkey with the only stick situation. 

- https://www.youtube.com/watch?v=zmX7K8noikE
- https://www.youtube.com/watch?v=esnMDtMysHo

Anyways ... the code we are selling on istrav.com is a monolithic platform called /community_folder/ which integrates with other websites and mobile apps.

In order to sell this code we'll need some sort of Key Management Service or KMS and that's partly what istrav-backend does under the hood. The other part is integration with a payment processor called Stripe so code may be billed in a monthly subscription like model. Then lastly is integration with the code we are selling itself; referred to as platforms.

These platforms have levels and each level has a limit to how many active users it may hold, the number of daily requests, and monthly requests it may process. These platforms are also containers or nestjs driven and are fairly stable as they may also run in the cloud. So we'll need an even more redundant system for our base and that's serverless CloudFlare Workers! 

These Workers are used with an equally powerful Key Value or KV database. The workers themselves are javascript isolates that have a 0ms cold start and the code runs in over 250 strategic locations around the globe. This istrav-backend along with a Single Page App or SPA that runs in a Content Delivery Network or CDN makes isTrav one crazy scalable, performant, and highly available application for client area and business operations.

So why not code and deploy every thing to the cloud as Workers? Well, isTrav's monolithic platform or /community_folder/ is deployable to heroku, kubernetes, and bare metal; it is not as redundant as 250 serverless locations however it's much more cost effective.

### Subscription Management
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
- because platforms in-memory cache returns { isActive: false } and every request to the API checks on this value before doing anything means platforms are disabled immediately
- becuase isTrav triggers usage reports run every 1 minute therefor means platforms shouldn't take any longer than 1 minute, plus or minus a few seconds, to shutdown after surpassing the max level of requests per day or max level of requests per month or max level of active users per hour allowances
- because everyone can publicly verify a platfrom anyone can know if a platform is running genuine or not
- meaning platforms that [return illegitimate or no license key at all, return { isActive: true } when it should not, or return fake reports] are noticed and handled acordingly.

### CloudFlare Workers
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
- clients: {id, firebaseAuthId, apiKey, tenantId}
- levels: {id, tenants, amount, number, activeUsers, requestsPerDay, requestsPerMonth, name, description, stripeProductId, stripePriceId}
- licenseKeys: {id, platforms, validate, mac, expiry}
- platforms: {id, tenantId, backendDomainName, licenseKeyId, websites, reports, stripeSubscriptionId}
- reports: {id, platformId, activeUsersPastHour, requestsPastDay, requestsPastMonth, createdAt }
- stripe: [id, customers, products, prices, invoices, subscriptions, paymentIntents, paymentMethods]
- tenants: {id, levelId, clients, platforms, stripeCustomerId}
- websites: {id, platformId, frontendDomainName}

### Table Foreign Keys
- levels:{id}:tenants:{tenantId}
- tenants:{id}:clients:{clientId}
- tenants:{id}:platforms:{platformId}
- platforms:{id}:websites:{websiteId}
- platforms:{id}:reports:{reportId}
- licenseKeys:{id}:platforms:{platformId}

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
