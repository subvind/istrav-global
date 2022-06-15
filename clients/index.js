import { v4 as uuidv4 } from 'uuid';
import { Router } from 'itty-router'
import {
  json,
  missing,
  withContent,
} from 'itty-router-extras'

// authentication
import jwt from '@tsndr/cloudflare-worker-jwt' // needed for libraries
import jsonwebtoken from 'jsonwebtoken';

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
  content.id = uuidv4()

  // check foreign keys
  let tenant = await tenants.findOne({ id: content.tenantId })
  if (!tenant) {
    return handleRequest({ error: 'The provided tenent id does not exist.' }, { status: 404 });
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
    return handleRequest({ error: 'The provided tenent id does not exist.' }, { status: 404 });
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

// true: If your backend is in a language not supported by the Firebase Admin SDK, you can still verify ID tokens...
// https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
async function verifyToken (content) {
  // grab firebase's official public cert from the internet
  let cert = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com')
    .then(response => response.json())
    .then((data) => {
      return data[Object.keys(data)[0]]
    })
  console.log('cert', cert)

  // confirm user token is valid with firebase cert using 3rd party jwt library
  let isValid = jwt.verify(content, cert, { algorithm: 'RS256' })
  if (isValid) {
    return jsonwebtoken.decode(content)
  } else {
    return { error: true, message: 'Unable to verify token from firebase.' }
  }
}

// POST verify a token from browser's getIdTokenResult
router.post('/:namespace/verifyIdToken', withContent, async ({ params, content }) => {
  let key = `clients:${params.namespace}`
  
  // check requirements
  let verified = await verifyToken(content)

  return handleRequest(verified)
})

// POST register an item with the collection
router.post('/:namespace/register', withContent, async ({ params, content }) => {
  let key = `clients:${params.namespace}`
  
  // database
  await download(key)

  // check requirements
  let verified = await verifyToken(content)
  console.log('verified', verified)
  if (verified.error) {
    return handleRequest({ reason: verified.message }, { status: 400 });
  }
  if (!verified.user_id) {
    return handleRequest({ reason: 'Token data does not have a firebaseAuthRef.' }, { status: 404 });
  }

  // check if user already exists
  let clientCheck = collection.findOne({ firebaseAuthRef: verified.user_id })
  if (clientCheck) {
    return handleRequest({ reason: 'A client with that firebaseAuthRef already exists.' }, { status: 400 });
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
    return handleRequest({ reason: 'Sorry we are unable to generate an apiKey.' }, { status: 400 });
  }

  return handleRequest(apiKey)
})

// POST login an item with the collection
router.post('/:namespace/login', withContent, async ({ params, content }) => {
  let key = `clients:${params.namespace}`
  
  // database
  await download(key)

  // check requirements
  let verified = await verifyToken(content)
  console.log('verified', verified)
  if (verified.error) {
    return handleRequest({ reason: verified.message }, { status: 400 });
  }
  if (!verified.user_id) {
    return handleRequest({ reason: 'Token data does not have a firebaseAuthRef.' }, { status: 404 });
  }

  // grab user by firebase auth id
  let client = collection.findOne({ firebaseAuthRef: verified.user_id })
  console.log('client', client)
  if (!client) {
    return handleRequest({ reason: 'No client exists exist with that firebaseAuthRef.' }, { status: 404 });
  }

  // user is valid so return api key
  let apiKey = await jwt.sign(client, secret, { algorithm: 'HS256' })
  console.log('apiKey', apiKey)
  if (!apiKey || apiKey == {}) {
    return handleRequest({ reason: 'Sorry we are unable to generate an apiKey.' }, { status: 400 });
  }

  return handleRequest(apiKey)
})

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }))

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
