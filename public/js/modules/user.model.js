define(['backbone'], function (Backbone) {

   /**
    * User Backbone Model
    */

    var User = Backbone.Model.extend({
        urlRoot: 'user',
        initialize: function() {
            // do stuff
        },
        defaults: {
            name: '',
            email: ''
        }
    })

    return User

})