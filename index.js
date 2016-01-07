var URL = require('url')

var concat    = require('concat-stream')
var SSEClient = require('sse').Client


/**
 * Register new client
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {Object} clients
 * @param {*} id
 */
function registerClient(req, res, clients, id)
{
  var client = new SSEClient(req, res)
  client.on('close', function()
  {
    delete clients[id]
  })
  client.initialize()

  clients[id] = client
}

/**
 * Forward the notification to the client
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {SSEClient} client
 */
function fordwardNotification(req, res, client)
{
  req.pipe(concat(function(body)
  {
    client.send(body.toString())
    res.end()
  }))
}


/**
 *
 */
function post2sse()
{
  var clients = {}


  /**
   * Process incoming requests
   *
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   */
  return function(req, res)
  {
    var id = URL.parse(req.url).pathname.substr(1)
    if(!id)
    {
      res.statusCode = 403
      return res.end()
    }

    var client = clients[id]

    switch(req.method)
    {
      // SSE EventSource registrations
      case 'GET':
        // Register new client
        if(!client) return registerClient(req, res, clients, id)

        // Client ID already being used
        res.statusCode = 409
      break

      // Incoming notifications
      case 'POST':
        // Forward the notification to the client
        if(client) return fordwardNotification(req, res, client)

        // Client not found
        res.statusCode = 404
      break

      // Unknown method
      default:
        res.statusCode = 405
    }

    // There was an error with the request, close connection inmediatly
    res.end()
  }
}


module.exports = post2sse
