var app    = require('./express.setup.js'),
    routes = require('./routes')(app),
	http   = require('http'),
    debug  = require('debug')('info'),
	server = http.createServer(app)

require('./lib/sockets').create(server)

server.listen(app.get('port'), function () {
  debug("Express server listening on port " + app.get('port'))
})

