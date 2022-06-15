istrav-global
========
let folders = [community, json, charge] // ai

### Storage Locations
- namespaces/id
- access-keys/namespace/id
- tenants/namespace/id
- clients/namespace/id
- platforms/namespace/id
- levels/namespace/id
- license-keys/namespace/id
- reports/namespace/id
- websites/namespace/id
- bins/namespace/version/id
- collections/namespace/id
- schema-validators/namespace/id

### CloudFlare Workers
- namespaces
- access-keys
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
- schema-validators

### Key Value Locations
- namespaces
- access-keys
- tenants
- clients
- platforms
- levels
- license-keys
- reports
- websites
- bins
- collections
- schema-validators

### Table Fields & Relations
- namespaces: {id, slug, accessKeys}
- accessKeys: {id, token}
- tenants: {id, levelId, clients, platforms, stripeCustomerRef}
- clients: {id, email, firebaseAuthRef, tenantId}
- platforms: {id, tenantId, backendDomainName, licenseKey: {id, mac, expiry}, websites, reports, stripeSubscriptionRef}
- licenseKeys: {id, mac, expiry}
- levels: {id, tenants, amount, number, activeUsersPerHour, requestsPerDay, requestsPerMonth, name, description, stripeProductRef, stripePriceRef}
- reports: {id, platformId, activeUsersPastHour, requestsPastDay, requestsPastMonth, createdAt}
- stripe: [customers, products, prices, invoices, subscriptions, paymentIntents, paymentMethods]
- websites: {id, platformId, frontendDomainName}
- bins: {id, collectionId, data}
- collections: {id, bins, schemaValidatorId}
- schemaValidators: {id, collections}

### Table Foreign Keys
- namespaces:{id}:accessKeys:{accessKeyId}
- tenants:{id}:clients:{clientId}
- tenants:{id}:platforms:{platformId}
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
