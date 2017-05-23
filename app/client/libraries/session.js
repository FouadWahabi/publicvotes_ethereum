Meteor.startup(function () {
	initializeSessionToken();
});

var initializeSessionToken = function () {
	Session.set("token", $.cookie("X_SESSION_TOKEN") || "unknown");
};

rememberSessionToken = function (sessionToken) {
	sessionToken = sessionToken || "";
	sessionToken = sessionToken === "" ? "unknown" : sessionToken;
	$.cookie("X_SESSION_TOKEN", sessionToken, {expires: 7, path: "/"});
	Session.set("token", sessionToken);
	console.log("success " + sessionToken)
};

var forgetSessionToken = function () {
	$.cookie("X_SESSION_TOKEN", "unknown");
	Session.set("token", "unknown");
};

getSessionToken = function () {
	return Session.get("token");
};

getUserBySession = function (sessionToken) {
	var user, session;
	hash = sessionToken;
	console.log(hash)
	session = VoterSessions.findOne({hash: hash})
	console.log("session : " + session.user_id)
	if (session) {
		user = Voters.findOne({_id: session.user_id});
		console.log("User : " + user.name)
		if (user) {
			return user;
		}
	} else {
		return false
	}
};

/**
* jQuery Cookie plugin
*
* Copyright (c) 2010 Klaus Hartl (stilbuero.de)
* Dual licensed under the MIT and GPL licenses:
* http://www.opensource.org/licenses/mit-license.php
* http://www.gnu.org/licenses/gpl.html
*
*/
jQuery.cookie = function (key, value, options) {

    // key and at least value given, set cookie...
    if (arguments.length > 1 && String(value) !== "[object Object]") {
        options = jQuery.extend({}, options);

        if (value === null || value === undefined) {
            options.expires = -1;
        }

        if (typeof options.expires === 'number') {
            var days = options.expires, t = options.expires = new Date();
            t.setDate(t.getDate() + days);
        }

        value = String(value);

        return (document.cookie = [
            encodeURIComponent(key), '=',
            options.raw ? value : encodeURIComponent(value),
            options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
            options.path ? '; path=' + options.path : '',
            options.domain ? '; domain=' + options.domain : '',
            options.secure ? '; secure' : ''
        ].join(''));
    }

    // key and possibly options given, get cookie...
    options = value || {};
    var result, decode = options.raw ? function (s) { return s; } : decodeURIComponent;
    return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : null;
};
