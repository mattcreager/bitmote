require.config({

  paths : {
    backbone :   window.base_url + 'js/vendor/backbone.min',
    underscore : window.base_url + 'js/vendor/lodash.min',
    moment  : window.base_url + 'js/vendor/moment.min',
    handlebars : window.base_url + 'js/vendor/handlebars.runtime',
    'backbone.marionette' : window.base_url + 'js/vendor/marionette.min',
    'backbone.wreqr' : window.base_url + 'js/vendor/backbone.wreqr.min',
    'backbone.eventbinder' : window.base_url + 'js/vendor/backbone.eventbinder.min',
    'backbone.babysitter' : window.base_url + 'js/vendor/backbone.babysitter.min',
    'User.model' : window.base_url + 'js/modules/user.model',
    'Meeting.model' :  window.base_url + 'js/modules/meeting.model',
    'Mote.model' :  window.base_url + 'js/modules/mote.model',
    'handlebars.helpers' : window.base_url + 'js/modules/handlebars.helpers'
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
      deps : ['handlebars.helpers', 'jquery', 'underscore', 'backbone', 'backbone.wreqr', 'backbone.eventbinder', 'backbone.babysitter'],
      exports : 'Marionette'
    }
  }
})

require(
    ['backbone.marionette', 'moment', 'User.model', 'Meeting.model', 'Mote.model', 'handlebars'], 
    function (Marionette, moment, User, Meeting, Mote, Handlebars) {

    // Instantiate our Marionette Application
    var BitMote = new Backbone.Marionette.Application()

    // We hack the render function because
    // we're using pre-compiled templates
    Backbone.Marionette.Renderer.render = function (template, data) {
        return template(data)
    }


    Backbone.sync = function(method, model, options, error) {

        if ( ! model.get('pendingCreation') ) {
            
            // is this a create event
            if ( method == 'create' ) {

                console.log('we are creating a mote')
                model.set('temp_id', model.cid)
                model.set('pendingCreation', true)
            }

            socket.emit(this.urlRoot + ':' + method, model.toJSON())

        } else {

            console.log('creation in progress, no save triggered')
        }   
           
    }

    var Minutes = Backbone.Collection.extend({
        model: Mote
    })

    var Users = Backbone.Collection.extend({
        model: User
    })

    var UserView = Backbone.Marionette.ItemView.extend({
        template: Handlebars.templates.attendee,
        tagName: 'li'
    })

    var AttendeesView = Backbone.Marionette.CollectionView.extend({
        tagName: 'ul',
        itemView: UserView
    })

    var HostView = Backbone.Marionette.ItemView.extend({
        initialize: function () {
            data = {host: window.strap.host, isHost: window.strap.host.id == window.strap.user.id}
            this.$el.html(Handlebars.templates.host(data))
            this.renderHost()
        },
        el: '#host-container',
        events: {
            'blur #meeting-host' : 'changeHost'
        },
        modelEvents: {
            'socket:update' : 'modelChanged'
        },
        modelChanged: function() {
            this.renderHost()
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
            this.$el.find('#meeting-host').text(host)
        }
    })

    var MeetingView = Backbone.Marionette.ItemView.extend({
        initialize: function () {
            //data = {host: window.strap.host, isHost: window.strap.host.id == window.strap.user.id}
            //this.$el.html(Handlebars.templates.host(data))
            this.render()
            setInterval(this.updateStarted.bind(this), 60000)
        },
        el: 'body',
        modelEvents: {
            'socket:update' : 'modelChanged'
        },
        events: {
            'keyup #meeting-title' : 'changeSubject',
            'change #meeting-title' : 'changeSubject',
            'blur #meeting-time'  : 'changeTime',
            'focus #meeting-time'  : 'changeTimeFormat',
            'click .close-modal, #share-meeting' : 'toggleModal'
        },
        modelChanged: function() {
            this.render()
        },
        toggleModal:  function (event) {
            this.$el.find('.modal').toggle()
            this.$el.find('.modal-backdrop').toggle()
            setSelectionRange($('#share-link')[0], 0, $('#share-link').text().length)
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
            var link = window.location.origin + "/m/" + this.model.get('id')
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
        onRender: function() {
            this.$el.find('textarea').autosize()
        },
        template: Handlebars.templates.mote_row,
        modelEvents: {
            'socket:update' : 'modelChanged'
        },
        events: {
            'click .agree, .disagree' : 'toggleAgree',
            'click .type' :  'changeType',
            'keyup textarea' : 'quickChangeBody'
        },
        modelChanged: function() {
            this.render()
        },
        changeType: function (event) {
            event.preventDefault()
            var mote_type = $(event.target).data('type')
            this.model.set('type', mote_type)
            this.model.save()
        },
        quickChangeBody: function (event) {
            var space  = 32,
                comma  = 188,
                period = 190

            var mote_body = $(event.target).val()
            this.model.set('body', mote_body, {silent: true})
            
        },
        changeBody: function (event) {
            var mote_body = $(event.target).val()
            this.model.set('body', mote_body, {silent: true})
            this.model.save()
        },
        toggleAgree: function (event) {
            event.preventDefault()

            if ( ! _.isArray(this.model.attributes.agree) ) {
                this.model.attributes.agree = []
            }

            var element = $(event.target)

            if ( element.data('agree') === 'agree' ) {
                element.data('agree', 'disagree')
                element.removeClass('agree')
                element.addClass('disagree')
                this.model.set('agree', _.without(this.model.get('agree'), window.strap.user.id))
            } else {
                var usersWhoAgree = this.model.get('agree')

                if (typeof usersWhoAgree != 'object') {
                    usersWhoAgree = [];
                }

                usersWhoAgree.push(window.strap.user.id)

                element.data('agree', 'agree')
                element.removeClass('disagree')
                element.addClass('agree')
                this.model.set('agree', usersWhoAgree)
            }

            this.model.save()
            this.render()
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
        Actions: '#meeting-actions',
        Attendees: '#attendees'
    })

    BitMote.addInitializer( function() {

        socket.emit('user:joined', {user: window.strap.user.id})

        // Get hte motes that were bootstrapped to the application
        var motes = []

        _.each(window.strap.motes, function(mote) {
            mote.attendees = window.strap.attendees.length + 1
            motes.push(new Mote(mote))
        })

        // Always make a new mote available to enter notes in
        motes.push(new Mote({attendees: window.strap.attendees.length + 1}))

        // Initialize our mote collection
        BitMote.minutes_collection = new Minutes(motes)

        // Initialize our models
        BitMote.meeting_model = new Meeting(window.strap.meeting)
        BitMote.meeting_user  = new User(window.strap.user)
        BitMote.meeting_host  = new User(window.strap.host)

        BitMote.attendees = new Users(window.strap.attendees)

        // Initalize the views
        var attendeesView = new AttendeesView({ collection:  BitMote.attendees })

        BitMote.Attendees.show(attendeesView)

        var meetingView = new MeetingView({ model: BitMote.meeting_model })
        var hostView    = new HostView({ model: BitMote.meeting_host })

        socket.on('mote:saved', function(data) {
            var model = BitMote.minutes_collection.get(data.temp_id)
            model.set('id', data.id)
            model.set('pendingCreation', false)

            if ( BitMote.minutes_collection.where({id: 0}).length === 0 ) {
                BitMote.minutes_collection.add([new Mote({agree: [], attendees: BitMote.attendees.length + 1})])
            }
        })

        
        socket.on('mote:changed', function (mote) {
            var model = BitMote.minutes_collection.get(mote.id)
            model.set(mote)
            model.trigger('socket:update')
        }) 
    
        
        socket.on('mote:new', function (data) {
            var mote = new Mote(data.mote)
            mote.set('attendees', BitMote.attendees.length + 1)

            _.each(BitMote.minutes_collection.models, function(model) {
                if (model.isNew()) {
                    BitMote.minutes_collection.remove(model);
                }
            })
            BitMote.minutes_collection.add(mote)
            BitMote.minutes_collection.add(new Mote({agree: [], attendees: BitMote.attendees.length + 1}))
        })

        socket.on('meeting:changed', function (meeting) {
            meetingView.model.set(meeting)
            meetingView.model.trigger('socket:update')
        })
    
        
        socket.on('meeting:newUser', function (data) {
            BitMote.attendees.add(new User(data.user));
            _.each(BitMote.minutes_collection.models, function(model) {
                model.set('attendees', BitMote.attendees.length + 1)
                model.trigger('socket:update')
            })
        })
        
        socket.on('user:updated', function (user) {
            if (BitMote.meeting_host.get('id') == user.id) {
                BitMote.meeting_host.set(user)
                BitMote.meeting_host.trigger('socket:update')
            }
        })

        var minutesTable = new MinutesTable({ collection: BitMote.minutes_collection })

        BitMote.Meeting.attachView(meetingView)

        BitMote.Minutes.show(minutesTable)


        // Hacky code to make tab/shift-tab work
        // @todo refactor this
        $('#minutes-table').on('keydown', 'textarea', function(event) {
            var tab = 9

            if (event.shiftKey && event.keyCode === tab) {
                $(this).parents('tr').prev().find('textarea').focus()
                event.preventDefault()
            } else if (event.keyCode === tab) {
                $(this).parents('tr').next().find('textarea').focus()
                event.preventDefault()
            }
        })

    })

    BitMote.start();


})
function getTextNodesIn(node) {
    var textNodes = [];
    if (node.nodeType == 3) {
        textNodes.push(node);
    } else {
        var children = node.childNodes;
        for (var i = 0, len = children.length; i < len; ++i) {
            textNodes.push.apply(textNodes, getTextNodesIn(children[i]));
        }
    }
    return textNodes;
}

function setSelectionRange(el, start, end) {
    if (document.createRange && window.getSelection) {
        var range = document.createRange();
        range.selectNodeContents(el);
        var textNodes = getTextNodesIn(el);
        var foundStart = false;
        var charCount = 0, endCharCount;

        for (var i = 0, textNode; textNode = textNodes[i++]; ) {
            endCharCount = charCount + textNode.length;
            if (!foundStart && start >= charCount
                    && (start < endCharCount ||
                    (start == endCharCount && i < textNodes.length))) {
                range.setStart(textNode, start - charCount);
                foundStart = true;
            }
            if (foundStart && end <= endCharCount) {
                range.setEnd(textNode, end - charCount);
                break;
            }
            charCount = endCharCount;
        }

        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (document.selection && document.body.createTextRange) {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(true);
        textRange.moveEnd("character", end);
        textRange.moveStart("character", start);
        textRange.select();
    }
}