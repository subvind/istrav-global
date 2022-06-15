import { Router } from 'itty-router'
import {
  json,
  missing,
  withContent,
} from 'itty-router-extras'

// You will need some super-secret data to use as a symmetric key.
const te = new TextEncoder();
const passwordKeyData = te.encode(LICENSE_KEYS_PASSWORD || 'worker only password symmetric key data');
const secret = LICENSE_KEYS_SECRET || 'between worker and backend'
console.log('passwordKeyData', passwordKeyData)
console.log('secret', secret)

// Convert a ByteString (a string whose code units are all in the range
// [0, 255]), to a Uint8Array. If you pass in a string with code units larger
// than 255, their values will overflow.
function byteStringToUint8Array(byteString) {
  console.log('byteString', byteString)
  return Uint8Array.from(byteString, c => c.charCodeAt(0))
}

// It is crucial to pad the input data, for example, by adding a symbol
// in-between the two fields that can never occur on the right side. In this
// case, use the @ symbol to separate the fields.
function toData(licenseKeyId, expiry) {
  return `${licenseKeyId}@${expiry}`
}

// now let's create a router (note the lack of "new")
const router = Router()

// POST an item verify generated license key
router.post('/verify', withContent, async ({ params, content }) => {
  // Make sure you have the minimum necessary body parameters.
  if (!content.id) {
    return handleRequest({ reason: 'Missing "id" body parameter' }, { status: 403 });
  }
  if (!content.mac) {
    return handleRequest({ reason: 'Missing "mac" body parameter' }, { status: 403 });
  }
  if (!content.expiry) {
    return handleRequest({ reason: 'Missing "expiry" body parameter' }, { status: 403 });
  }

  const key = await crypto.subtle.importKey(
    'raw',
    passwordKeyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  console.log('key', JSON.stringify(key, null, 2))

  // Extract the query parameters we need and run the HMAC algorithm on the
  // parts of the request we are authenticating: the path and the expiration
  // timestamp.
  const expiry = Number(content.expiry);
  console.log('expiry', expiry)
  const dataToAuthenticate = toData(content.id, expiry);
  console.log('dataToAuthenticate', dataToAuthenticate)

  // The received MAC is Base64-encoded, so you have to go to some trouble to
  // get it into a buffer type that crypto.subtle.verify() can read.
  const receivedMacBase64 = content.mac
  console.log('receivedMacBase64', receivedMacBase64)
  const receivedMac = byteStringToUint8Array(atob(receivedMacBase64));
  console.log('receivedMac', receivedMac)

  // Use crypto.subtle.verify() to guard against timing attacks. Since HMACs use
  // symmetric keys, you could implement this by calling crypto.subtle.sign() and
  // then doing a string comparison -- this is insecure, as string comparisons
  // bail out on the first mismatch, which leaks information to potential
  // attackers.
  const encoder = new TextEncoder();
  const verified = await crypto.subtle.verify(
    'HMAC',
    key,
    receivedMac,
    encoder.encode(dataToAuthenticate)
  );
  console.log('verified', verified)

  let status = 200
  let reason = 'A request was made.'
  let valid = true
  if (!verified) {
    reason = 'Invalid License Key'
    status = 403
    valid = false
  }

  if (Date.now() > expiry) {
    reason = `License Key expired at ${new Date(expiry)}`;
    status = 403
    valid = false
  }

  // you have verified the MAC and expiration time; you can now pass the request
  // through.
  let res = {
    id: content.id,
    genuine: dataToAuthenticate,
    valid: valid,
    mac: receivedMacBase64,
    expiry: expiry,
    reason: reason
  }

  return handleRequest(res, { status });
})

// POST an item to generate license key
router.post('/generate', withContent, async ({ params, content }) => {
  // Make sure you have the minimum necessary body parameters.
  if (!content.id) {
    return handleRequest({ reason: 'Missing "id" body parameter' }, { status: 403 });
  }
  if (!content.secret) {
    return handleRequest({ reason: 'Missing "secret" body parameter' }, { status: 403 });
  }

  const key = await crypto.subtle.importKey(
    'raw',
    passwordKeyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  console.log('key', key)

  // Signed requests expire after one minute. Note that you could choose
  // expiration durations dynamically, depending on, for example, the path or a query
  // parameter.
  const expirationMs = 60000;
  const expiry = Number(Date.now() + expirationMs);
  console.log('expiry', expiry)

  // The signature will be computed for the pathname and the expiry timestamp.
  // The two fields must be separated or padded to ensure that an attacker
  // will not be able to use the same signature for other pathname/expiry pairs.
  // The @ symbol is guaranteed not to appear in expiry, which is a (decimal)
  // number, so you can safely use it as a separator here. When combining more
  // fields, consider JSON.stringify-ing an array of the fields instead of
  // concatenating the values.
  const dataToAuthenticate = toData(content.id, expiry);
  console.log('dataToAuthenticate', dataToAuthenticate)

  // only sign if the secret between this worker and the server match
  if (content.secret !== secret) {
    return handleRequest({ reason: 'Invalid "secret" parameter' }, { status: 401 });
  }

  const encoder = new TextEncoder();
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(dataToAuthenticate));
  console.log('mac', mac)

  // `mac` is an ArrayBuffer, so you need to make a few changes to get
  // it into a ByteString, and then a Base64-encoded string.
  const base64Mac = btoa(String.fromCharCode(...new Uint8Array(mac)));
  console.log('base64Mac', base64Mac)

  let res = {
    id: content.id,
    genuine: dataToAuthenticate,
    valid: true,
    mac: base64Mac,
    expiry: expiry,
    reason: 'A request was made.'
  }

  return handleRequest(res);
})

// for everything else
router.all('*', () => new Response('https://global.trabur.workers.dev'))

// attach the router "handle" to the event handler
addEventListener('fetch', event => {
  event.respondWith(router.handle(event.request))
})

function handleRequest(body, init) {
  body = JSON.stringify(body)
  console.log('body', body)

  return new Response(body, {
    ...init,
    headers:  {
      'content-type': 'application/json;charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,HEAD,OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Max-Age': '86400',
    },
  })
}
