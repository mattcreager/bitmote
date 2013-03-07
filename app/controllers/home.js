var models = require('../models')


exports.landing = function (req, res) {

	res.render('landing', {layout: false})

}

exports.guest_landing = function (req, res) {

    res.render('guest_landing', {layout: false})

}