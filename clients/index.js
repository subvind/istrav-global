import { v4 as uuidv4 } from 'uuid';
import { Router } from 'itty-router'
import {
  json,
  missing,
  withContent,
} from 'itty-router-extras'

// database collection
import loki from 'lokijs'
let db = new loki('istrav');
let clients = db.addCollection('clients', { indices: ['id', 'email', 'firebaseAuthId'] });

// grab clients from key value storage
let data = await CLIENTS.get('all')
data = JSON.parse(data)
if (data && data.length) {
  data.forEach((value) => {
    // put client into collection one at a time
    clients.insert(value)
  })
}

// update database with in-memory records
function save() {
  let content = clients.find()
  content = JSON.stringify(content)
  await CLIENTS.put('all', content)
}

// now let's create a router (note the lack of "new")
const router = Router()

// GET collection index
router.get('/', async () => {
  let clients = clients.find()

  return handleRequest(clients)
})

// GET item in collection
router.get('/:id', async ({ params }) => {
  let client = clients.findOne({ id: params.id })

  return handleRequest(client)
})

// POST new item to the collection
router.post('/', withContent, async ({ params, content}) => {
  content.id = uuidv4()
  let client = clients.insert(content)
  save()

  return handleRequest(client)
})

// UPDATE existing item in the collection
router.put('/:id', withContent, async ({ params, content}) => {
  let client = clients.findOne({ id: params.id })
  client.email = content.email || client.email
  client.firebaseAuthId = content.firebaseAuthId || client.firebaseAuthId
  clients.update(client)
  save()

  return handleRequest(client)
})

// DELETE item from collection
router.delete('/:id', async ({ params }) => {
  clients.remove({ id: params.id })
  save()

  return handleRequest(null)
})

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }))

// attach the router "handle" to the event handler
addEventListener('fetch', event => {
  event.respondWith(router.handle(event.request))
})

async function handleRequest(content, options) {
  return new Response(content, {
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
