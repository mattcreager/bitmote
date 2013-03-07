
/**
 * Module dependencies
 */

var express = require('express')              
   ,path	= require('path')
   ,exhbs 	= require('express3-handlebars')        /*  Express 3 Handlebars View Engine  */


var app  = express()
   ,env  = process.env.NODE_ENV || 'development'    /*  Reference to our Current Enviroment */
   ,root = path.resolve(__dirname, '../') + '/'     /*  Reference to our Root Directory */
   ,hbs  = exhbs.create({ defaultLayout: 'main' })  /*  Layout default: /views/layouts/main */

/**
 * Export Our Application Object
 */

module.exports = app

process.chdir(__dirname)

/**
 * Application Configuration
 */

app.set('showStackError', true);
app.set('port', process.env.PORT || 8000)
app.set('views', path.join(root, 'app/', 'views'))

// Templating Engine
app.engine('handlebars', hbs.engine)
app.set('view engine', 'handlebars')
app.use(require('./lib/hbs.middleware')(app, hbs))

// Express Settings
app.use(express.favicon())
app.use(express.logger('dev'))
app.use(express.bodyParser())
app.use(express.methodOverride())
app.use(express.cookieParser())
app.use(express.cookieSession({secret: 'p1Y%ygFau7R}vxEgIlp42yp6Mw(F%dkz%f$DN', cookie: { maxAge: 60 * 60 * 1000 }}))

// Router and Less Setup
app.use(app.router)
app.use(require('less-middleware')({ src: path.join(root,'public') }))
app.use(express.static(path.join(root, 'public')))

// Application Locals
app.locals.base_url = '/'

// Log Uncaught exceptions
process.on('uncaughtException', function (err) {
  console.error(err.stack)
})