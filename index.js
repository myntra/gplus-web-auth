var _ = require('underscore'),
	superagent = require('superagent'),
	Router = require('express').Router;

var defaultSession = {
	duration: 24 * 60 * 60 * 1000,
	activeDuration: 1000 * 60 * 5
};

module.exports = function(config) {

	var router = new Router;

	config = config || {};
	if (!config.google) throw new Error('Google config missing');
	if (!config.session) throw new Error('Session config missing');
	if (!config.authorize) throw new Error('Authorize config missing');

	if (!config.session.cookieName) throw new Error('Specify a cookieName for the session');
	if (!config.session.secret) throw new Error('Specify a secret for the session');

	var callbackPath = config.google.callbackPath || '/oauth2callback';

	router.use(require('client-sessions')(_.extend({}, defaultSession, config.session)));

	router.get(callbackPath, function(req, res) {
		res.send('<!DOCTYPE html><html><body><script src="' + callbackPath + '/browser.js"></script></body></html>');
	});

	router.get(callbackPath + '/browser.js', function(req, res) {
		// Express 4 uses res.sendFile instead of res.sendfile
		var filename = __dirname + '/static/browser.js';
		res.sendFile ? res.sendFile(filename) : res.sendfile(filename);
	});

	router.post(callbackPath, function(req, res, next) {
		superagent.get('https://www.googleapis.com/oauth2/v1/tokeninfo')
		.query({
			access_token: req.body.token
		}).end(function(err, response) {

			if (err || response.error) {
				return next(err || response.error);
			}

			if (config.authorize(req, response.body, function(yes) {
				if (!yes) {
					return res.status(401).end();
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

		var data = req[config.session.cookieName] || {};
		var scope = encodeURIComponent(config.google.scope.join(' '));

		// if no token, or expired token
		if (!data.token || (data.tokenExpiry < new Date().getTime())) {
			data.token = data.tokenExpiry = data.email = null;

			var redirect_uri = req.protocol + '://' + req.get('host') + callbackPath;
			return res.redirect('https://accounts.google.com/o/oauth2/auth?client_id=' +
				encodeURIComponent(config.google.client_id) +
				'&redirect_uri=' + encodeURIComponent(redirect_uri) +
				'&state=' + encodeURIComponent(JSON.stringify({nextUrl: req.originalUrl})) + 
				'&scope=' + scope + 
				'&response_type=token'
			);
		}

		res.locals.email = data.email;
		next();
	};
	
	return router;
};
