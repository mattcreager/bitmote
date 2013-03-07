var Model = require('../lib/model.js'),
	util  = require('util'),
	_	  = require('lodash'),
	moment = require('moment'),
    async = require('async')

exports = module.exports = Mote

function Mote (attributes, uid) {
    Model.call(this)

    var self = this,
        attributes = _.isEmpty(attributes) ? {} : attributes
        defaults = {
            meeting_id: '', // foreign key meeting id
            created: moment().toJSON(),
            body: '',    // message body
            type: '' // action, info or decision
        }

    self.props = _.defaults(attributes, defaults)

    self.id = self.props.id = uid || undefined

    this.set  = function (attributes) {
        self.props = _.defaults(attributes, self.props)
        return self
    }

    this.save = function () {

        var motelikenew = _.isUndefined(self.id) ? true : false

        async.waterfall([
            function (callback) {

                if ( motelikenew ) { //need an isNew function or something
                    self.genID('mote:id', callback) //returns a Unique ID
                } else {
                    callback(null, self.id)
                }
            },
            function (id, callback) {
                self.id = self.props.id = '' + id

                if ( motelikenew ) {
                    console.log('are you saving asshole?')
                    // adds the meeting id to a list
                    self.redis.RPUSH('meeting:' + self.props.meeting_id + ':motes', id)
                }


               console.log('agreements not being set yet')

                //console.log(self.props.agree)

                // 'nameone', nametwo, namethree, namefour
                //  nameone, nametwo, namethree

                //agrees = self.props.agree || ['0']                      

                //self.redis.HMSET( 'mote:' + self.id + ':agrees', agrees )

                var props = _.pick(self.props, ['meeting_id', 'type', 'body', 'created'])
                self.redis.HMSET('mote:' + self.id, props, callback)
            }
        ],
        function(err, results){

            if ( err ) {

                console.log( err )

            } else {
                if ( motelikenew ) {
                    self.emit('mote:saved', self)
                } else {
                    self.emit('mote:updated', self)
                }
            }
        })
        return self
    }

    this.get = function (attribute, callback) {
        var callback = _.isFunction(attribute) ? attribute : callback
        var attr     = _.isEmpty(attribute) ? self.props : self.props[attribute]
        callback(attr)
    }
}

util.inherits( Mote, Model )

_.assign(Mote, {
	fetch : function(id, callback) {
		console.log('Fetching Mote with ID ' + id + ' from Redis')
        async.parallel({
            mote: function (callback) {
                Model.redis.hgetall('mote:' + id, callback)
            },
            agrees: function (callback) {
                Model.redis.hgetall('mote:' + id + ':agrees', callback)
            }
        },
        function (err, results) {
            console.log(results)
            results.mote.agree = results.agrees || []
            callback(err, new Mote(results.mote, id))
            /**
            mote.attributes.agree = results.agrees
            callback(null, new Mote(attributes, id))
            **/
        })
		
	}
})