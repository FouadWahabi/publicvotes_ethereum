var NewPoll = artifacts.require("./NewPoll.sol");

module.exports = function(deployer) {
  deployer.deploy(NewPoll);
};
