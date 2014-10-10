gplus-web-auth
==============

Google+ login and authentication with client-side sessions for Node.js

## Installation

Available via [npm](http://www.npmjs.org), to install it simply run the following line in your project:

    npm install gplus-web-auth

## Configuration

The module takes three parameters,

1. Google+ credentials
  * Create a client ID as a Google+ Developer.
  * Setup a redirect URL in their dashboard.
  * Configure the scope of permissions to ask for.
2. Session details
  * Configure the name of the cookie to use.
  * A random string to encrypt the cookies.
  * Duration of the token expiry
  * In case token is about to expire, extend the session for.
3. Authorization method
  * A function that gets the user object from Google+ as the first parameter and a callback as second parameter. Simply return a truthy value on the callback method to authorise the user.

```js
var auth = require('gplus-web-auth')({
  google: {
    client_id: "applicationid123.apps.googleusercontent.com",
    redirect_uri: "http://www.application.com/oauth2callback",
    scope: ['profile', 'email']
  },
  session: {
    cookieName: "gplusauth",
    secret: "secret",
    duration: 24 * 60 * 60 * 1000,
    activeDuration: 1000 * 60 * 5
  },
  authorize: function(req, user, done){
    var authorized = (user.email.split('@')[1] === "application.com");
    done(authorized);
  }
});
```

## Usage

Now simply use the `auth` object as a middleware on your app:

```js
app.use(auth);
```

and use `auth.verify` middleware on routes that you wish should require authentication.

```js
app.get('/admin', auth.verify, function(req, res) {
  res.render('index');
});
```

Calling `app.use(auth)` sets up this route on your app: `/oauth2callback` to use for authentication callbacks.

## Caveats

Because this module uses client-side sessions - you do not need a session store on the server - hence easy to get up and running. But also you should not use Express's session middleware as it might conflict.

## Author

Sunil Pai, threepointone@gmail.com  
Param Aggarwal, paramaggarwal@gmail.com

## License

gplus-web-auth is available under the MIT license.
