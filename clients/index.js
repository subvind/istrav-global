import { v4 as uuidv4 } from 'uuid';
import { Router } from 'itty-router'
import {
  json,
  missing,
  withContent,
} from 'itty-router-extras'

// authentication
import jwt from 'jsonwebtoken';

// database collection
import loki from 'lokijs'
let db = new loki('istrav');
let collection = db.addCollection('clients', { indices: ['id', 'firebaseAuthId'] });

// for signing and verifying API keys
const secret = API_KEYS_SECRET || 'between workers'

// grab clients from key value storage
async function download() {
  let data = await CLIENTS.get('all')
  if (data) {
    db.loadJSON(data) // Inflates a loki database from a serialized JSON string
  }
  return data
}

// update database with in-memory records
async function save() {
  let content = db.serialize() // Serialize database to a string which can be loaded via Loki#loadJSON
  let data = await CLIENTS.put('all', content)
  return data
}

// now let's create a router (note the lack of "new")
const router = Router()

// GET collection index
router.get('/', async () => {
  let data = await download()
  let clients = collection.find() || []

  return handleRequest(clients)
})

// GET item in collection
router.get('/:id', async ({ params }) => {
  let data = await download()
  let client = collection.findOne({ id: params.id })

  return handleRequest(client)
})

// POST new item to the collection
router.post('/', withContent, async ({ params, content}) => {
  let data = await download()
  content.id = uuidv4()
  let client = collection.insert(content)
  save()

  return handleRequest(client)
})

// UPDATE existing item in the collection
router.put('/:id', withContent, async ({ params, content}) => {
  let data = await download()
  let client = collection.findOne({ id: params.id })
  client.email = content.email || client.email
  client.firebaseAuthId = content.firebaseAuthId || client.firebaseAuthId
  collection.update(client)
  save()

  return handleRequest(client)
})

// DELETE an item from collection
router.delete('/:id', async ({ params }) => {
  let data = await download()
  collection.findAndRemove({ id: params.id })
  save()

  return handleRequest(null)
})

async function verifyToken (content) {
  let cert = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com')
    .then(response => response.json())
    .then((data) => {
      return data[Object.keys(data)[0]]
    })
  console.log('cert', cert)

  let verified
  jwt.verify(content, cert, { algorithms: ['RS256'] }, function (error, payload) {
    if (error) {
      console.log('error', error)
      verified = error
    } else {
      console.log('payload', payload)
      verified = payload
    }
  });

  return verified
}

// POST verify a token from browser's getIdTokenResult
router.post('/verifyIdToken', withContent, async ({ params, content }) => {
  let verified = verifyToken(content)
  return handleRequest(verified)
})

// POST register an item with the collection
router.post('/register', withContent, async ({ params, content }) => {
  let data = await download()
  let verified = verifyToken(content)
  let record = {
    id: uuidv4(),
    email: verified.email,
    firebaseAuthId: verified.user_id
  }
  let client = collection.insert(record)
  save()
  let apiKey = jwt.sign(client, secret)

  return handleRequest(apiKey)
})

// POST login an item with the collection
router.post('/login', withContent, async ({ params, content }) => {
  let data = await download()
  let verified = verifyToken(content)
  let client = collection.findOne({ firebaseAuthId: verified.user_id })

  let apiKey = null
  if (client) {
    apiKey = jwt.sign(client, secret)
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
async function handleRequest(content, options) {
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
