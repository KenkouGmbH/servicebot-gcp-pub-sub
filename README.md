# servicebot-gcp-pub-sub

A plugin for servicebot that allows to publish lifecycle events to Google Pub/Sub

# Installation

The following actions are needed to enable this plugin:

- Install the GCP `NodeJS` client library if you haven't done it yet:
```
    npm install --save @google-cloud/pubsub
```
- Copy the content of this repository to the correspondent `servicebot` directories.
- Add the following lines in `plugins/api-gateway/app.js`:
```
    require("../../api/gcp-configs")(api)
    require("../../api/gcp-pub-subs")(api)
```
just after `require("../../api/webhooks")(api)`, for instance.
- finally register the plugin in `config/pluginbot.config.js` by adding:
```
    ...
    {"path" : `${PLUGIN_DIRECTORY}/gcp-pub-subs`},
    ...
```
to the list of base plugins.

# Servicebot events:
Currently in version `v0.11.163` these are the events defined along with its meaning and whether their are implemented or not:

- [X] `pre_provision`. Called before a new subscription is created.
- [X] `post_provision`. Called after the new subscription is created.
- [X] `pre_decommission`. Called before removing a subscription.
- [X] `post_decommission`. Called after removing a subscription.
- [X] `pre_reactivate`. Called before a subscription change its status from `cancelled` to another status.
- [X] `post_reactivate`. Called after a subscription change its status due to an update in the payment plan.
- [X] `pre_property_change`. Called before a subscription changes any of its properties. 
- [X] `post_property_change`. Called after a subscription changes any of its properties. 
- [X] `pre_payment_structure_change`. Called before a new payment structure is applied to a subscription.
- [X] `post_payment_structure_change`. Called after a new payment structure is applied to a subscription.
- [] `post_seat_created`. 
- [] `post_seat_deleted`
- [X] `post_cancellation_pending`. Called just after the request for a subscription to be cancelled at a given day in the future.
