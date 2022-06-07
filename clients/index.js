import { Router } from 'itty-router'
import {
  json,
  missing,
  withContent,
} from 'itty-router-extras'

// now let's create a router (note the lack of "new")
const router = Router()

// GET collection index
router.get('/', async () => {
  const data = await CLIENTS.list();
  let clients = JSON.stringify(data)

  return handleRequest(clients)
})

// GET item in collection
router.get('/:id', async ({ params }) => {
  const client = await CLIENTS.get(params.id)

  return handleRequest(client)
})

// POST new item to the collection
router.post('/:id', withContent, async ({ params, content}) => {
  // create
  content = JSON.stringify(content)
  await CLIENTS.put(params.id, content)
  
  // refetch
  const client = await CLIENTS.get(params.id)

  return handleRequest(client)
})

// UPDATE existing item in the collection
router.put('/:id', withContent, async ({ params, content}) => {
  // save
  content = JSON.stringify(content)
  await CLIENTS.put(params.id, content)
  
  // refetch
  const client = await CLIENTS.get(params.id)

  return handleRequest(client)
})

// DELETE item from collection
router.delete('/:id', async ({ params }) => {
  const client = await CLIENTS.delete(params.id)

  return handleRequest(client)
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
