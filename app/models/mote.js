
/**
 * Module dependencies
 */

var Model = require('../lib/model.js')
   ,util  = require('util')
   ,_     = require('lodash')
   ,moment = require('moment')
   ,async = require('async')

/**
 * Export Our Mote Contructor
 */

exports = module.exports = Mote


/**
 * Meeting Constructor (Look Familiar?)
 * @param {Object} Attributes
 * @param {String} UID
 */

function Mote (attributes, uid) {

    // Super Constructor
    Model.call(this)

    // Local references
    var self       = this,
        attributes = _.isEmpty(attributes) ? {} : attributes,
        defaults   = {
            meeting_id: '', // foreign key meeting id
            created: moment().toJSON(),
            body: '',    // message body
            type: '' // action, info or decision
        }

    // Merge supplied attributes with User defaults
    self.props = _.defaults(attributes, defaults)

    // Save mutiple references to the Meeting ID
    self.id = self.props.id = uid || undefined

    /**
     * Save the Mote Model
     * TODO: Yup needs a refactor too
     */

    this.save = function () {

        // Store the status of this Mote
        var isNew = self.isNew()

        async.waterfall([

            /**
             * Generate or return the UID
             * @param {Function} callback
             */
            function (callback) {
                if ( isNew ) {
                    self.genID('mote:id', callback)
                } else {
                    callback(null, self.id)
                }
            },

            /**
             * Add the Meeting to our Redis List
             * @param {Int}      ID
             * @param {Function} callback
             */
            function (id, callback) {

                // Update our Motes ID
                self.id = self.props.id = '' + id

                if ( isNew ) {
                    self.redis.RPUSH('meeting:' + self.props.meeting_id + ':motes', id)
                }

                self.redis.DEL('mote:' + id + ':consensus', 0, -1)

                _.each(self.props.agree, function (uid) {
                    self.redis.SADD('mote:' + id + ':consensus', uid)
                })

                // Filter our Properties
                var clean_props = _.pick(self.props, ['meeting_id', 'type', 'body', 'created'])
                
                // Save them
                self.redis.HMSET('mote:' + self.id, clean_props, callback)
            }
        ],
        // Should be modified to include a callback
        function(err, results){
            if ( err ) {
                console.error( err )
            } else {
                if ( isNew ) {
                    self.emit('mote:saved', self)
                } else {
                    self.emit('mote:updated', self)
                }
            }
        })
        return self
    }

}

// Inherit from our Model
util.inherits( Mote, Model )

// Mote Factory
_.assign(Mote, {

    /**
     * Return a Meeting Model
     * @param {Int}      ID
     * @param {Function} callback
     */

    fetch : function(id, callback) {
        async.parallel({
            mote: function (callback) {
                Model.redis.HGETALL('mote:' + id, callback)
            },
            agrees: function (callback) {
                Model.redis.SMEMBERS('mote:' + id + ':consensus', callback)
            }
        },
        function (err, results) {
            results.mote.agree = results.agrees || []
            callback(err, new Mote(results.mote, id))
            /**
            mote.attributes.agree = results.agrees
            callback(null, new Mote(attributes, id))
            **/
        })
        
    }
})