import routeDefinition from "./view/form.jsx"

function* run(config, provide, channels) {
    yield provide({ routeDefinition })
}
export { run }
