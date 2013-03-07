/**
 * Module dependencies
 */

var controllers = require('./controllers')  /*  Load Controllers  */

/**
 * Every app route is defined here, users are directed to
 * what 'we hope' is an appropriate controller
 * @param {Object} app
 */

exports = module.exports = function (app) {
	
    // New BitMote meeting landing page (Host)
	app.get('/', controllers.home.landing)

    // Join a BitMote meeting landing page (Guest)
    app.all('/join/:meeting_id', controllers.home.join)

    // Creates a new meeting
	app.get('/start', controllers.meeting.start)

    // Primary meeting page
	app.get('/m/:meeting_id', controllers.meeting.main)

}