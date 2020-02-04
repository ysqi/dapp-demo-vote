const PhotoVote = artifacts.require("PhotoVote");

contract("PhotoVote", function() {
  it("should assert true", async function(done) {
    await PhotoVote.deployed();
    assert.isTrue(true);
    done();
  });
});
