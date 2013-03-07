var models = require('../models'),
	_ 	   = require('lodash'),
	mSock  = require('../lib/meeting.socket'),
	async  = require('async')

exports.start = function (req, res) {
	
	var userlikenew = _.isUndefined(req.cookies.bmsession) ? true : false

	async.waterfall([
	    function(callback){

	        if ( userlikenew ) {
	    		var user = new models.User()
	    			user.save()
	    		callback(null, user);
	        } else {
	        	models.User.fetch(req.cookies.bmsession, callback)
	        }	      

	    },
	    function(user, callback){

	    	res.cookie('bmsession', user.id, { expires: new Date(Date.now() + 90000000000) })

	    	var meeting = new models.Meeting()
	    		meeting.set({'host' : user.id})
				meeting.save()

			mSock.create(meeting)

			res.redirect('m/' + meeting.id)
	       
	        callback(null, 'two');
	    }
	])
}

exports.host = function (req, res) {

	if (_.isUndefined(req.cookies.bmsession)) return res.redirect('j/' + req.param('meeting_id'))

	models.Meeting.fetch(req.param('meeting_id'), function(err, meeting) {

		async.parallel({
			motes: function (callback) {
				meeting.getMotes(callback)
			},
			host: function (callback) {
				models.User.fetch(meeting.get('host'), callback)
			},
			user: function (callback) {
				models.User.fetch(req.cookies.bmsession, callback)
			}
		},

		function (err, results) {

			//results.user.props.agree = [];

			mSock.create(meeting)

			res.render('host', {
				strap : JSON.stringify({
					meeting : meeting.props, 
					user: results.user.props,
					host: results.host.props,
					motes: results.motes
				})
	        }) 
		})
	})

}