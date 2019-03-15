# servicebot-gcp-pub-sub

A plugin for servicebot that allows to publish lifecycle events to Google Pub/Sub

# Installation

The following actions are needed to enable this plugin:

- Copy the content of this repository to the correspondent `servicebot` directories.
- Add the following lines in `plugins/api-gateway/app.js`
```
    require("../../api/gcp-configs")(api)
    require("../../api/gcp-pub-subs")(api)
```
just after `require("../../api/webhooks")(api)`, for instance.
