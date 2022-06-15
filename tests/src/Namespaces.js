const { event, config } = require('codeceptjs');
const faker = require('@faker-js/faker');

// do before suite tests
event.dispatcher.on(event.suite.before, async function (suite) {
  if (suite.title === 'Namespaces') {
    // nothing
  }
});

/**
 * tests
 */
Feature('Namespaces')
  .config('REST', {
    endpoint: 'https://namespaces.trabur.workers.dev'
  })

Scenario('GET / namespaces then verify a successful call', async ({ I }) => {
  // verify
  I.sendGetRequest(`/`);
	I.seeResponseCodeIsSuccessful();
  I.seeResponseCodeIs(200);
})

Scenario('POST create namespace then verify new record', async ({ I }) => {
  let body = {
    slug: faker.lorem.slug()
  }

  // verify
  let res = await I.sendPostRequest(
    `/`, 
    body, 
    { "Content-Type": "application/json" }
  );
  let namespace = res.data
	I.seeResponseCodeIsSuccessful();
  I.seeResponseCodeIs(200);

  // check that response contains keys
  I.seeResponseContainsKeys(['id', 'slug']);
  
  // check the response data for partial match.
  I.seeResponseContainsJson({
    slug: body.slug
  })

  // clean up
  I.sendDeleteRequest(`/${namespace.id}`)
  I.seeResponseCodeIsSuccessful();
  I.seeResponseCodeIs(200);
});

Scenario('POST create namespace then confirm it has already been created', async ({ I }) => {
  let body = {
    slug: faker.lorem.slug()
  }

  // create first
  let res = await I.sendPostRequest(
    `/`, 
    body, 
    { "Content-Type": "application/json" }
  );
  let namespace = res.data
  I.seeResponseCodeIsSuccessful();
  I.seeResponseCodeIs(200);
  
  // confirm second
  await I.sendPostRequest(
    `/`,
    body, 
    { "Content-Type": "application/json" }
  );
  I.seeResponseCodeIsClientError();
  I.seeResponseCodeIs(400);

  // check that response contains keys
  I.seeResponseContainsKeys(['error']);
  
  // check the response data for a partial match.
  I.seeResponseContainsJson({
    error: "A namespace with that slug already exists."
  })

  // clean up
  I.sendDeleteRequest(`/${namespace.id}`)
  I.seeResponseCodeIsSuccessful();
  I.seeResponseCodeIs(200);
});

// do after suite tests
event.dispatcher.on(event.suite.after, async function (suite) {
  if (suite.title === 'Namespaces') {
    // nothing
  }
});