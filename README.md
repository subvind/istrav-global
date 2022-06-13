istrav-global
========
let folders = [community, json, charge]

KV storage locations:
- namespaces/id
- accessKeys/id
- tenants/namespace/id
- clients/namespace/id
- platforms/namespace/id
- levels/namespace/id
- licenseKeys/namespace/id
- reports/namespace/id
- stripe/namespace/id
- websites/namespace/id
- bins/namespace/version/id
- collections/namespace/id
- schemaValidators/namespace/id

### CloudFlare Workers
- namespaces
- accessKeys
- tenants
- clients
- platforms
- levels
- license-keys
- projects
- reports
- stripe
- websites
- bins
- collections
- schemaValidators

### KV Database Tables
- namespaces
- accessKeys
- tenants
- clients
- platforms
- levels
- licenseKeys
- reports
- websites
- bins
- collections
- schemaValidators

### Table Fields & Relations
- namespaces: {id, name, accessKeys}
- accessKeys: {id, namespaceId, token}
- tenants: {id, levelId, clients, platforms, namespaces, stripeCustomerId}
- clients: {id, firebaseAuthId, apiKey, tenantId}
- platforms: {id, tenantId, backendDomainName, licenseKeyId, websites, reports, stripeSubscriptionId}
- licenseKeys: {id, platforms, validate, mac, expiry}
- levels: {id, tenants, amount, number, activeUsersPerHour, requestsPerDay, requestsPerMonth, name, description, stripeProductId, stripePriceId}
- reports: {id, platformId, activeUsersPastHour, requestsPastDay, requestsPastMonth, createdAt }
- stripe: [id, customers, products, prices, invoices, subscriptions, paymentIntents, paymentMethods]
- websites: {id, platformId, frontendDomainName}
- bins: {id, collectionId, data}
- collections: {id, bins, schemaValidatorId}
- schemaValidators: {id, collections}

### Table Foreign Keys
- namespaces:{id}:accessKeys:{accessKeyId}
- tenants:{id}:clients:{clientId}
- tenants:{id}:platforms:{platformId}
- tenants:{id}:namespaces:{namespaceId}
- platforms:{id}:websites:{websiteId}
- platforms:{id}:reports:{reportId}
- licenseKeys:{id}:platforms:{platformId}
- levels:{id}:tenants:{tenantId}
- collections:{id}:bins:{binId}
- schemaValidators:{id}:collections:{collectionId}

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
