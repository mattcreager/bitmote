var controllers = require('./controllers')

exports = module.exports = function (app) {
	
	app.get('/', controllers.home.landing)

	app.get('/start', controllers.meeting.start)

	app.get('/m/:meeting_id', controllers.meeting.host)

}