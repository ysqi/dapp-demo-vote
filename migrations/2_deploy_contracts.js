const PhotoVote = artifacts.require("PhotoVote");
module.exports = function(_deployer) {
  // Use deployer to state migration tasks.
  _deployer.deploy(PhotoVote);
};
