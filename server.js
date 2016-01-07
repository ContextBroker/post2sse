#!/usr/bin/env node

var http = require('http')

var minimist = require('minimist')

var post2sse = require('./index.js')


var args = minimist(process.argv.slice(2),
{
  string: 'hostname',
  default:
  {
    hostname: '0.0.0.0',
    port: 0
  }
})

http.createServer(post2sse()).listen(args.port, args.hostname, function()
{
  process.stdout.write(JSON.stringify(this.address().port))
})
