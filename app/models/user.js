

var Model = require('../lib/model.js'),
	util  = require('util')

exports = module.exports = User

function User () {
	
	var self = this
	Model.call(this)

	this.save = function () {
		console.log('user save called')
		self.emit('model:saved', 'hell world')
	}
}

util.inherits(User, Model)