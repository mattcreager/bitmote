var controllers = require('./controllers')

exports = module.exports = function (app) {
	
	app.get('/', controllers.home.index)
	
}