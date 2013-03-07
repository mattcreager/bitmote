var _ = require('lodash'),
	models = require('../models')

var meetingIds = [];

exports.create = function ( meeting ) {
	
	if ( _.indexOf(meetingIds, meeting.id) >= 0 ) { return }

	meetingIds.push( meeting.id )

	var blam = require('../lib/sockets').server
		.of('/meeting/' + meeting.id)
		.on('connection', function (socket) {

	        // CREATE NEW MOTE FOR THIS MEETING
			socket.on('mote:create', function (data, callback) {

	            var temp_id = data.temp_id
	                mote = new models.Mote(_.omit(data, 'temp_id'))
	                mote.save()
	                mote.on('mote:saved', function(mote) {
	                    socket.emit('mote:saved', {
	                        id: mote.id, temp_id: temp_id
	                    })
	                })
	            //meeting.add(mote)

			})

			socket.on('mote:update', function (data, callback) {
				var mote = models.Mote.fetch(data.id, function(err, mote) {
	                data = _.omit(data, ['temp_id', 'id'])
	                mote.set(data)
	                mote.save()
	                mote.on('mote:updated', function(mote) {
	                        socket.emit('mote:updated', {success: true})
	                    })
	            })
			})

			socket.on('meeting:update', function (data, callback) {
				meeting.set(data)
				meeting.save()
				meeting.on('meeting:updated', function (meeting) {
					socket.emit('meeting:updated', { success: true })
				})
			})

            socket.on('user:update', function (data, callback) {
             
                models.User.fetch(data.id, function(err, user) {
                    user.set(data)
                    user.save()
                    user.on('user:updated', function (user) {
                        socket.emit('user:updated', { success: true })
                    })
                })
                
            })

		  });
}