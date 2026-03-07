const router = require("express").Router();
const { parseVoice } = require("../controllers/voice");
const middleware = require("../utils/middleware");

router.post(
  "/",
  (req, res, next) => {
    console.log("voice route hit, body:", req.body);
    next();
  },
  middleware.userExtractor,
  parseVoice
);

module.exports = router;
