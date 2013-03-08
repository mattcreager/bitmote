
/**
 * Module dependencies
 */

var events = require('events')
   ,util   = require('util')
   ,_      = require('lodash')
   ,redis  = require('redis')

/**
 * Export Our Base Model Contructor
 */

exports = module.exports = Model

// Connect to Redis
var client = redis.createClient()
    
client.on('error', function (err) {
    console.error('Unable to connect to Redis: ' + err)
    console.error('Stopping BitMote, please ensure Redis is running')
    process.abort()
})

/**
 * Model Constructor
 *
 * Includes a variety of helpful abstractions
 */

function Model () {

    // Super constuctor
    events.EventEmitter.call(this)

    // Local references
    var self       = this
        self.redis = client

    /**
     * UID Existence Check
     */

    this.isNew = function () {
        return _.isUndefined(self.id) ? true : false
    }

    /**
     * Update the properties of a Model
     * @param {Object} Attributes
     */
 
    this.set  = function (attributes) {
        self.props = _.defaults(attributes, self.props)
        return self
    }

    /**
     * Return a Model attribute
     * @param {Object} Attributes
     */

    this.get = function (attribute) {

        if ( _.isUndefined(attribute) ) {
            return self.props
        } else {
            return self.props[attribute]
        }
    }

    /**
     * Redis helps us generate a UID
     * @param {String}   key : example 'mote:uid'
     * @param {Function} callback
     */

    this.genID = function (key, callback) {
        client.incr(key, function (err, newId) {
            if (err) {
                console.error('An error was encountered trying to generate an ID: %j', err)
            } else {
                callback(null, newId)
            }
        })
    }

    /**
     * Generate a Hash (example: Q4LVeuc)
     * @param {Int} Length
     */

    this.genHash = function (length) {
        var length   = _.isUndefined(length) ? 7 : length,
            hash     = '',
            possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

        for ( var i = 0; i < length; i++ ) {
            hash += possible.charAt(Math.floor(Math.random() * possible.length))
        }

        return hash
    }

    /**
     * Generate a warning on save
     */

    this.save = function () {
        console.warning('Child models must override this.save')
    }
}

// Easy access to redis
_.assign(Model, { redis : client })

// EventEmitter inheritance
util.inherits(Model, events.EventEmitter)