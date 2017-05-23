web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));

Meteor.publish('poll_listings', function() {
  //TODO: Subscribe only to active and public polls
  return poll.find();
});

var accountstowatch = [];
Auth = undefined;

Meteor.startup(function() {

  // Setup global Auth object, which holds various methods to manage
  	// authentication. Parameters allow you to customize which collection and
  	// fields should be managed. The first parameter is the server key which
  	// is used to sign session tokens. Change it to some random value.
  	Auth = makeAuthenticationManager("552ad4c6f2c87b5ef6c4d29614d95f57", {
  		userCollection: Voters,
  		usernameField: "email",
  		passwordHashField: "password_hash",
  		sessionCollection: VoterSessions,
  		sessionLongevitySeconds: 7 * 24 * 60 * 60
  	});

    console.log(Auth.generatePasswordHash('test'))

  //process.env.HTTP_FORWARDED_COUNT = 1;

  function polldeadline(poll_input, _current_date) {
    var current_poll = poll_input;
    var current_date = _current_date;
    var timer = false;

    timer = Meteor.setTimeout(function() {
      console.log("ID:" + current_poll._id + " Name: " + current_poll.poll.name + " went offline!");
      poll.update({_id:current_poll._id}, {$set: {'poll.isvoted': true, 'poll.isactive':false}});
      //TODO: Make transaction that changes contract state
    },(current_poll.endDate - current_date));
    console.log("New timer set for Poll: " + current_poll._id);
  }

  //
  // set the deadline for each poll on server startup
  //
  var active_polls = poll.find({'poll.isactive':true}).fetch();
  for (var i = 0; i < active_polls.length; i++) {
    var current_poll = active_polls[i];
    var current_date = Date.now();
    if ((current_poll.endDate - current_date) <= 0) {
      console.log("ID:" + current_poll._id + " Name: " + current_poll.poll.name + " went offline!");
      poll.update({_id:current_poll._id}, {$set: {'poll.isvoted': true, 'poll.isactive':false}});
    }
    else {
      polldeadline(current_poll,current_date);
    }
  }

  notreadypolls = poll.find({'poll.ready':false, address:{$exists:true}}).fetch()
  for (var i = 0; i < notreadypolls.length; i++) {
    accountstowatch.push(notreadypolls[i]);
  }

  //
  //  On Startup, setInterval for all Ethereum accounts to watch for incoming tx
  //  Interval set for every 2 minutes
  //
  Meteor.setInterval(function(){
    for (var i = 0; i < accountstowatch.length; i++) {
      var current_poll = accountstowatch[i];
      var pub_address = current_poll.address;
      var balance = web3.eth.getBalance(pub_address);
      var balance_wei = balance.toString(10);
      var balance_eth = web3.fromWei(balance_wei, "ether");

      // If a poll is not ready after 7 days, we remove it
      if (current_poll.createdAt + 1000 * 60 * 60 * 24 * 7 <= Date.now()) {
        poll.remove({_id: current_poll._id});
      }

      if (balance_eth >= 0.2) {
        console.log("Poll: " + current_poll._id + " is ready to go live!");
        var index = accountstowatch.indexOf(i);
        accountstowatch.splice(index, 1);
        poll.update({_id:current_poll._id}, {$set:{'poll.ready':true}});
      }
    }
  }, 60000)
});

Meteor.methods({
  currentUser: function(sessionToken) {
    console.log(sessionToken)
    var user = Auth.getUserBySessionToken(sessionToken)
    return user
  },
  createVoter: function (name, email, password, fakePassword, cin, gouvernerat) {
    return createVoter(name, email, password, fakePassword, cin, gouvernerat)
  },
  login: function (email, password) {
		var sessionToken;

    sessionToken = Auth.getSessionTokenForUsernamePassword(email, password);

    if (!sessionToken) {
      throw new Meteor.Error(401, "Invalid email and password combination.");
    }

    return sessionToken;
	},
  post_data: function(sessionToken, data) {
    var owner = Auth.getUserBySessionToken(sessionToken)._id
    return poll.insert({ poll: data, createdAt: new Date(), owner: owner}, function(error, success) {
      //TODO More rigorous error checking when failed to insert
      return success;
    });
  },
  update_voter: function(voter_id, name, password, fakePassword, cin, gouvernerat) {
    console.log(voter_id + name + password + fakePassword + cin + gouvernerat)
  	return Voters.update(voter_id, {$set: {
      name: name,
      password: Auth.generatePasswordHash(password),
      fakePassword: Auth.generatePasswordHash(fakePassword),
      cin: cin,
      gouvernerat: gouvernerat,
      registered: true
    }});
  },
  register_voter: function(email, poll_id) {
    console.log('Register voter')
    var voter_id = createVoter("", email, "", "", "", "")
    console.log('Voter id : ' + voter_id)
    Email.send({
      to:email,
      from:"votingblockchain@gmail.com",
      subject:"Registration link",
      text:"Hello Mr, \n You're invited to register to this election follow this link to complete your registration infos : http://localhost:3000/vote/" + poll_id + "/register/" + voter_id
    });
    if(voter_id) {
      var idCred = Random.id()
      var current_poll = poll.findOne({_id:poll_id})
      console.log("Poll id: " + current_poll._id)
      var registeredVoters = current_poll.voters ? current_poll.voters : []
      registeredVoters.push(voter_id)
      var idCreds = current_poll.idCreds ? current_poll.idCreds : []
      idCreds.push(idCred)
      var shuffle = function shuffle(a) {
          var j, x, i;
          for (i = a.length; i; i--) {
              j = Math.floor(Math.random() * i);
              x = a[i - 1];
              a[i - 1] = a[j];
              a[j] = x;
          }
      }
      shuffle(registeredVoters)
      shuffle(idCreds)
      poll.update({_id:poll_id}, {$set: {voters: registeredVoters, idCreds: idCreds}})
      return voter_id
    } else {
      return false
    }
  },
  post_vote: function(poll_id, vote) {
    var current_poll = poll.findOne({_id:poll_id});
    var vote_limit = current_poll.poll.vote_limit;

    if (current_poll.votes) {
      if (vote_limit == current_poll.votes.length + 1) {
        poll.update({_id:poll_id}, {$set: {'poll.isvoted': true, 'poll.isactive':false}});
      }
    }
    var ip_connection = web3.sha3(this.connection.clientAddress);
    Uservotes.update({ _id: poll_id}, {$push: {connection: ip_connection}});
    return poll.update({_id:poll_id}, {$push: {votes: vote}});
  },
  get_accounts: function(poll_id) {
    check(poll_id, String);
    return EthAccounts.findOne({_id:poll_id});
  },
  store_account: function(poll_id, pubaddress, accounts) {
    poll.update({_id:poll_id}, {$set:{address:pubaddress}});
    accountstowatch.push(poll.findOne({_id:poll_id}));
    return EthAccounts.insert({_id:poll_id, address: pubaddress, account: accounts});
  },
  make_live: function(abi, address, poll_id, _block, start_date, end_date) {
    Uservotes.insert({ _id: poll_id});
    EthAccounts.update({_id:poll_id},{$set:{contract_abi:abi, contract_address:address}});
    poll.update({_id:poll_id}, {$set: {'poll.isactive': true, block: _block, startDate: start_date, endDate: end_date}});
    Meteor.setTimeout(function() {
      console.log("ID: " + poll_id + " went offline!");
      poll.update({_id:poll_id}, {$set: {'poll.isvoted': true, 'poll.isactive':false}});
    },(end_date - start_date));
    console.log("New timer set for Poll: " + poll_id);
  },
  already_voted: function(poll_id) {
    var ip_connection = web3.sha3(this.connection.clientAddress);
    return Uservotes.findOne({_id:poll_id, connection:ip_connection});
  }
});
