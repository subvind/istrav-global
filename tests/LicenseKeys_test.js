const { config } = require('codeceptjs');

const { faker } = require('@faker-js/faker');

Feature('LicenseKeys');

Scenario('generate license key then verify it', async ({ I }) => {
  
  let id = faker.internet.domainName() // 'slow-timer.info'
  let secret = 'furlong'

  // get the first license key
  let licenseKey = await I.sendGetRequest(`https://license-keys.trabur.workers.dev/generate?id=${id}&secret=${secret}`);

  // check response code
  I.seeResponseCodeIs(200);

  // matches 200, 201, 202, ... 206
  I.seeResponseCodeIsSuccessful();

  // // matches 300...308
  // I.seeResponseCodeIsRedirection();

  // // matches 400..451
  // I.seeResponseCodeIsClientError();

  // // matches 500-511
  // I.seeResponseCodeIsServerError();

  // check that response contains keys
  I.seeResponseContainsKeys(['id', 'expiry', 'genuine', 'mac', 'reason', 'valid', 'verifyUrl']);
  
  // It will check the response data for partial match.
  I.seeResponseContainsJson({
    id: id
  })

  // // create a post and save its Id
  // postId = await I.sendPostRequest('/api/posts', { author: user.id, body: 'some text' });
});
