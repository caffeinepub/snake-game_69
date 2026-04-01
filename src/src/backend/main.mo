import Runtime "mo:core/Runtime";

actor {
  var highScore = 0;

  public shared ({ caller }) func submitScore(score : Nat) : async Bool {
    if (score <= highScore) {
      Runtime.trap("New score must be higher than current high score");
    };
    highScore := score;
    true;
  };

  public query ({ caller }) func getHighScore() : async Nat {
    highScore;
  };
};
