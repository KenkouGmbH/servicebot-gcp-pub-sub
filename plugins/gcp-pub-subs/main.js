const { call } = require("redux-saga/effects")
const { PubSub } = require("@google-cloud/pubsub")
let consume = require("pluginbot/effects/consume")
let bcrypt = require("bcryptjs")
let fetch = require("node-fetch")
let fs = require("fs")

function* run(config, provide, channels) {
  let db = yield consume(channels.database)
  // create gcp_configs table
  yield call(db.createTableIfNotExist, "gcp_configs", function(table) {
    table.increments()
    table.string("project_id").notNullable()
    table.string("service_account_key", 4000).notNullable()
    table.timestamps(true, true)
    console.log("Created 'gcp_configs ' table.")
  })

  // create gcp_pub_subs table
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

  // create temporary files with the content of the
  // service accountm key
  const getKeyFilenameFromId = id => `/tmp/service-account-${id}.json`
  const createTempKeyFile = ({ id, service_account_key }) =>
    new Promise((resolve, reject) => {
      // create temp file
      const fileName = getKeyFilenameFromId(id)
      fs.writeFile(fileName, service_account_key, function(err) {
        if (err) reject(err)
        console.log(`${fileName} created`)
        resolve()
      })
    })

  const registerHook = ({ id, event, topic, project_id, gcp_config_id }) => {
    if (!pubsubs[event]) pubsubs[event] = []
    pubsubs[event].push({
      id,
      topic,
      client: new PubSub({
        projectId: project_id,
        keyFilename: getKeyFilenameFromId(gcp_config_id)
      })
    })
  }

  // Initialising
  let pubsubs
  const load = async () => {
    console.log("Initialising gcp service account files")
    // clean the previous configurations
    pubsubs = {}
    // dump the configurations already setup
    // get all gcp configurations
    const configs = await db
      .select("id", "service_account_key")
      .from("gcp_configs")
    console.log("[GCP-PUB-SUB] configs found", configs)
    await Promise.all(configs.map(createTempKeyFile))
    // get all the triggers
    const triggers = await db
      .select(
        "gcp_pub_subs.id",
        "topic",
        "event",
        "gcp_config_id",
        "project_id"
      )
      .from("gcp_pub_subs")
      .innerJoin("gcp_configs", "gcp_pub_subs.gcp_config_id", "gcp_configs.id")
    // console.log("[GCP-PUB-SUB] triggers found", triggers)
    triggers.forEach(registerHook)
    console.log("[GCP-PUB-SUB] pubsubs configured", pubsubs)
  }

  // bootstrap
  yield call(load)

  const sendToPubSub = eventName => async (event, sync_all = false) => {
    console.log("[GCP-PUB-SUB] sending to pub/sub", eventName, event)
    if (pubsubs[eventName]) {
      try {
        const messageIds = await Promise.all(
          pubsubs[eventName].map(({ client, topic }) =>
            client
              .topic(topic, { autoCreate: true })
              .publish(Buffer.from(JSON.stringify(event)))
          )
        )
        console.log(`message with id ${messageIds} sent`)
      } catch (error) {
        console.warn("something went wrong:", error)
      }
    }
  }

  const lifecycleHook = [
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

  const reloadTriggers = async (req, res, next) => {
    console.log("[GCP-PUB-SUB] reloading ")
    await load()
    res.json({ reload: "success" })
  }

  const testTrigger = async (req, res, next) => {
    const { id, event } = req.params
    console.log("[GCP-PUB-SUB] testing trigger id:", id, " event:", event)
    try {
      const messages = []
      // get the correspondent client
      const { client: pubsub, topic: topicName } = pubsubs[event].filter(
        c => `${c.id}` === id
      )[0]
      messages.push("const pubsub = new PubSub({...})")
      // Creates the new topic
      const topic = await pubsub.topic(topicName, { autoCreate: true })

      messages.push(`const topicName = "${topicName}"`)
      messages.push(
        "const topic = await pubsub.topic(topicName, { autoCreate: true })"
      )
      messages.push(`=> Topic ${topic.name} created.`)
      const subscriptionName = "servicebot-test-subscription"
      const subscription = await topic
        .subscription(subscriptionName)
        .get({ autoCreate: true })

      messages.push(`const subscriptionName = "servicebot-test-subscription"`)
      messages.push(
        `const subscription = await topic.createSubscription(subscriptionName)`
      )
      messages.push(`=> Subscription ${subscriptionName} created.`)

      await pubsub.subscription(subscriptionName).delete()
      messages.push(`await pubsub.subscription(subscriptionName).delete();`)
      messages.push(`=> Subscription ${subscriptionName} deleted.`)

      res.json({ test: "success", messages })
    } catch (e) {
      next(e)
    }
  }

  const routeDefinition = [
    {
      endpoint: "/gcp-pub-sub/reload",
      method: "get",
      middleware: [reloadTriggers],
      permissions: [],
      description: "Reload and set all the triggers"
    },
    {
      endpoint: "/gcp-pub-sub/test/:id/:event",
      method: "get",
      middleware: [testTrigger],
      permissions: [],
      description:
        "Check if the trigger can create a topic, push a message to it and read it"
    }
  ]

  yield provide({ lifecycleHook, routeDefinition })
}

module.exports = { run }
