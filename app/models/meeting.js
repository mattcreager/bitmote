var Model = require('../lib/model.js'),
	util  = require('util'),
	_	  = require('lodash'),
	redis = require('redis'),
	moment = require('moment')

var client = redis.createClient()

client.on("error", function (err) {
    console.log("Error " + err);
});

client.on("ready", function() {
	console.log('redis firing up')
})

exports = module.exports = Meeting

function Meeting (attributes, uid) {

	Model.call(this)

	var self = this,
		attributes = _.isEmpty(attributes) ? {} : attributes
		defaults = {
			host: this.generateUID(11),
			subject: 'A Meeting with no Subject',
			started: moment().toJSON()
		}

	self.id = uid || this.generateUID() 

	self.props = _.defaults(attributes, defaults)

	this.save = function () {
		console.log(self.props)
		console.log(self.id)
		client.HMSET('meeting:' + self.id, self.props)

		self.emit('model:saved', 'hello world')
	}

	this.get = function(attribute, callback) {
		var callback = _.isFunction(attribute) ? attribute : callback
		var attr 	 = _.isEmpty(attribute) ? self.props : self.props[attribute]
		callback(attr)
	}
}

util.inherits(Meeting, Model)

_.assign(Meeting, {
	fetch : function(id, callback) {
		console.log('fetching')
		client.hgetall('meeting:' + id, function (err, attributes) {
			console.log('below is attributes')
		    console.dir(attributes);
		    attributes.start = moment(attributes.started)
		    console.log('below is return')
		    callback(new Meeting(attributes))
		})
	}
})