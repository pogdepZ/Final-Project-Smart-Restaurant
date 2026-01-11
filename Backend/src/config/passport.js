const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const config = require("../config/index"); // file config bạn đã có (chứa auth.jwtSecret hoặc jwt access secret)

module.exports = (passport) => {
  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.auth.jwtAccessSecret || config.auth.jwtSecret, 
    // ^ tuỳ bạn đặt tên trong config:
    // - nếu bạn có config.auth.jwtAccessSecret -> dùng cái đó
    // - còn không thì dùng config.auth.jwtSecret
  };

  passport.use(
    new JwtStrategy(opts, async (payload, done) => {
      try {
        // payload là thứ bạn sign: { id, role, ... }
        // Nếu muốn lấy user từ DB để chắc chắn user còn tồn tại:
        // const user = await userRepository.findById(payload.id);
        // if (!user) return done(null, false);

        return done(null, payload); // gán payload vào req.user
      } catch (err) {
        return done(err, false);
      }
    })
  );
};
