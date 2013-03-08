
/**
 * Module dependencies
 */

var async  = require('async') 
   ,_      = require('lodash')
   ,models = require('../models')
   ,mSock  = require('../lib/meeting.socket')


/**
 * Forwards the host to a meeting which is created
 * @req {Object} Request
 * @res {Object} Response
 */

var start = exports.start = function (req, res) {
    
    // Check if the user has an outstanding session
    var newUser = _.isUndefined(req.cookies.bmsession) ? true : false

    async.waterfall([

        /**
         * Forwards the host to a meeting which is created
         * @req {Function} Callback
         */

        function (callback) { 

            if ( newUser ) {
                // Pay forward a new user
                var user = new models.User()
                    user.save()
                callback(null, user);
            } else {
                // Pay forward a current user
                models.User.fetch(req.cookies.bmsession, callback)
            }         

        },

        /**
         * Forwards the host to a meeting which is created
         * @req {Object} User Model
         */

        function (user, callback) {

            // Set/Refresh the users session
            res.cookie('bmsession', user.id, { expires: new Date(Date.now() + 90000000000) })

            // Create and persist the meeting
            var meeting = new models.Meeting()
                meeting.set({ 'host' : user.id })
                meeting.save()

            // Add the meeting to our meeting sockets
            mSock.create(meeting)

            // Direct the user to our shiny new meeting
            res.redirect('m/' + meeting.id)

            // The waterfall ends
            callback(null)
        }
    ])
}

/**
 * Main meeting view
 * @req {Object} Request
 * @res {Object} Response
 */

var main = exports.main = function (req, res) {

    // Direct users without a session to join
    if ( _.isUndefined(req.cookies.bmsession) ) return res.redirect('join/' + req.param('meeting_id'))

    // Returns a meeting model for the current meeting
    models.Meeting.fetch(req.param('meeting_id'),

        /**
         * Fetch and render our meeting
         * @req {Object} err
         * @res {Object} Meeting Model
         */

        function (err, meeting) {

            async.parallel({
                // Fetch the user model of the meeting host
                host: function (callback) {
                    models.User.fetch(meeting.get('host'), callback)
                },
                // Fetch the user model of the current user
                user: function (callback) {
                    models.User.fetch(req.cookies.bmsession, callback)
                }
            },

            function (err, results) {
                if (err) console.log(err)

                // Kick the user to the join page if they aren't the host and have no name
                if (results.user.get('id') != results.host.get('id') && results.user.get('name') === '') {
                    res.redirect('join/' + req.param('meeting_id'))
                }

                // Ensure we have a channel associated with this meeting
                mSock.create(meeting)

                // Render our main template and bootstraps our model properties
                res.render('host', {
                    strap : JSON.stringify({
                        meeting : meeting.props, 
                        user: results.user.props,
                        host: results.host.props
                    })
                }) 
            })
        })

}