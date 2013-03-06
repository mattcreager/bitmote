var models = require('../models'),
	_ 	   = require('lodash')

exports.start = function (req, res) {

	var meeting = new models.Meeting()
		meeting.save()

	meeting.get(function(attr) {

		if ( _.isUndefined(req.cookies.bmsession) ) {
			res.cookie('bmsession', attr.host, { maxAge: 900000 })
		}
		
		res.redirect('m/' + meeting.id)
	})
	
}

exports.host = function (req, res) {

	console.log(req.param('meeting_id'))
	models.Meeting.fetch(req.param('meeting_id'), function (meeting) {
		console.log(meeting.props)
		res.render('host')
	})	

	var user_host = req.cookies.bmsession
	//res.send(user_host)

}