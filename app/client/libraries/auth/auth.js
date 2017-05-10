
/*******************************************
* Voters
*******************************************/

var createVoter= function (name, email, password, fakePassword, cin, gouvernerat, cb) {
  Meteor.call("createVoter", name, email, password, fakePassword, cin, gouvernerat, cb);
}

/*******************************************
* Authentication
*******************************************/

var login= function (email, password, cb) {
  Meteor.call("login", email, password, cb);
}

var logout= function () {
  return Meteor.call("logout", getSessionToken());
}

Template.auth.is_authenticated = function () {
	return getSessionToken() !== "unknown";
};

Template.auth.events({
  'click #submitRegister': function(event) {
    event.preventDefault();
    var voter = {
      'name': '',
      'cin': '',
      'email': '',
      'birth':'',
      'gov':'',
      'password': '',
      'fakePassword': ''
    }

    voter['name']= $('#register').find('#full_name').val();
    voter['email']= $('#register').find('#email').val();
    voter['cin'] = $('#register').find('#cin').val();
    voter['birth']= $('#register').find('#datepicker').val();
    voter['gov'] = $('#register').find('#gouvernerat').val();
    voter['password'] = $('#register').find('#password').val();
    voter['fakePassword'] = $('#register').find('#fakePassword').val();
    createVoter(voter['name'], voter['email'], voter['password'], voter['fakePassword'], voter['cin'], voter['gouvernerat'], function (error, result) {
      if (!error) {
        console.log('Do register')
        login(voter['email'], voter['password'], function(error, sessionToken) {
          if(!error) {
            console.log('Session token : ' + sessionToken);
            rememberSessionToken(sessionToken);
            Router.go('/')
          }
        })
      } else {
        console.log('Theres and error ' + error)
      }
    });
  },
  'click #submitLogin': function(event) {
    event.preventDefault();

    login($('#login').find('#email').val(), $('#login').find('#password').val(), function(error, sessionToken) {
      if(!error) {
        rememberSessionToken(sessionToken);
        Router.go('/')
      }
    })
  }
});
