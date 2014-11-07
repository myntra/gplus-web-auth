var superagent = require('superagent'), 
	_ = require('underscore');

var kvs = _(window.location.hash.slice(1).split('&')).map(function(str){ return str.split('=')})

function find(arr, key){
	return _(arr).find(function(el){ return el[0] === key;})[1]
}

var state = JSON.parse(decodeURIComponent(find(kvs, 'state')));
var postURL = window.location.pathname;

superagent.post(postURL).send({
	token: find(kvs, 'access_token')
}).end(function(err, res){
	if(err || res.error) {
		console.error(err , res);
		alert('you\'re probably not supposed to be here. shoo.');
		return;
	}
	window.location = state.nextUrl || '/admin';
})