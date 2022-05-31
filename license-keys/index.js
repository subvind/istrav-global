/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(body, init) {
  body = JSON.stringify(body)
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

// You will need some super-secret data to use as a symmetric key.
const encoder = new TextEncoder();
const secretKeyData = encoder.encode(PASSWORD || 'my secret symmetric key');
const secret = SECRET

// Convert a ByteString (a string whose code units are all in the range
// [0, 255]), to a Uint8Array. If you pass in a string with code units larger
// than 255, their values will overflow.
function byteStringToUint8Array(byteString) {
  const ui = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; ++i) {
    ui[i] = byteString.charCodeAt(i);
  }
  return ui;
}

async function verifyAndFetch(request) {
  const url = new URL(request.url);

  // Make sure you have the minimum necessary query parameters.
  if (!url.searchParams.has('licenseKey')) {
    return new handleRequest('Missing "licenseKey" query parameter', { status: 403 });
  }
  if (!url.searchParams.has('mac')) {
    return new handleRequest('Missing "mac" query parameter', { status: 403 });
  }
  if (!url.searchParams.has('expiry')) {
    return new handleRequest('Missing "expiry" query parameter', { status: 403 });
  }

  const key = await crypto.subtle.importKey(
    'raw',
    secretKeyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  // Extract the query parameters we need and run the HMAC algorithm on the
  // parts of the request we are authenticating: the path and the expiration
  // timestamp. It is crucial to pad the input data, for example, by adding a symbol
  // in-between the two fields that can never occur on the right side. In this
  // case, use the @ symbol to separate the fields.
  const expiry = Number(url.searchParams.get('expiry'));
  const dataToAuthenticate = `${url.searchParams.get('licenseKey')}@${expiry}`;

  // The received MAC is Base64-encoded, so you have to go to some trouble to
  // get it into a buffer type that crypto.subtle.verify() can read.
  const receivedMacBase64 = url.searchParams.get('mac');
  const receivedMac = byteStringToUint8Array(atob(receivedMacBase64));

  // Use crypto.subtle.verify() to guard against timing attacks. Since HMACs use
  // symmetric keys, you could implement this by calling crypto.subtle.sign() and
  // then doing a string comparison -- this is insecure, as string comparisons
  // bail out on the first mismatch, which leaks information to potential
  // attackers.
  const verified = await crypto.subtle.verify(
    'HMAC',
    key,
    receivedMac,
    encoder.encode(dataToAuthenticate)
  );

  if (!verified) {
    const body = 'Invalid MAC';
    return handleRequest(body, { status: 403 });
  }

  if (Date.now() > expiry) {
    const body = `URL expired at ${new Date(expiry)}`;
    return handleRequest(body, { status: 403 });
  }

  // you have verified the MAC and expiration time; you can now pass the request
  // through.
  let body = {
    mac: receivedMacBase64,
    expiry: expiry,
    valid: true
  }

  return handleRequest(body);
}

async function generateSignedData(request) {
  const url = new URL(request.url);

  // Make sure you have the minimum necessary query parameters.
  if (!url.searchParams.has('licenseKey')) {
    return handleRequest('Missing "licenseKey" query parameter', { status: 403 });
  }
  if (!url.searchParams.has('secret')) {
    return handleRequest('Missing "secret" query parameter', { status: 403 });
  }

  const key = await crypto.subtle.importKey(
    'raw',
    secretKeyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Signed requests expire after one minute. Note that you could choose
  // expiration durations dynamically, depending on, for example, the path or a query
  // parameter.
  const expirationMs = 60000;
  const expiry = Date.now() + expirationMs;
  // The signature will be computed for the pathname and the expiry timestamp.
  // The two fields must be separated or padded to ensure that an attacker
  // will not be able to use the same signature for other pathname/expiry pairs.
  // The @ symbol is guaranteed not to appear in expiry, which is a (decimal)
  // number, so you can safely use it as a separator here. When combining more
  // fields, consider JSON.stringify-ing an array of the fields instead of
  // concatenating the values.
  const dataToAuthenticate = `${url.searchParams.get('licenseKey')}@${expiry}`;

  // only sign if the secret between this worker and the server match
  if (url.searchParams.has('secret') === secret) {
    return handleRequest('Invalid "secret" query parameter', { status: 401 });
  }

  const encoder = new TextEncoder();
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(dataToAuthenticate));

  // `mac` is an ArrayBuffer, so you need to make a few changes to get
  // it into a ByteString, and then a Base64-encoded string.
  const base64Mac = btoa(String.fromCharCode(...new Uint8Array(mac)));

  let body = {
    mac: base64Mac,
    expiry: expiry
  }

  return handleRequest(body);
}

addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/generate')) {
    event.respondWith(generateSignedData(event.request));
  } else if (url.pathname.startsWith('/verify')) {
    event.respondWith(verifyAndFetch(event.request));
  } else {
    event.respondWith(handleRequest("license-keys"));
  }
});