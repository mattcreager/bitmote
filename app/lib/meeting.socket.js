
/**
 * Module dependencies
 */

var _       = require('lodash')
   ,models  = require('../models')

// Meeting ID container
var meetingIds = [];

/**
 * Socket.io Meeting Adapter
 * 
 * This adapter centralizes the socket setup, configuration & events in BitMote
 * @param {Object} meeting
 */

var create = exports.create = function ( meeting ) {
    
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
                            socket.broadcast.emit('mote:changed', {mote: mote.props})
                        })
                })
            })

            // Update an existing Meeting
            socket.on('meeting:update', function (data, callback) {
                meeting.set(data)
                meeting.save()
                meeting.on('meeting:updated', function (meeting) {
                    socket.emit('meeting:updated', { success: true })
                })
            })

            // Update an existing User
            socket.on('user:update', function (data, callback) {
                models.User.fetch(data.id, function(err, user) {
                    user.set(data)
                    user.save()
                    user.on('user:updated', function (user) {
                        socket.emit('user:updated', { success: true })
                    })
                })
            })

        }) //--  on('connection', function (socket) { --//
}