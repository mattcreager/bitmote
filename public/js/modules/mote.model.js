define(['backbone'], function (Backbone) {  
    
   /**
    * Mote Backbone Model
    */
    
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

    return Mote

})