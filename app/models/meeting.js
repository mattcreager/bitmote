
/**
 * Module dependencies
 */

var Model = require('../lib/model.js')
   ,util  = require('util')
   ,_     = require('lodash')
   ,moment = require('moment')
   ,async  = require('async')

/**
 * Export Our User Meeting Contructor
 */

exports = module.exports = Meeting

/**
 * Meeting Constructor
 * @param {Object} Attributes
 * @param {String} UID
 */

function Meeting (attributes, uid) {

    // Super Constructor
    Model.call(this)

    // Local references
    var self       = this,
        attributes = _.isEmpty(attributes) ? {} : attributes,
        defaults   = {
            host:    '',
            subject: '',
            started: moment().format("YYYY-MM-DD HH:mm:ss")
        }

    // Merge supplied attributes with User defaults
    self.props = _.defaults(attributes, defaults)

    // Save mutiple references to the Meeting ID
    self.id = self.props.id = uid || self.genHash()

    /**
     * Save the Meeting Model
     * TODO:  Refactor me oh please god refactor me
     */

    this.save = function () {
        var props = _.omit(self.props, ['id', 'agree'])
        self.redis.HMSET('meeting:' + self.id, props)
        self.emit('meeting:updated', self)
    }

    /**
     * Get meeting Motes
     * @param {Function} callback
     */

    this.getMotes = function (callback) {

        async.waterfall([

            /**
             * Fetch Meeting IDs and Pass them
             * to our callback
             * @param {Function} callback
             */

            function (callback) {
                self.redis.LRANGE('meeting:' + self.id + ':motes', 0, -1, callback)
            },

            /**
             * Now we have our Ids we can get our 
             * Motes in the right order
             * @param {Function} callback
             */

            function (moteIds, callback) {
                var callbacks = []

                // Build a stack of callbacks using each moteID
                _.each(moteIds, function(id) {
                    callbacks.push(function(callback){
                        self.redis.HGETALL('mote:' + id, callback)
                    });
                })

                // Fetch our motes in parallel, oh the wonder of Async?
                async.parallel(callbacks, callback)
            }
        ], callback)
    }
}

// Inherit from our base Model
util.inherits(Meeting, Model)

// Meeting Factory
_.assign(Meeting, {
    fetch : function(id, callback) {
        console.log('Fetching Meeting with ID ' + id + ' from Redis')
        Model.redis.hgetall('meeting:' + id, function (err, attributes) {
            callback(null, new Meeting(attributes, id))
        })
    }
})