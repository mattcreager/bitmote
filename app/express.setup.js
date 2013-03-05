var express = require('express'), 
    path	= require('path'),
    gzippo	= require('gzippo'),
    exhbs 	= require('express3-handlebars')

var app  = express(),
    env  = process.env.NODE_ENV || 'development',
    //root = path.resolve('./') + '/'
    root = '/var/www_node/bitmote/app/',
    hbs  = exhbs.create({defaultLayout: 'main'})

module.exports = app

process.chdir(__dirname)

app.set('showStackError', true);
app.set('port', process.env.PORT || 8000)
app.set('views', './views')

app.engine('handlebars', hbs.engine)
app.set('view engine', 'handlebars')
//app.use(require('../lib/hbsExposed')(app, hbs))

app.use(express.favicon())
app.use(express.logger('dev'))
app.use(express.cookieParser())
app.use(express.bodyParser())
app.use(express.methodOverride())
app.use(app.router)
app.use(require('less-middleware')({ src: 'public/' }))

app.use(gzippo.staticGzip(path.join(root, 'public')))
//app.use('/test', gzippo.staticGzip(path.join(root, 'test')))
//app.use('/node_modules', gzippo.staticGzip(path.join(root, 'node_modules')))
