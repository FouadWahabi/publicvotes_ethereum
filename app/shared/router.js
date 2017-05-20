Router.route('/', {
  template: 'main',
  onBeforeAction: function() {
    if(Session.get("token") === 'unknown') {
        Router.go('auth')
    }
    this.next();
  }
});

Router.route('/auth', {
  name: 'auth',
  template: 'auth',
  data: function() {

  },
  onBeforeAction: function() {
    if(Session.get("token") !== 'unknown') {
      console.log(Session.get("token"))
        Router.go('/')
    }
    this.next();
  }
});

Router.route('/polls', {
  name: 'polls',
  template: 'all_polls'
});

Router.route('/vote/:_id', {
  name: 'vote',
  template: 'vote',
  data: function() {
    poll: {
      //TODO: Instead of storing ID in Session, store the actual vote
      var current_poll = poll.findOne({_id: this.params._id});
      return current_poll
    }
  },
  onBeforeAction: function() {
    var vote_id = this.params._id;
    var current_poll = poll.findOne({_id: this.params._id});
    Meteor.call('currentUser', getSessionToken(), function(error, user) {
      if(error) {
        console.log(error)
      } else {
        console.log(user)
      }
      if(!error && user._id !== current_poll.owner) {
        Router.go('/')
      }
    })

    this.next();
  }
});

Router.route('/vote/:_id/register/:_userId', {
  name: 'registerVoter',
  template: 'registerVoter',
  data: function() {
    voter_id: this.params._userId
  },
  onBeforeAction: function() {
    var vote_id = this.params._id;
    var user_id = this.params._userId;
    var current_poll = poll.findOne({_id: this.params._id});
    Meteor.call('currentUser', getSessionToken(), function(error, user) {
      console.log(user)

      if(!error && user._id === user_id) {
        console.log("user id")
        Router.go('/')
      }
    })

    var user = Voters.findOne({_id: user_id})

    console.log(user)

    if(user.registered) {
      console.log("already registered")
      Router.go('/')
    }

    if(current_poll.voters.indexOf(user_id) < 0) {
      console.log("voted")
      Router.go('/')
    }

    this.next();

  }
});

Router.route('/vote/:_id/voted', {
  name: 'voted',
  template: 'voted',
  data: function() {
    poll: {
      //TODO: Instead of storing ID in Session, store the actual vote
      var current_poll = poll.findOne({_id: this.params._id});
      return current_poll;
    }
  },
  onBeforeAction: function() {
    var cont = this.next;
    var vote_id = this.params._id;
    var current_poll = poll.findOne({_id: this.params._id});
    if (current_poll) {
      if (current_poll.poll.isvoted) {
        cont();
      }
      else {
        Meteor.call('already_voted', vote_id, function(error, success) {
          if (success) {
            cont();
          }
          else {
            var route = "/vote/" + vote_id;
            Router.go(route);
          }
        });
      }
    }

    cont();
  }
});
