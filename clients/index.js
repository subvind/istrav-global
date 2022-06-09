import { v4 as uuidv4 } from 'uuid';
import { Router } from 'itty-router'
import {
  json,
  missing,
  withContent,
} from 'itty-router-extras'

// authentication
import { initializeApp } from 'firebase-admin/app';
const app = initializeApp(FIREBASE_CONFIG);

// database collection
import loki from 'lokijs'
let db = new loki('istrav');
let collection = db.addCollection('clients', { indices: ['id'] });

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

// POST verify a token from browser's getIdTokenResult
router.post('/verifyIdToken', withContent, async ({ params, content }) => {
  app.getAuth()
    .verifyIdToken(content)
    .then((decodedToken) => {
      const uid = decodedToken.uid;

      return handleRequest(uid)
    })
    .catch((error) => {
      return handleRequest(error)
    });
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
