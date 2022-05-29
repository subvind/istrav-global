addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  // personal access token
  let token = GITHUB_PAT + GITHUB_PAT2
  let org = 'trabur'
  let endpoint = `https://api.github.com/users/${org}/repos`;
  const init = {
    headers: {
      'User-Agent': 'trabur',
      'Authorization': `token ${token}`,
      'content-type': 'application/json;charset=UTF-8',
    },
  };

  console.log('token', token)

  const response = await fetch(endpoint, init);
  const content = await response.text();

  return new Response(content, {
    headers:  {
      'content-type': 'application/json;charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,HEAD,OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Max-Age': '86400',
    },
  })
}
