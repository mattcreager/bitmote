define(['backbone'], function (Backbone) {  

   /**
    * Meeting Backbone Model
    */
    
    var Meeting = Backbone.Model.extend({
        urlRoot: 'meeting',
        initialize: function() {
            // do stuff
        },
        defaults: {
            subject: 'Untitled Meeting',
            started:  '',
            attendees: ''
        }
    })

    return Meeting

})