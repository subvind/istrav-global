const { event, config } = require('codeceptjs');
const faker = require('@faker-js/faker');
var jwt = require('jsonwebtoken');

// // do before each test in suite
// event.dispatcher.on(event.test.before, (test) => {
//   // nothing
// });

// do before suite tests
BeforeSuite(async ({ I }) => {
  // init namespace
  let namespace = await I.sendPostRequest('https://namespaces.trabur.workers.dev', {
    slug: faker.lorem.slug()
  })

  // save for later
  config.append({
    namespace: namespace.data
  })
})

/**
 * tests
 */
Feature('Clients')
  .config('REST', {
    endpoint: 'https://clients.trabur.workers.dev'
  })

Scenario('GET / clients then verify a successful call', async ({ I }) => {
  // verify
  I.sendGetRequest(`/`);
	I.seeResponseCodeIsSuccessful();
});

Scenario('POST register client then verify new record', async ({ I }) => {
  let ns = config.get().namespace.slug
  let body = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFhZWY1NjlmNTI0MTRlOWY0YTcxMDRiNmQwNzFmMDY2ZGZlZWQ2NzciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vaXN0cmF2IiwiYXVkIjoiaXN0cmF2IiwiYXV0aF90aW1lIjoxNjU0OTg0NDM2LCJ1c2VyX2lkIjoiM2VNSEFKTzdnMmNlVm9qNlN3VUsycjJSdWloMSIsInN1YiI6IjNlTUhBSk83ZzJjZVZvajZTd1VLMnIyUnVpaDEiLCJpYXQiOjE2NTQ5ODQ0MzgsImV4cCI6MTY1NDk4ODAzOCwiZW1haWwiOiJ0cmF2aXMuYnVyYW5kdEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsidHJhdmlzLmJ1cmFuZHRAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.NiCH3c7mgpzVBJw08iM86aSdutO7Rmy9jLNqS_pQUbkBsfDce6Njtow8y5H7AftFTwlrOaK31IUop7WaNJF8HMGwa5PC23dLuyWYLsoyAbc1ttC6dxXRmjwc21F6HMNWuMLB6J3_XOZg5S4kwwL9cp-KKjPkXtpNJIb7eRVbApTQWZFtxUWBwqgQrM0Ntx2SLdTS_gtoIkdIordDo16vcV14BVPnZRhf6slgMAHPuegyizJ9YGs3QHW0VjHdQ1IuPdjjTJ5lE081LThschEQGJdB5TXQG1iaEm4ikrOYTAXjJgJxHfCms171537fZ4Ivgo-VQMhOEEAQHOb7wyMW5A"

  // register
  let res = await I.sendPostRequest(
    `/${ns}/register`, 
    body, 
    { "Content-Type": "application/json" }
  );
  let client = jwt.decode(res.data)
	I.seeResponseCodeIsSuccessful();
  I.seeResponseCodeIs(200);

  // clean up
  I.sendDeleteRequest(`/${ns}/${client.id}`)
  I.seeResponseCodeIsSuccessful();
  I.seeResponseCodeIs(200);
});

Scenario('POST register client then confirm it has already been created', async ({ I }) => {
  let ns = config.get().namespace.slug
  let body = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFhZWY1NjlmNTI0MTRlOWY0YTcxMDRiNmQwNzFmMDY2ZGZlZWQ2NzciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vaXN0cmF2IiwiYXVkIjoiaXN0cmF2IiwiYXV0aF90aW1lIjoxNjU0OTg0NDM2LCJ1c2VyX2lkIjoiM2VNSEFKTzdnMmNlVm9qNlN3VUsycjJSdWloMSIsInN1YiI6IjNlTUhBSk83ZzJjZVZvajZTd1VLMnIyUnVpaDEiLCJpYXQiOjE2NTQ5ODQ0MzgsImV4cCI6MTY1NDk4ODAzOCwiZW1haWwiOiJ0cmF2aXMuYnVyYW5kdEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsidHJhdmlzLmJ1cmFuZHRAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.NiCH3c7mgpzVBJw08iM86aSdutO7Rmy9jLNqS_pQUbkBsfDce6Njtow8y5H7AftFTwlrOaK31IUop7WaNJF8HMGwa5PC23dLuyWYLsoyAbc1ttC6dxXRmjwc21F6HMNWuMLB6J3_XOZg5S4kwwL9cp-KKjPkXtpNJIb7eRVbApTQWZFtxUWBwqgQrM0Ntx2SLdTS_gtoIkdIordDo16vcV14BVPnZRhf6slgMAHPuegyizJ9YGs3QHW0VjHdQ1IuPdjjTJ5lE081LThschEQGJdB5TXQG1iaEm4ikrOYTAXjJgJxHfCms171537fZ4Ivgo-VQMhOEEAQHOb7wyMW5A"
  
  // create first
  let res = await I.sendPostRequest(
    `/${ns}/register`, 
    body, 
    { "Content-Type": "application/json" }
  );
  let client = jwt.decode(res.data)
  I.seeResponseCodeIsSuccessful();
  I.seeResponseCodeIs(200);
  
  // confirm second
  await I.sendPostRequest(
    `/${ns}/register`, 
    body, 
    { "Content-Type": "application/json" }
  );
  I.seeResponseCodeIsClientError();
  I.seeResponseCodeIs(400);

  // check that response contains keys
  I.seeResponseContainsKeys(['error']);
  
  // check the response data for a partial match.
  I.seeResponseContainsJson({
    error: "A client with that firebaseAuthRef already exists."
  })

  // clean up
  I.sendDeleteRequest(`/${ns}/${client.id}`)
  I.seeResponseCodeIsSuccessful();
  I.seeResponseCodeIs(200);
});

Scenario('GET findOne client then verify a single record', async ({ I }) => {
  let ns = config.get().namespace.slug
  let id = '1023f53f-d5a4-4a26-9df0-2710b1be0573'

  // verify
  I.sendGetRequest(`/${ns}/${id}`);
	I.seeResponseCodeIsSuccessful();
});

Scenario('GET findAll clients then verify multiple records', async ({ I }) => {
  let ns = config.get().namespace.slug
  I.sendGetRequest(`/${ns}/`);
	I.seeResponseCodeIsSuccessful();
});

Scenario('GET verifyIdToken client then confirm that it is valid', async ({ I }) => {
  let ns = config.get().namespace.slug
  I.sendGetRequest(`/${ns}/register`);
	I.seeResponseCodeIsSuccessful();
});

Scenario('DELETE delete client then verify that it is gone', async ({ I }) => {
  let ns = config.get().namespace.slug
  let id = 'b16f154d-97a7-41c6-8e2f-b1970f967d1c'

  I.sendDeleteRequest(`/${ns}/${id}`);
	I.seeResponseCodeIsSuccessful();
});

AfterSuite(({ I }) => {
  let id = config.get().namespace.id

  I.sendDeleteRequest(`/${id}`);
	I.seeResponseCodeIsSuccessful();
})