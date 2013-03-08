define(['handlebars'], function (Handlebars) {

    bootstrapHandleBarTemplates()

    Handlebars.registerHelper('type', function(type, value) {
        if ( type == value ) { return "active" }
    })

    Handlebars.registerHelper('consensusPercent', function(agrees, total) {
        return Math.round(Math.min(agrees / total * 100, 100)) + '%'
    })

    Handlebars.registerHelper('youAgree', function(agree) {
        if ( _.intersection(agree, [window.strap.user.id]).length === 0 ) {
            return "disagree"
        } else {
            return "agree"
        }
    })

})