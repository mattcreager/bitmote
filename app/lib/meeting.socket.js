
/**
 * Module dependencies
 */

var _          = require('lodash')
   ,models     = require('../models')
   ,async      = require('async')
   ,meetingIds = [];

/**
 * Socket.io Meeting Adapter
 * 
 * This adapter centralizes the socket setup, configuration & events in BitMote
 * @param {Object} meeting
 */

var create = exports.create = function (meeting) {
    
    // If a channel has been established for this meeting
    // lets not create another
    if ( _.indexOf(meetingIds, meeting.id) >= 0 ) { return }

    // New meetings are added to our Meeting ID container
    meetingIds.push( meeting.id )

    // A seperate channel is established for each meeting
    var MeetingSocket = require('../lib/sockets').server
        .of('/meeting/' + meeting.id)
        .on('connection', function (socket) {

            // Create a new Mote & return the meetings ID
            // TODO: temp_id -> cID
            socket.on('mote:create', function (data, callback) {

                // TempID is a Client ID
                var temp_id = data.temp_id,
                    mote = new models.Mote(_.omit(data, 'temp_id'))
                    mote.save()
                    mote.on('mote:saved', function(mote) {
                        socket.emit('mote:saved', {id: mote.id, temp_id: temp_id})
                        socket.broadcast.emit('mote:new', {mote: mote.props})
                    })

            })

            // Update an existing Mote
            socket.on('mote:update', function (data, callback) {    
                var clean_data = _.omit(data, ['temp_id', 'id'])
                var mote = models.Mote.fetch(data.id, function (err, mote) {
                    mote.set(clean_data)
                    mote.save()
                    mote.on('mote:updated', function(mote) {
                            socket.emit('mote:updated', {success: true})
                            socket.broadcast.emit('mote:changed', mote.props)
                        })
                })
            })

            // Update an existing Meeting
            socket.on('meeting:update', function (data, callback) {
                meeting.set(data)
                meeting.save()
                meeting.once('meeting:updated', function (meeting) {
                    socket.emit('meeting:updated', { success: true })
                    socket.broadcast.emit('meeting:changed', meeting.props)
                })
            })

            // Update an existing User
            socket.on('user:update', function (data, callback) {
                models.User.fetch(data.id, function (err, user) {
                    user.on('user:updated', function (user) {
                        socket.broadcast.emit('user:updated', user.props)
                    })
                    user.set(data)
                    user.save()
                })
            })

            socket.on('user:joined', function (data) {

                models.User.fetch(data.user, function (err, user) {
                    meeting.once('meeting:newUser', function (user) {
                        socket.broadcast.emit('meeting:newUser', { user: user.props })
                    })

                    meeting.addAttendee(user)
                })

            })

            socket.on('bootstrap', function (data) {
                async.parallel({
                    // Fetch individual meeting motes (rows)
                    motes: function (callback) {
                        meeting.getMotes(callback)
                    },
                    // Fetch meeting attendeeds
                    attendees: function (callback) {
                        meeting.getAttendees(callback)
                    },
                    // Fetch the user model of the meeting host
                    host: function (callback) {
                        models.User.fetch(meeting.get('host'), callback)
                    },
                    // Fetch the user model of the current user
                    user: function (callback) {
                        models.User.fetch(data.user.id, callback)
                    }
                }, 
                function (err, results) {
                    if (err) console.log(err)

                    var motes     = []
                      , attendees = []

                    _.each(results.motes, function(mote) {
                        motes.push(mote.props);
                    })

                    _.each(results.attendees, function(attendee) {
                        attendees.push(attendee.props);
                    })

                    // Send the client the latest data to bootstrap everything on the page with
                    socket.emit('bootstrap:data', {
                        meeting  : meeting.props, 
                        user     : results.user.props,
                        host     : results.host.props,
                        motes    : motes,
                        attendees: attendees
                    });
                }
            )
        })  
    }) //--  on('connection', function (socket) { --//
}