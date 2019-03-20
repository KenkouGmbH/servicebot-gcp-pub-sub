# servicebot-gcp-pub-sub

A plugin for servicebot that allows to publish lifecycle events to Google Pub/Sub

## Installation

The following actions are needed to enable this plugin:

- Install the GCP `NodeJS` client library:
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

## Usage

First you create a least one valid `GCP` configuration. In this configuration you provide a service account key in JSON format together with your `GCP` project id. This service account should have the right permissions to operate `Google Cloud Pub/Sub`. You can create as many configurations as you want.

After a successful completion of the previous step you can add then a **`trigger`**, which you can associate with the available `GCP` configurations which will appear in a dropdown component. This `trigger` will publish a message to the `topic` set when the `event` set happens in `servicebot`. The message published is the `servicebot` event itself in JSON. The topic will be created if it doesn't exist.

That's all. You can make a basic test for your `trigger` by going to the correspondent `actions` button and clicking `Test`. This will attempt to create a new pubsub `topic` with a `subscription` attached to it and later delete both. Notice that the test may take a few seconds.

## Servicebot events:

In version `v0.11.163` the following are the events defined along with some simple description and whether their are implemented or not:

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
- [] `post_seat_deleted`.
- [X] `post_cancellation_pending`. Called just after the request for a subscription to be cancelled at a given day in the future.
