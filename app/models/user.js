var Model = require('../lib/model.js'),
	util  = require('util'),
	_	  = require('lodash'),
	moment = require('moment')

exports = module.exports = User

function User (attributes, uid) {

	Model.call(this)

	var self = this,
		attributes = _.isEmpty(attributes) ? {} : attributes
		defaults = {
			name: '',
			email: ''
		}


	self.props = _.defaults(attributes, defaults)
	self.id = self.props.id = uid || this.generateUID(11)

	this.set  = function (attributes) {
        self.props = _.defaults(attributes, self.props)
        return self
    }

	this.save = function () {
		var props = _.omit(self.props, ['id', 'temp_id'])
		self.redis.HMSET('user:' + self.id, props)
		self.emit('user:updated', self)
	}

	this.get = function (attribute, callback) {
		var callback = _.isFunction(attribute) ? attribute : callback
		var attr 	 = _.isEmpty(attribute) ? self.props : self.props[attribute]
		callback(attr)
	}
}

util.inherits(User, Model)

_.assign(User, {
	fetch : function(id, callback) {
		console.log('Fetching User with ID ' + id + ' from Redis')
		Model.redis.hgetall('user:' + id, function (err, attributes) {
		    callback(null, new User(attributes, id))
		})
	}
})