module.exports = function(router) {
  require("./entity")(
    router,
    require("../models/base/entity")("gcp_pub_subs"),
    "gcp-pub-subs"
  )
}
