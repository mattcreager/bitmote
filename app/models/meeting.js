var Model = require('../lib/model.js'),
	util  = require('util'),
	_	  = require('lodash'),
	moment = require('moment'),
	async  = require('async')

exports = module.exports = Meeting

function Meeting (attributes, uid) {

	Model.call(this)

	var self = this,
		attributes = _.isEmpty(attributes) ? {} : attributes
		defaults = {
			host: self.generateUID(11),
			subject: '',
			started: moment().format("YYYY-MM-DD HH:mm:ss")
		}


	self.props = _.defaults(attributes, defaults)
	self.id = self.props.id = uid || this.generateUID()

	this.set  = function (attributes) {
        self.props = _.defaults(attributes, self.props)
        return self
    }

	this.save = function () {
		var props = _.omit(self.props, ['id', 'agree'])
		self.redis.HMSET('meeting:' + self.id, props)
		self.emit('meeting:updated', self)
	}

	this.get = function (attribute, callback) {
		var callback = _.isFunction(attribute) ? attribute : callback
		var attr 	 = _.isEmpty(attribute) ? self.props : self.props[attribute]
		return attr
	}

	this.getMotes = function (callback) {

		async.waterfall([
		    function(callback){
		        self.redis.LRANGE('meeting:' + self.id + ':motes', 0, -1, callback)
		    },
		    function(moteIds, callback){
		        var callbacks = []
		        _.each(moteIds, function(id) {
		        	callbacks.push(function(callback){
		        		self.redis.HGETALL('mote:' + id, callback)
		        	});
		        })
		        async.parallel(callbacks, callback)
		    }
		], callback)
	}
}

util.inherits(Meeting, Model)

_.assign(Meeting, {
	fetch : function(id, callback) {
		console.log('Fetching Meeting with ID ' + id + ' from Redis')
		Model.redis.hgetall('meeting:' + id, function (err, attributes) {
		    callback(null, new Meeting(attributes, id))
		})
	}
})