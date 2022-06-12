istrav-global
========

### CloudFlare Workers
- clients
- levels
- license-keys
- platforms
- projects
- reports
- stripe
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
