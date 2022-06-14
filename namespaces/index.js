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
let collection = db.addCollection('namespaces', { indices: ['id', 'slug'] });

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
router.get('/', async () => {
  let key = `namespaces`

  // database
  await download(key)

  // list
  let records = collection.find()
  console.log('findAll', records)

  return handleRequest(records)
})

// GET item in collection
router.get('/:id', async ({ params }) => {
  let key = `namespaces`
  
  // database
  await download(key)

  // read
  let record = collection.findOne({ id: params.id })

  return handleRequest(record)
})

// POST create item in the collection
router.post('/', withContent, async ({ params, content}) => {
  let key = `namespaces`
  
  // database
  await download(key)

  // create
  content.id = uuidv4()
  console.log('create', content)
  
  // check requirements
  let namespace = collection.findOne({ slug: content.slug })
  if (namespace) {
    return handleRequest({ error: 'A namespace with that slug already exists.' }, { status: 400 });
  }

  // submit
  let record = collection.insert(content)

  // database
  await save(key)

  return handleRequest(record)
})

// UPDATE existing item in the collection
router.put('/:id', withContent, async ({ params, content}) => {
  let key = `namespaces`
  
  // database
  await download(key)

  // fetch
  let record = collection.findOne({ id: params.id })
  console.log('fetch', record)
  if (!record) {
    return handleRequest({ error: 'A namespace with that id does not exist.' }, { status: 404 });
  }

  // update
  record.slug = content.slug || record.slug
  console.log('update', record)
  
  // check requirements
  if (record.slug) {
    // only if slug is being changed
    let namespace = collection.findOne({ slug: record.slug })
    if (namespace && namespace.id !== params.id) {
      return handleRequest({ error: 'A namespace with that slug already exists.' }, { status: 400 });
    }
  }
  
  // submit
  collection.update(record)

  // database
  await save(key)

  return handleRequest(record)
})

// DELETE an item from collection
router.delete('/:id', async ({ params }) => {
  let key = `namespaces`
  
  // database
  await download(key)

  // submit
  collection.findAndRemove({ id: params.id })

  // database
  await save(key)

  return handleRequest(null)
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
