var events = require('events'),
	util   = require('util'),
	_	   = require('lodash')

exports = module.exports = Model

function Model () {

	events.EventEmitter.call(this)

	var self = this

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
		console.log('model save called')
		self.emit('model:saved', 'hah')
	}
}

util.inherits(Model, events.EventEmitter)