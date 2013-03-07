var io = require('socket.io'),
	server;

exports.create = function (app) {
	exports.server = io.listen(app)
}