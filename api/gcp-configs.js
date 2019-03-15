module.exports = function(router) {
  require("./entity")(
    router,
    require("../models/base/entity")("gcp_configs"),
    "gcp-configs"
  )
}
