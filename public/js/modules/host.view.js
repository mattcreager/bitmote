define(['backbone', 'backbone.marionette'], function (Backbone) {
   
    /**
     * Host View Constructor
     */

    var HostView = Backbone.Marionette.ItemView.extend({

        /**
         * We bootstrap our container & its contents
         */
        initialize: function () {
            this.strapHost()
            this.renderHost()
        },

        el: '#host-container',

        events: {
            'blur #meeting-host' : 'changeHost'
        },

        modelEvents: {
            'socket:update' : 'modelChanged'
        },

        strapHost: function () {
            
            // Render our template into our #host-container
            this.$el.html(Handlebars.templates.host({
                host: window.strap.host,
                isHost: window.strap.host.id == window.strap.user.id
            }))
        },

        renderHost: function () {

            // Combine our name and email (example: Joe <joe@gm.com>)
            var host = this.model.get('name')

            if ( ! _.isEmpty(this.model.get('email') ) ) {
                host += ' <' + this.model.get('email') + '>'
            }

            this.$el.find('#meeting-host').val(host)
            this.$el.find('#meeting-host').text(host)
        },

        /**
         * Persist changes made to our Host name or email
         */
        changeHost: function (event) {

            // Grab the value of the input
            var host = $(event.target).val()

            // Use a bit of Regex to seperate the name and email
            var parts = host.match(/(.*?) <(.*?)>/)

            if ( parts && parts.length === 3 ) {
                this.model.set({name: parts[1], email: parts[2]})
            } else {
                this.model.set({name: host, email: ''})
            }
            this.model.save()
        },

        modelChanged: function() {
            this.renderHost()
        }

    })

    return HostView
})