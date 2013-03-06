// Middleware to expose the app's partials when rendering the view.

exports = module.exports = function (app, hbs) {

    return function exposeTemplates(req, res, next) {
        // Uses the `ExpressHandlebars` instance to get the precompiled partials.
        hbs.loadPartials({
            cache      : app.enabled('view cache'),
            precompiled: true
        }, function (err, partials) {
            if (err) { return next(err); }

            var templates = [];

            Object.keys(partials).forEach(function (name) {
                templates.push({
                    name    : name,
                    template: partials[name]
                });
            });

            // Exposes the partials during view rendering.
            if (templates.length) {
                res.locals.templates = templates;
            }

            next();
        });
    }
}