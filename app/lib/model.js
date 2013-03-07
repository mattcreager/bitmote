var events = require('events'),
	util   = require('util'),
	_	   = require('lodash'),
     redis = require('redis')

var client = redis.createClient()

client.on("error", function (err) {
    console.error("Redis experienced the following connection error: " + err)
})

client.on("ready", function() {
    console.info('Redis is ready to kick some ass')
})

exports = module.exports = Model

function Model () {

	events.EventEmitter.call(this)

	var self = this

    self.redis = client

    this.genID = function (key, callback) {
        client.incr(key, function (err, new_id) {
            if (err) {
                console.error(err)
            } else {
                callback(null, new_id)
            }
        })
    }

	this.generateUID = function (length) {

		var length = _.isUndefined(length) ? 7 : length

	    var uid 	 = '',
			possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

	    for ( var i = 0; i < length; i++ ) {
	        uid += possible.charAt(Math.floor(Math.random() * possible.length))
	    }

	    return uid
	}

	this.save = function () {
		console.warning('Child models must override this.save')
	}
}

_.assign(Model, {
    redis : client
})

util.inherits(Model, events.EventEmitter)