var Router = require('express').Router,
	superagent = require('superagent');

module.exports = function(config) {

	var router = new Router;

	config = config || {};
	config.google || console.error('Google config missing');
	config.session || console.error('Session config missing');
	config.authorize || console.error('Authorize config missing');

	router.use(require('client-sessions')({
		cookieName: config.session.cookieName || 'bnSess', // cookie name dictates the key name added to the request object
		secret: config.session.secret || 'somethingsomething', // should be a large unguessable string
		duration: config.session.duration || 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
		activeDuration: config.session.activeDuration || 1000 * 60 * 5 // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds
	}));

	router.get('/oauth2callback', function(req, res, next) {
		res.send('<!DOCTYPE html><html><body><script src="/oauth2callback/browser.js"></script></body></html>');
	});

	router.get('/oauth2callback/browser.js', function(req, res, next) {
		// Express 4 uses res.sendFile instead of res.sendfile
		var filename = __dirname + '/static/browser.js';
		res.sendFile ? res.sendFile(filename) : res.sendfile(filename);
	});

	router.post('/oauth2callback', function(req, res) {
		superagent.get('https://www.googleapis.com/oauth2/v1/tokeninfo')
		.query({
			access_token: req.body.token
		}).end(function(err, response) {

			if (err || response.error) {
				return next(err || response.error);
			}

			if (config.authorize(req, response.body, function(yes) {
				if (!yes) {
					res.status(401).end();
				}

				var data = req[config.session.cookieName];
				data.token = req.body.token;
				data.tokenExpiry = new Date().getTime() + (response.body.expires_in * 1000);
				data.email = response.body.email;
				res.send(response.body);

			}));
		});
	});

	// Use this as middleware on routes that need authentication
	router.verify = function (req, res, next) {

		var data = req[config.session.cookieName];
		var scope = encodeURIComponent(config.google.scope.join(' '));

		// if no token, or expired token
		if (!data.token || (data.tokenExpiry < new Date().getTime())) {
			data.token = data.tokenExpiry = data.email = null;

			return res.redirect('https://accounts.google.com/o/oauth2/auth?client_id=' +
				encodeURIComponent(config.google.client_id) +
				'&redirect_uri=' + encodeURIComponent(config.google.redirect_uri) +
				'&state=' + encodeURIComponent(JSON.stringify({nextUrl: req.url})) + 
				'&scope=' + scope + 
				'&response_type=token'
			);
		}

		res.locals.email = data.email;
		next();
	};
	
	return router;
};
