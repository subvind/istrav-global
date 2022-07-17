import { v4 as uuidv4 } from 'uuid';
import { Router } from 'itty-router'
import {
  json,
  missing,
  withContent,
} from 'itty-router-extras'

// authentication
import { verifyTokenId } from "@codehelios/verify-tokenid";
import jwt from '@tsndr/cloudflare-worker-jwt' // needed for libraries

// database collection
import loki from 'lokijs'
let db = new loki('istrav');
let collection = db.addCollection('clients', { indices: ['id', 'firebaseAuthRef'] });
let tenants = db.addCollection('tenants', { indices: ['id', 'slug'] });

// for signing and verifying API keys
const secret = API_KEYS_SECRET || 'between workers'

// read from KV database
async function download(key, store) {
  let database = store || collection
  let storageData
  let recover = await ISTRAV.get(key)
  console.log('recover', recover)
  if (recover) {
    storageData = JSON.parse(recover)
    console.log('storageData', storageData)

    storageData.forEach((value) => {
      database.findAndRemove({ id: value.id }) // so we don't get duplicates
      delete value['$loki'] // otherwise we get record already there error
      database.insert(value)
    })
  }
  return storageData
}

// update to KV with in-memory records
async function save(key, store) {
  let database = store || collection
  let memoryData = database.find()
  console.log('memoryData', memoryData)
  let keep = JSON.stringify(memoryData)
  await ISTRAV.put(key, keep)
  return memoryData
}

// now let's create a router (note the lack of "new")
const router = Router()

// GET collection index
router.get('/:namespace', async ({ params }) => {
  let key = `clients:${params.namespace}`

  // database
  await download(key)

  // list
  let records = collection.find()
  console.log('findAll', records)

  return handleRequest(records)
})

// GET item in collection
router.get('/:namespace/:id', async ({ params }) => {
  let key = `clients:${params.namespace}`
  
  // database
  await download(key)

  // read
  let record = collection.findOne({ id: params.id })

  return handleRequest(record)
})

// POST create item in the collection
router.post('/:namespace', withContent, async ({ params, content}) => {
  let key = `clients:${params.namespace}`
  
  // database
  await download(key)
  await download(`tenants:${content.tenantId}`, tenants)

  // create
  // content.email
  // content.firebaseAuthRef
  // content.tenantId
  content.id = uuidv4()

  // check foreign keys
  let tenant = await tenants.findOne({ id: content.tenantId })
  if (!tenant) {
    return handleRequest({ error: 'The provided tenent id foreign key does not exist.' }, { status: 404 });
  }

  // submit
  let record = collection.insert(content)

  // database
  await save(key)

  return handleRequest(record)
})

// UPDATE existing item in the collection
router.put('/:namespace/:id', withContent, async ({ params, content}) => {
  let key = `clients:${params.namespace}`
  
  // database
  await download(key)
  await download(`tenants:${content.tenantId}`, tenants)

  // update
  let record = collection.findOne({ id: params.id })
  record.email = content.email || record.email
  record.firebaseAuthRef = content.firebaseAuthRef || record.firebaseAuthRef
  record.tenantId = content.tenantId || record.tenantId

  // check foreign keys
  let tenant = await tenants.findOne({ id: record.tenantId })
  if (!tenant) {
    return handleRequest({ error: 'The provided tenent id foreign key does not exist.' }, { status: 404 });
  }

  // submit
  collection.update(client)

  // database
  await save(key)

  return handleRequest(record)
})

// DELETE an item from collection
router.delete('/:namespace/:id', async ({ params }) => {
  let key = `clients:${params.namespace}`
  
  // database
  await download(key)

  // submit
  collection.findAndRemove({ id: params.id })

  // database
  await save(key)

  return handleRequest(null)
})

// https://github.com/codehelios/verify-tokenid
async function verifyFirebaseToken (token) {
  const { isValid, decoded, error } = await verifyTokenId(token, "https://securetoken.google.com/istrav", "istrav");
  console.log('isValid', isValid)

  if (isValid) {
    return decoded
  } else {
    return { error: true, message: error }
  }
}

// POST verify a token from browser's getIdTokenResult
router.post('/:namespace/verifyIdToken', withContent, async ({ params, content }) => {
  let key = `clients:${params.namespace}`
  
  // check requirements
  if (!content || !content.token) {
    return handleRequest({ error: 'A firebase token is required: { "token": "3r874ohs..." }.' }, { status: 400 });
  }
  let verified = await verifyFirebaseToken(content.token)

  return handleRequest(verified)
})

// POST register an item with the collection
router.post('/:namespace/register', withContent, async ({ params, content }) => {
  let key = `clients:${params.namespace}`
  
  // database
  await download(key)

  // check requirements
  if (!content || !content.token) {
    return handleRequest({ error: 'A firebase token is required: { "token": "3r874ohs..." }.' }, { status: 400 });
  }
  let verified = await verifyFirebaseToken(content.token)
  console.log('verified', verified)
  if (verified === null) {
    return handleRequest({ error: content }, { status: 400 });
  }
  if (verified.error) {
    return handleRequest({ error: verified.message }, { status: 400 });
  }
  if (!verified.user_id) {
    return handleRequest({ error: 'Token data does not have a firebaseAuthRef.' }, { status: 404 });
  }

  // check if user already exists
  let clientCheck = collection.findOne({ firebaseAuthRef: verified.user_id })
  if (clientCheck) {
    return handleRequest({ error: 'A client with that firebaseAuthRef already exists.' }, { status: 400 });
  }

  // register: user is valid and new so create one here
  let record = {
    id: uuidv4(),
    email: verified.email,
    firebaseAuthRef: verified.user_id
  }
  console.log('record', record)
  let client = collection.insert(record)
  console.log('client', client)

  // database
  await save(key)

  // user is valid so return api key
  let apiKey = await jwt.sign(client, secret, { algorithm: 'HS256' })
  console.log('apiKey', apiKey)
  if (!apiKey || apiKey == {}) {
    return handleRequest({ error: 'Sorry we are unable to generate an apiKey.' }, { status: 400 });
  }

  return handleRequest(apiKey)
})

// POST login an item with the collection
router.post('/:namespace/login', withContent, async ({ params, content }) => {
  let key = `clients:${params.namespace}`
  
  // database
  await download(key)

  // check requirements
  if (!content || !content.token) {
    return handleRequest({ error: 'A firebase token is required: { "token": "3r874ohs..." }.' }, { status: 400 });
  }
  let verified = await verifyFirebaseToken(content.token)
  console.log('verified', verified)
  if (verified === null) {
    return handleRequest({ error: content }, { status: 400 });
  }
  if (verified.error) {
    return handleRequest({ error: verified.message }, { status: 400 });
  }
  if (!verified.user_id) {
    return handleRequest({ error: 'Token data does not have a firebaseAuthRef.' }, { status: 404 });
  }

  // grab user by firebase auth id
  let client = collection.findOne({ firebaseAuthRef: verified.user_id })
  console.log('client', client)
  if (!client) {
    return handleRequest({ error: 'No client exists exist with that firebaseAuthRef.' }, { status: 404 });
  }

  // user is valid so return api key
  let apiKey = await jwt.sign(client, secret, { algorithm: 'HS256' })
  console.log('apiKey', apiKey)
  if (!apiKey || apiKey == {}) {
    return handleRequest({ error: 'Sorry we are unable to generate an apiKey.' }, { status: 400 });
  }

  return handleRequest(apiKey)
})

// for everything else
router.all('*', () => handleRequest('https://global.trabur.workers.dev'))

// attach the router "handle" to the event handler
addEventListener('fetch', event => {
  event.respondWith(router.handle(event.request))
})

// respond with a string and allow access control
function handleRequest(content, options) {
  let dataString = JSON.stringify(content)
  return new Response(dataString, {
    ...options,
    headers:  {
      'content-type': 'application/json;charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,HEAD,OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Max-Age': '86400',
    },
  })
}
