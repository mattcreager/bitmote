var express = require('express'), 
    path	= require('path'),
    gzippo	= require('gzippo'),
    exhbs 	= require('express3-handlebars')

var app  = express(),
    env  = process.env.NODE_ENV || 'development',
    //root = path.resolve('./') + '/'
    root = path.resolve(__dirname, '../') + '/',
    hbs  = exhbs.create({defaultLayout: 'main'})

console.log(path.join(root,'public'))
module.exports = app

process.chdir(__dirname)

app.set('showStackError', true);
app.set('port', process.env.PORT || 8000)
app.set('views', path.join(root, 'app/', 'views'))

app.engine('handlebars', hbs.engine)
app.set('view engine', 'handlebars')
app.use(require('./lib/hbsExposed')(app, hbs))
app.use(express.favicon())
app.use(express.logger('dev'))
app.use(express.bodyParser())
app.use(express.methodOverride())
app.use(express.cookieParser())
app.use(express.cookieSession({secret: 'p1Y%ygFau7R}vxEgIlp42yp6Mw(F%dkz%f$DN', cookie: { maxAge: 60 * 60 * 1000 }}))
app.use(app.router)
app.use(require('less-middleware')({ src: path.join(root,'public') }))
app.use(express.static(path.join(root, 'public')))
app.locals.base_url = 'http://ninja:' + app.get('port') + '/'
//app.use('/test', gzippo.staticGzip(path.join(root, 'test')))
//app.use('/node_modules', gzippo.staticGzip(path.join(root, 'node_modules')))
