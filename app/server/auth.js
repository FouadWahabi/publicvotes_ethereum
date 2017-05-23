/*
Example usage:
var Auth = makeAuthenticationManager("unique_server_key_of_your_choosing_abc123", {
	userCollection: Users,
	usernameField: "login",
	passwordHashField: "password_hash",
	sessionCollection: VoterSessions
});
*/


makeAuthenticationManager = function (serverKey, options) {

	var settings = _.extend({
		userCollection: Voters,
		usernameField: "username",
		passwordHashField: "password_hash",
		fakePasswordHashField: "fakePassword_hash",
		sessionCollection: VoterSessions,
		sessionLongevitySeconds: 7 * 24 * 60 * 60
	}, options);

	var AuthUsers = settings.userCollection;
	var AuthVoterSessions = settings.sessionCollection;

	var getUserSessionBySessionToken = function (sessionToken) {
		var session, hash;
		console.log('Test ' + sessionToken)
		if (isSessionTokenValid(sessionToken)) {
			hash = getSessionTokenHash(sessionToken);
			session = AuthVoterSessions.findOne({"hash": hash});
			if (session) {
				if (Date.now() <= session.expires) {
					return session;
				} else {
					AuthVoterSessions.remove({_id: session._id});
				}
			}
		}
	};

	var getUserBySessionToken = function (sessionToken) {
		var user, session;
		console.log('The hell : ' + sessionToken)
		session = getUserSessionBySessionToken(sessionToken);
		console.log('I got the sessions : ' + session.user_id)
		if (session) {
			user = AuthUsers.findOne({_id: session.user_id});
			if (user) {
				console.log('I got the user : ' + user._id)
				return user;
			} else {
				return false;
			}
		} else {
			return false;
		}
	};

	var generatePasswordHash = function (password) {
		var bcrypt = Meteor.npmRequire("bcrypt-nodejs");
		var salt = bcrypt.genSaltSync(10);
		var hash = bcrypt.hashSync(password, salt);

		return hash;
	};

	var getSessionTokenHash = function (sessionToken) {
		console.log('Aazer : ' + sessionToken)
		return sessionToken.toString();
	}

	var isUserPasswordCorrect = function (user, testPassword) {
		var bcrypt = Meteor.npmRequire("bcrypt-nodejs");
		var userPassword;

		if (user && user[settings.passwordHashField]) {
			userPassword = user[settings.passwordHashField];

			if (!userPassword) {
				userPassword = "";
			}

			if (!testPassword) {
				testPassword = "";
			}

			return bcrypt.compareSync(testPassword, userPassword);
		}

		return false;
	};

	var isUserFakePasswordCorrect = function (user, testPassword) {
		var bcrypt = Meteor.npmRequire("bcrypt-nodejs");
		var userPassword;

		if (user && user[settings.fakePasswordHashField]) {
			userPassword = user[settings.fakePasswordHashField];

			if (!userPassword) {
				userPassword = "";
			}

			if (!testPassword) {
				testPassword = "";
			}

			return bcrypt.compareSync(testPassword, userPassword);
		}

		return false;
	};

	var generateSignedToken = function () {
		var randomToken = CryptoJS.SHA256(Math.random().toString()).toString();
		var signature = CryptoJS.HmacMD5(randomToken, serverKey).toString();
		var signedToken = randomToken;

		return signedToken;
	};

	var isSessionTokenValid = function (sessionToken) {
		var parts, token, signature;

		if (!sessionToken) {
			return false;
		}

		return true;
	};

	var getSessionTokenForUser = function (user) {
		var sessionToken, hash;

		// Always generate signed token, since we have no way to retrieve
		// it once it has been sent to the client upon login. We only store
		// a hash of this token in the DB for security reasons.
		sessionToken = generateSignedToken();
		hash = getSessionTokenHash(sessionToken);
		console.log('Creating session with the hash : ' + hash)
		AuthVoterSessions.insert({
			user_id: user._id,
			hash: hash,
			expires: new Date(Date.now() + settings.sessionLongevitySeconds * 1000).getTime(),
			fake: false
		});

		return sessionToken;
	};

	var getFakeSessionTokenForUser = function (user) {
		var sessionToken, hash;

		// Always generate signed token, since we have no way to retrieve
		// it once it has been sent to the client upon login. We only store
		// a hash of this token in the DB for security reasons.
		sessionToken = generateSignedToken();
		hash = getSessionTokenHash(sessionToken);

		AuthVoterSessions.insert({
			user_id: user._id,
			hash: hash,
			expires: new Date(Date.now() + settings.sessionLongevitySeconds * 1000).getTime(),
			fake: true
		});

		return sessionToken;
	};

	var getSessionTokenForUsernamePassword = function (username, password) {
		var query = {}, user;

		query[settings.usernameField] = username;
		user = AuthUsers.findOne(query);
		if (isUserPasswordCorrect(user, password)) {
			console.log('Correct login')
			return getSessionTokenForUser(user);
		} else if(isUserFakePasswordCorrect(user, password)) {
			return getFakeSessionTokenForUser(user);
		}
	};

	var clearVoterSessions = function (sessionToken) {
		var user = getUserBySessionToken(sessionToken);

		if (user) {
			user = AuthVoterSessions.remove({user_id: user._id});
			return true;
		}
	};

	return {
		getSessionTokenForUsernamePassword: getSessionTokenForUsernamePassword,
		clearVoterSessions: clearVoterSessions,
		getUserBySessionToken: getUserBySessionToken,
		generatePasswordHash: generatePasswordHash,
		isUserPasswordCorrect: isUserPasswordCorrect
	};
};
