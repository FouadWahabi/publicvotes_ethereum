Meteor.publish('pollListings', function() {
  return poll.find({});
});


Meteor.publish('votersListings', function() {
  return Voters.find({});
});


Meteor.publish('votersSessionListings', function() {
  return VoterSessions.find({});
});
