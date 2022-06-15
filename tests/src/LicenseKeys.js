const { event, config } = require('codeceptjs');
const faker = require('@faker-js/faker');

// do before suite tests
event.dispatcher.on(event.suite.before, async function (suite) {
  if (suite.title === 'LicenseKeys') {
    // nothing
  }
});

/**
 * tests
 */
Feature('LicenseKeys')
  .config('REST', {
    endpoint: 'https://license-keys.trabur.workers.dev'
  })

Scenario('POST generate license key then verify it', async ({ I }) => {
  let body = {
    id: faker.internet.domainName(),
    secret: "2387d29ydh23uy8dg9283gd9u2yd9238yufgd93487yfvb923y74fvbq93248tg93ouy4wi"
  }

  // generate
  I.sendPostRequest(`/generate`, body);
  I.seeResponseCodeIsSuccessful();
  I.seeResponseCodeIs(200);

  // check that response contains keys
  I.seeResponseContainsKeys(['id', 'expiry', 'genuine', 'mac', 'valid']);
  
  // check the response data for a partial match.
  I.seeResponseContainsJson({
    id: body.id
  })
});

// do after suite tests
event.dispatcher.on(event.suite.after, async function (suite) {
  if (suite.title === 'LicenseKeys') {
    // nothing
  }
});