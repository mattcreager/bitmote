
/**
 * Module dependencies
 */

var app    = require('./express.setup.js')       /* Express Configuration */
   ,routes = require('./routes')(app)            /* Bind Routes */
   ,server = require('http').createServer(app)   /* Server Instance */

/**
 * Socket.io is Instantiated
 */

require('./lib/sockets').create(server)

/**
 * Listener Starts
 */

server.listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'))
})