
/**
 * Module dependencies
 */

var Model = require('../lib/model.js')
   ,util  = require('util')
   ,_     = require('lodash')
   ,moment = require('moment')

/**
 * Export Our User Model Contructor
 */

exports = module.exports = User

/**
 * User Model Constructor
 * @param {Object} Attributes
 * @param {String} UID
 */

function User (attributes, uid) {

    // Super Constructor
    Model.call(this)

    // Local references
    var self = this,
        attributes = _.isEmpty(attributes) ? {} : attributes,
        defaults = { name: '', email: '' }

    // Merge supplied attributes with User defaults
    self.props = _.defaults(attributes, defaults)

    // Save mutiple references to the User ID
    self.id = self.props.id = uid || this.genHash(11)

    /**
     * Save the user Model
     * TODO:  Refactor me oh please god refactor me
     */

    this.save = function () {
        var props = _.omit(self.props, ['id', 'temp_id'])
        self.redis.HMSET('user:' + self.id, props)
        self.emit('user:updated', self)
    }

}

// Inherit from our base Model
util.inherits(User, Model)

// User Factory
_.assign(User, {
    fetch : function (id, callback) {
        console.log('Fetching User with ID ' + id + ' from Redis')
        Model.redis.hgetall('user:' + id, function (err, attributes) {
            callback(null, new User(attributes, id))
        })
    }
})