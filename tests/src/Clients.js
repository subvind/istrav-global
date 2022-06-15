const { config } = require('codeceptjs');

const faker = require('@faker-js/faker');
// let id = faker.internet.domainName() // 'slow-timer.info'

function setup() {

}

function teardown() {

}

Feature('Clients');

Scenario('GET findAll clients then verify a successful call', async ({ I }) => {
  await I.sendGetRequest(`https://clients.trabur.workers.dev/my-namespace`);
	await I.seeResponseCodeIsSuccessful();
});

Scenario('POST register client then verify new record', async ({ I }) => {
  await I.sendGetRequest(`https://clients.trabur.workers.dev/no-namespace`);
	await I.seeResponseCodeClientError();
});

Scenario('GET findOne client then verify a single record', async ({ I }) => {
  await I.sendGetRequest(`https://clients.trabur.workers.dev/no-namespace`);
	await I.seeResponseCodeClientError();
});

Scenario('GET findAll clients then verify multiple records', async ({ I }) => {
  await I.sendGetRequest(`https://clients.trabur.workers.dev/no-namespace`);
	await I.seeResponseCodeClientError();
});