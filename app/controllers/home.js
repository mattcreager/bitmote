var models = require('../models')

exports.index = function (req, res, next) {
	var user = new models.User()

	user.on('model:saved', function() { console.log('woot')})
	user.save()

	var met = {};
	models.Meeting.fetch('m_SRX8jw7', function(meeting){
		console.log('meeting callback')
		meeting.get('subject', function(attributes){
			console.log(attributes)
		})
	})
	
	//var meeting = new models.Meeting({subject: 'Awesome'})
	//meeting.save()
	//meeting.get()
	res.render('home')
}

// Does a meeting exist