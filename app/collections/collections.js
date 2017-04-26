poll = new Mongo.Collection('polls');
Uservotes = new Mongo.Collection('user_votes');
EthAccounts = new Mongo.Collection('eth_accounts');
Voters = new Mongo.Collection('voters')
VoterSessions = new Meteor.Collection("VoterSessions");

createVoter = function (name, email, password, fakePassword, cin, gouvernerat) {
	var voter_id, hash = "";

  var emailAlreadyExist = Voters.find({"email": email}, {limit: 1}).count()>0

   if(emailAlreadyExist === true) {
       throw new Meteor.Error(403, "email already registered");
   }

  console.log(Auth.generatePasswordHash('test'))
	if (typeof Auth !== "undefined") {
		hash = Auth.generatePasswordHash(password);
		hashFake = Auth.generatePasswordHash(fakePassword);
	}

	try {
		voter_id = Voters.insert({
			created: Date.now(),
			modified: Date.now(),
			name: name,
			email: email,
			password_hash: hash,
			fakePassword_hash: hashFake,
      cin: cin,
      gouvernerat: gouvernerat,
			registered: cin ? true : false
		});

		return voter_id;
	} catch (e) {}

	return false;
};

updateVoter = function (voter_id, properties) {
	var set = {modified: Date.now()};
	var hash = "";

	if (typeof Auth !== "undefined") {
		hash = Auth.generatePasswordHash(properties.password);
	}

	if (properties.name !== undefined) set.name = properties.name;
	if (properties.email !== undefined) set.email = properties.email;
	if (properties.password !== undefined) set.password_hash = hash;

	if (_.size(set)) {
		try {
			Voters.update(voter_id, {$set: set});
			return voter_id;
		} catch (e) {}
	}

	return false;
};

deleteVoter = function (voter_id) {

	try {

		Voters.remove(voter_id);
		return voter_id;
	} catch (e) {}

	return false;
};
