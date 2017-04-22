Session.set('NumberOfOptions', 2);
Meteor.subscribe('poll_listings');

Template.registerHelper('and',(a,b)=>{
  return a && b;
});
Template.registerHelper('or',(a,b)=>{
  return a || b;
});

Template.timelimit.helpers({
  hours: function(){
    return [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];
  },
  days: function() {
    return [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14];
  }
});

Template.poll_listed.helpers({
  countpolls: function() {
    return (poll.find({'poll.isactive':false}).count() > 0);
  },
  six_polls: function() {
    var all_polls = poll.find({"poll.isactive":false}, {sort: {createdAt: -1}}).fetch();
    return all_polls.slice(0,6);

  },
  get_votes: function() {
    var cur_poll = this;
    var vote_limit = cur_poll.poll.vote_limit;

    if (cur_poll.votes) {
      if (vote_limit) {
        return cur_poll.votes.length + "/" + vote_limit;
      }
      else {
        return cur_poll.votes.length;
      }
    }
    else {
      if (vote_limit) {
        return "0 /" + vote_limit;
      }
      else {
        return 0
      }
    }
  }
});

Template.poll_listed.events({
  'click #registerVoter': function(event) {
    console .log('Register')
    var current_poll = $(event.currentTarget).attr('pollid');
    var isready = $(event.currentTarget).attr('isready')
    console.log(isready)
    Meteor.call('register_voter', getSessionToken(), current_poll, function(error, success) {
      if(!error) {
        if(isready) {
          Router.go('voted')
        } else {
          new Confirmation({
            message: "Thanks for registering ! check your inbox please to get you vote credentials",
            title: "Confirmation",
            okText: "Ok",
            success: true,
          }, function (ok) {

          });
        }
      }
    })
  }
})


Template.more_options.events({
  'click #add_option' : function () {
    console.log('Add option')
    //Update session storage for NumberOfOptions
    var numOptions = Session.get('NumberOfOptions') + 1;

    if (numOptions <= 10) {
      //Create new DOM element for additional Option
      var new_option = document.createElement("div");
      new_option.className = "form-group";
      new_option.innerHTML = '<input id="option-' + numOptions + '" type="text" value="" maxlength="20" placeholder="Option ' + numOptions +'" class="form-control poll_options" />';
      document.getElementById('options').appendChild(new_option);

      Session.set('NumberOfOptions', numOptions);
    }
  },
  'click #rmv_option' : function() {
    var numOptions = Session.get('NumberOfOptions');

    if (numOptions > 2) {
      var elementId = 'option-' + numOptions;
      var element_to_remove = document.getElementById(elementId).parentNode;
      document.getElementById('options').removeChild(element_to_remove);

      //Update Session
      Session.set('NumberOfOptions', numOptions - 1);
    }
  }
});

Template.main.events({
  'click #submit': function(event) {
    event.preventDefault();
    num_options = Session.get('NumberOfOptions');
    var poll = {
      'name': '',
      'description': '',
      'options':'',
      'isactive':false,
      'ready':false,
      'voter': []
    }

    poll['name']= $('#name_poll').val();
    poll['description'] = $('#description').val();
    var option = [];
    for (var i = 1; i <= num_options; i++) {
      element_id = "#option-" + i;
      option.push($(element_id).val());
    }

    poll['options'] = option;
    // poll['public'] = $('#public_poll_switch').is(":checked");
    //poll['multi_option'] = $('#multi_option_switch').is(":checked");
    // poll['vote_limit'] = parseInt($('#vote_limit').val());
    // var hours = $('#hour_limit option:selected').text();
    // var days = $('#day_limit option:selected').text();

    // poll['limit_hours'] = parseInt(hours.match(/\d+/)[0]);
    // poll['limit_days'] = parseInt(days.match(/\d+/)[0]);

    Meteor.call('post_data', getSessionToken(), poll, function(error, success) {
      Router.go('vote', {_id: success});
    });
  }
});
