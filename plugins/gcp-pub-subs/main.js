let {
  call,
  put,
  all,
  select,
  fork,
  spawn,
  take
} = require("redux-saga/effects")

let consume = require("pluginbot/effects/consume")
let bcrypt = require("bcryptjs")
let fetch = require("node-fetch")
let Promise = require("bluebird")
const crypto = require("crypto")
function* run(config, provide, channels) {
  let db = yield consume(channels.database)
  // create tables if they don't exist
  yield call(db.createTableIfNotExist, "gcp_configs", function(table) {
    table.increments()
    table.string("project_id").notNullable()
    table.string("service_account_key", 4000).notNullable()
    table.timestamps(true, true)
    console.log("Created 'gpc_configs ' table.")
  })
  yield call(db.createTableIfNotExist, "gcp_pub_subs", function(table) {
    table.increments()
    table.string("topic").notNullable()
    table.string("event").notNullable()
    table.string("health")
    table.timestamps(true, true)
    table
      .integer("gcp_config_id")
      .notNullable()
      .unsigned()
      .references("gcp_configs.id")
      .onDelete("CASCADE")
    console.log("Created 'gcp_pub_subs ' table.")
  })

  let sendToPubSub = eventName => async (event, sync_all = false) => {
    console.log("[gcp-pub-sub] sending to pub/sub", eventName)
  }

  let lifecycleHook = [
    {
      stage: "pre",
      run: sendToPubSub("pre_provision")
    },
    {
      stage: "post",
      run: sendToPubSub("post_provision")
    },
    {
      stage: "pre_decom",
      run: sendToPubSub("pre_decommission")
    },
    {
      stage: "post_decom",
      run: sendToPubSub("post_decommission")
    },
    {
      stage: "pre_reactivate",
      run: sendToPubSub("pre_reactivate")
    },
    {
      stage: "post_reactivate",
      run: sendToPubSub("post_reactivate")
    },
    {
      stage: "pre_property_change",
      run: sendToPubSub("pre_property_change")
    },
    {
      stage: "post_property_change",
      run: sendToPubSub("post_property_change")
    },
    {
      stage: "pre_payment_structure_change",
      run: sendToPubSub("pre_payment_structure_change")
    },
    {
      stage: "post_payment_structure_change",
      run: sendToPubSub("post_payment_structure_change")
    },
    {
      stage: "post_seat_created",
      run: sendToPubSub("post_seat_created")
    },
    {
      stage: "post_seat_deleted",
      run: sendToPubSub("post_seat_deleted")
    },
    {
      stage: "post_cancellation_pending",
      run: sendToPubSub("post_cancellation_pending")
    }
  ]

  let processWebhooks = async (req, res, next) => {
    let responses = await sendToPubSub("test")(
      { event_name: "test", event_data: { test: "data" } },
      true
    )
    res.json({ responses: responses })
  }

  let generateHmac = function(body, secret) {
    const hmac = crypto.createHmac("sha256", secret)
    hmac.update(body)
    return hmac.digest("hex")
  }

  yield provide({ lifecycleHook })
}

module.exports = { run }
