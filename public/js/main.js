require.config({

  paths : {
    backbone :   window.base_url + 'js/vendor/backbone.min',
    underscore : window.base_url + 'js/vendor/lodash.min',
    'backbone.marionette' : window.base_url + 'js/vendor/marionette.min',
    'backbone.wreqr' : window.base_url + 'js/vendor/backbone.wreqr.min',
    'backbone.eventbinder' : window.base_url + 'js/vendor/backbone.eventbinder.min',
    'backbone.babysitter' : window.base_url + 'js/vendor/backbone.babysitter.min'
  },

  shim : {
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
    ['backbone.marionette'], function (Marionette) {

    var BitMote = new Backbone.Marionette.Application()

    Backbone.Marionette.Renderer.render = function (template, data) {
        return template(data)
    }

    var Mote = Backbone.Model.extend({
        initialize: function() {
            console.log('go mote go')
        },
        defaults: {
            added: new Date(),
            consensus:  0,
            type:  'info',
            body:  null
        }
    })

    var mote = new Mote({body: 'one sweet new minute'})
    var mote2 = new Mote({body: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nam magnam ratione incidunt accusantium illo. Illo pariatur totam ea harum sint tenetur nam illum ex rem et. Doloremque sint excepturi accusantium!'})

    var Minutes = Backbone.Collection.extend({
        model: Mote
    })

    var MoteView = Backbone.Marionette.ItemView.extend({
        initialize: function () {
            this.listenTo(this.model, 'change:type', this.updateTypeView)
        },
        template: Handlebars.templates.mote_row,
        triggers: {
            'click .agree' : 'user:consensus'
        },
        events: {
            'click .type' : 'changeType'
        },
        changeType: function(event) {
            var mote_type = $(event.target).data('type')
            this.model.set('type', mote_type)
            console.log(this.model.get('type'))
        },
        updateTypeView: function(model, collection) {

            var elements = $(this.el).find('a.type')

            _.each(elements, function(element) {
                
                var $element = $(element)

                if ( $element.data('type') == model.get('type') ) {
                    $element.addClass('active')
                } else {
                    $element.removeClass('active')
                }
            }) 
        }
    })

    var MinutesTable = Backbone.Marionette.CollectionView.extend({
        itemView: MoteView,
        emptyView: MoteView
    })

    BitMote.addRegions({
        Meta: 'header .meta',
        Time: '#meeting-time',
        Minutes: '#contents-container tbody',
        Actions: '#meeting-actions'
    })

    BitMote.addInitializer( function() {

        BitMote.minutes_collection = new Minutes( [mote, mote2] )
        minutesTable = new MinutesTable({ collection: BitMote.minutes_collection })
        
        minutesTable.on('itemview:user:consensus', function(args) {
            console.log(args)
        })

        BitMote.Minutes.show(minutesTable)

    })

    BitMote.start();
   

})
