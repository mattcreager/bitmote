require.config({

  paths : {
    backbone :   window.base_url + 'js/vendor/backbone.min',
    underscore : window.base_url + 'js/vendor/lodash.min',
    'backbone.marionette' : window.base_url + 'js/vendor/marionette.min',
    'backbone.wreqr' : window.base_url + 'js/vendor/backbone.wreqr.min',
    'backbone.eventbinder' : window.base_url + 'js/vendor/backbone.eventbinder.min',
    'backbone.babysitter' : window.base_url + 'js/vendor/backbone.babysitter.min',
    'moment'   : window.base_url + 'js/vendor/moment.min'
  },

  shim : {
    moment : {
        exports: 'moment'
    },
    underscore : {
      exports : '_'
    },
    handlebars : {
        exports: 'Handlebars'
    },
    backbone : {
      deps : ['jquery', 'underscore'],
      exports : 'Backbone'
    },
    'backbone.marionette' : {
      deps : ['jquery', 'underscore', 'backbone', 'backbone.wreqr', 'backbone.eventbinder', 'backbone.babysitter'],
      exports : 'Marionette'
    }
  }
})

require(
    ['backbone.marionette', 'moment'], function (Marionette, moment) {


    Handlebars.registerHelper('type', function(type, value) {
        if ( type == value ) { return "active" }
    })

    Handlebars.registerHelper('youAgree', function(agree) {
        console.log(agree)
        console.log( _.intersection(agree, [window.strap.user.id]).length )
        if ( _.intersection(agree, [window.strap.user.id]).length === 0 ) {
            return "disagree"
        } else {
            return "agree"
        }
    })

    var BitMote = new Backbone.Marionette.Application()

    Backbone.Marionette.Renderer.render = function (template, data) {
        return template(data)
    }


    Backbone.sync = function(method, model, options, error) {
        model.set('temp_id', model.cid)
        socket.emit(this.urlRoot + ':' + method, model.toJSON())
    }

    var User = Backbone.Model.extend({
        urlRoot: 'user',
        initialize: function() {
            // stuff
        },
        defaults: {
            name: '',
            email: ''
        }
    })

    var Meeting = Backbone.Model.extend({
        urlRoot: 'meeting',
        initialize: function() {
        //do stuff
        },
        defaults: {
            subject: 'Untitled Meeting',
            started:  '',
            attendees: ''
        }
    })

    var Mote = Backbone.Model.extend({
        urlRoot: 'mote',
        initialize: function() {
        //do stuff
        },
        defaults: {
            meeting_id: window.strap.meeting.id,
            agree: [],
            type:  '',
            body:  ''
        }
    })

    var Minutes = Backbone.Collection.extend({
        model: Mote
    })

    var HostView = Backbone.Marionette.ItemView.extend({
        initialize: function () {
            this.renderHost()
        },
        el: '.meta',
        events: {
            'blur #meeting-host' : 'changeHost'
        },
        changeHost: function (event) {
            var host = $(event.target).val()

            var parts = host.match(/(.*?) <(.*?)>/)

            if ( parts && parts.length === 3 ) {
                this.model.set({name: parts[1], email: parts[2]})
            } else {
                this.model.set({name: host, email: ''})
            }
            this.model.save()
        },
        renderHost: function () {

            var host = this.model.get('name')

            if ( ! _.isEmpty(this.model.get('email') ) ) {
                host += ' <' + this.model.get('email') + '>'
            }

            this.$el.find('#meeting-host').val(host)
        }
    })

    var MeetingView = Backbone.Marionette.ItemView.extend({
        initialize: function () {
            this.render()
            setInterval(this.updateStarted.bind(this), 60000)
        },
        el: 'body',
        events: {
            'keyup #meeting-title' : 'changeSubject',
            'change #meeting-title' : 'changeSubject',
            'blur #meeting-time'  : 'changeTime',
            'focus #meeting-time'  : 'changeTimeFormat',
            'click .close-modal, #share-meeting' : 'toggleModal'
        },
        toggleModal:  function (event) {
            this.$el.find('.modal').toggle()
            this.$el.find('.modal-backdrop').toggle()
        },
        changeSubject: function (event) {
            var subject = $(event.target).val()
            this.model.set('subject', subject)
            this.model.save()
        },
        changeTime: function(event) {
            var started = moment($(event.target).val())
            $(event.target).val(moment(started).fromNow())
            this.model.set('started', started.format("YYYY-MM-DD HH:mm:ss"))
            this.model.save()
        },
        changeTimeFormat: function(event) {
            var started = this.model.get('started')
            $(event.target).val(started)
        },
        updateStarted: function () {
            var started = moment(this.model.get('started')).fromNow()
            this.$el.find('#meeting-time').val(started)
        },
        render: function () {
            var link = "http://www.bitmote.com/g/" + this.model.get('id')
            this.$el.find('#share-link').text(link)
            this.$el.find('#meeting-title').val(this.model.get('subject'))
            this.updateStarted()
        }
    })

    var MoteView = Backbone.Marionette.ItemView.extend({
        tagName: 'tr',
        initialize: function () {
            this.listenTo(this.model, 'change:type', this.updateTypeView)
        },
        template: Handlebars.templates.mote_row,
        /*triggers: {
            'click .agree' : 'user:consensus'
        },*/
        events: {
            'click .agree, .disagree' : 'toggleAgree',
            'click .type' :  'changeType',
            'keyup textarea' : 'quickChangeBody',
            'change textarea': 'changeBody'
        },
        changeType: function (event) {
            event.preventDefault()
            var mote_type = $(event.target).data('type')
            console.log('mote_type')
            this.model.set('type', mote_type)
            console.log(this.model)
            this.model.save()
        },
        quickChangeBody: function (event) {
            var space = 32;

            // Add throttling
            if (event.keyCode === space) {
                var mote_body = $(event.target).val()
                this.model.set('body', mote_body)
                this.model.save()
            }
        },
        changeBody: function (event) {
            var mote_body = $(event.target).val()
            this.model.set('body', mote_body)
            this.model.save()
        },
        toggleAgree: function (event) {

            if ( ! _.isArray(this.model.attributes.agree) ) {
                this.model.attributes.agree = []
            }

            var element = $(event.target)

            if ( element.data('agree') === 'yes' ) {
                element.data('agree', 'no')
                element.removeClass('agree')
                element.addClass('disagree')
                this.model.attributes.agree = _.without(this.model.attributes.agree, window.strap.user.id)
            } else {
                element.data('agree', 'yes')
                element.removeClass('disagree')
                element.addClass('agree')
                this.model.attributes.agree.push(window.strap.user.id)
            }

            this.model.save()

        },
        updateTypeView: function (model, collection) {
            var elements = $(this.el).find('.type-cell')
            elements.find('a').removeClass('active')
            elements.find('a[data-type="' + model.get('type') + '"]').addClass('active')
        }
    })

    var MinutesTable = Backbone.Marionette.CollectionView.extend({
        tagName: 'tbody',
        itemView: MoteView,
        emptyView: MoteView
    })

    BitMote.addRegions({
        Host:    '.meta',
        Meeting: '.meeting-container',
        Minutes: '#minutes-table',
        Actions: '#meeting-actions'
    })

    BitMote.addInitializer( function() {
        // Get hte motes that were bootstrapped to the application
        var motes = []

        _.each(window.strap.motes, function(mote) {
            motes.push(new Mote(mote))
        })

        // Always make a new mote available to enter notes in
        motes.push(new Mote())

        // Initialize our mote collection
        BitMote.minutes_collection = new Minutes(motes)

        // Initialize our models
        BitMote.meeting_model = new Meeting(window.strap.meeting)
        BitMote.meeting_user  = new User(window.strap.user)
        BitMote.meeting_host  = new User(window.strap.host)

        // Initalize the views
        var meetingView = new MeetingView({ model: BitMote.meeting_model })
        var hostView    = new HostView({ model: BitMote.meeting_host })
        
        //*
        socket.on('mote:saved', function(data){
            var model = BitMote.minutes_collection.get(data.temp_id)
            model.set('id', data.id)

            if ( BitMote.minutes_collection.where({id: 0}).length === 0 ) {
                BitMote.minutes_collection.add([new Mote()])
            }
        })

        socket.on('meeting:updated', function (data) {

        })
        //*/

        var minutesTable = new MinutesTable({ collection: BitMote.minutes_collection })

        minutesTable.on('itemview:user:consensus', function(args) {

        })

        BitMote.Meeting.attachView(meetingView)

        BitMote.Minutes.show(minutesTable)

        $('textarea').autosize()

    })

    BitMote.start();


})
