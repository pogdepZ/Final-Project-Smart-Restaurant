const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const config = require("../config/index"); // file config bạn đã có (chứa auth.jwtSecret hoặc jwt access secret)

module.exports = (passport) => {
  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.auth.accessTokenSecret,
  };

  passport.use(
    new JwtStrategy(opts, async (payload, done) => {
      try {
        return done(null, payload); 
      } catch (err) {
        return done(err, false);
      }
    })
  );
};
