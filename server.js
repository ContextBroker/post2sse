#!/usr/bin/env node

var http = require('http')
var URL  = require('url')

var concat    = require('concat-stream')
var minimist  = require('minimist')
var SSEClient = require('sse').Client


var clients = {}


/**
 * Register new client
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {*} id
 */
function registerClient(req, res, id)
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
 * Process incoming requests
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function requestListener(req, res)
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
      if(!client) return registerClient(req, res, id)

      // Client ID already being used
      res.statusCode = 409
    break

    // notifications from ContextBroker
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


//
// Start server
//

var args = minimist(process.argv.slice(2),
{
  string: 'hostname',
  default:
  {
    hostname: '0.0.0.0',
    port: 0
  }
})

http.createServer(requestListener).listen(args.port, args.hostname, function()
{
  process.stdout.write(JSON.stringify(this.address().port))
})
