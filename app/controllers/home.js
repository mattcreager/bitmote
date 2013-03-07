
/**
 * Module dependencies
 */

var models = require('../models')  /*  Our Application Models & Factory */
   ,_      = require('lodash')
   ,async  = require('async')

/**
 * Renders our 'New Meeting' landing page
 * @req {Object} Request
 * @res {Object} Response
 */

var landing = exports.landing = function (req, res) {

	res.render('landing', { layout: false })

}

/**
 * Renders our 'Join Meeting' landing page
 * @req {Object} Request
 * @res {Object} Response
 */

var join = exports.join = function (req, res) {

    // TODO: check to see if they have a session, if they do populate the fields
    // TODO: update exisiting session rather than create a new one

    if ( req.param('guest-name') && req.param('guest-email') ) {
        
        var user = new models.User( {name: req.param('guest-name'), email: req.param('guest-email')} )
            user.save()

        res.cookie('bmsession', user.id, { expires: new Date(Date.now() + 90000000000) })
        res.redirect('m/' + req.param('meeting_id'))

    } else {

        res.render('join', { layout: false })

    }
}