var request = require('supertest')

var post2sse = require('./index.js')


it('fail when using an invalid HTTP method', function(done)
{
  request(post2sse())
    .put('/a')
    .expect(405, done)
})

describe('SSE clients', function()
{
  it('fail when not defined ID', function(done)
  {
    request(post2sse())
      .get('/')
      .expect(403, done)
  })

  xit('register correctly', function(done)
  {
    request(post2sse())
      .get('/a')
      .end(function(err, res)
      {
        console.log(err, res)
      })
//      .expect(/:ok/, done)
  })

  it('fail when trying to register same ID twice', function(done)
  {
    var proxy = post2sse()
    request(proxy)
      .get('/a')
      .end()
    request(proxy)
      .get('/a')
      .expect(409, done)
  })
})

describe('POST notifications', function()
{
  it('fail when not defined ID', function(done)
  {
    request(post2sse())
      .post('/')
      .expect(403, done)
  })

  it('fail when ID is not found', function(done)
  {
    request(post2sse())
      .post('/a')
      .expect(404, done)
  })

  xit('forward correctly a notification', function(done)
  {
    var data =
    {
      asdf: 'qwerty'
    }

    var proxy = post2sse()
    request(proxy)
      .get('/a')
      .expect(':ok')
      .expect('data: '+JSON.stringify(data), done)
    request(proxy)
      .post('/a')
      .send(data)
      .end()
  })
})
