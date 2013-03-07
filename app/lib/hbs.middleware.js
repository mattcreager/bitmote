
/**
 * Middleware to compile and expose Handlebars templates
 * @param {Object} app
 * @param {Object} hbs
 */

exports = module.exports = function (app, hbs) {

    /**
     * @param {Object} req
     * @param {Object} res
     * @param {Object} next
     */

    return function exposeTemplates (req, res, next) {

        // Retrieve pre-compiled partials from `ExpressHandlebars` instance
        hbs.loadPartials({
            cache      : app.enabled('view cache'),
            precompiled: true
        }, function (err, partials) {
            if (err) return next(err)

            var templates = []

            Object.keys(partials).forEach(function (name) {
                templates.push({
                    name    : name,
                    template: partials[name]
                })
            })

            // Exposes the partials during view rendering.
            if (templates.length) {
                res.locals.templates = templates;
            }

            next()
        })
    }
}