import React from "react"
import ReactTooltip from "react-tooltip"
import { Fetcher, ServicebotBaseForm, inputField } from "servicebot-base-form"
import { ServiceBotTableBase } from "../../../views/components/elements/bootstrap-tables/servicebot-table-base.jsx"
import Dropdown from "../../../views/components/elements/dropdown.jsx"
import { getFormattedDate } from "../../../views/components/utilities/date-format.jsx"
import { required } from "redux-form-validators"
import { Field } from "redux-form"
import Buttons from "../../../views/components/elements/buttons.jsx"
import Modal from "../../../views/components/utilities/modal.jsx"
import "../stylesheets/gcp-pub-subs.css"
import "../stylesheets/prism.css"
import Content from "../../../views/components/layouts/content.jsx"

const isJsonString = str => {
  try {
    JSON.parse(str)
  } catch (e) {
    return false
  }
  return true
}

const validJSON = value => {
  if (!value) return "Service account data is needed"
  if (!isJsonString(value)) return "Not a valid JSON"
  const key = JSON.parse(value)
  const fields = Object.keys(key)
  // check if the key has the right fields
  const requiredFields = [
    "type",
    "project_id",
    "private_key_id",
    "private_key",
    "client_email",
    "client_id",
    "auth_uri",
    "token_uri",
    "auth_provider_x509_cert_url",
    "client_x509_cert_url"
  ]
  const missingFields = requiredFields.reduce(
    (acc, f) => (fields.indexOf(f) > -1 ? acc : [...acc, f]),
    []
  )
  if (missingFields.length > 0)
    return `JSON fields missing: ${missingFields.join(", ")}`

  return undefined
}

const GCPConfigForm = props => {
  return (
    <form>
      <Field
        name="service_account_key"
        type="textarea"
        validate={[required(), validJSON]}
        component={inputField}
        placeholder="Service accout key in JSON format"
      />
      <Field
        name="project_id"
        type="text"
        validate={[required()]}
        component={inputField}
        placeholder="GCP project id"
      />
      <div className="sb-form-group buttons-group">
        <Buttons
          btnType="primary"
          text="Add GCP configuration"
          onClick={props.handleSubmit}
          type="submit"
          value="submit"
        />
      </div>
    </form>
  )
}

const GCPConfigModal = props => {
  let {
    show,
    hide,
    config,
    handleSuccessResponse,
    handleFailureResponse
  } = props
  let submissionRequest = {
    method: config.id ? "PUT" : "POST",
    url: config.id ? `/api/v1/gcp-configs/${config.id}` : `/api/v1/gcp-configs`
  }

  return (
    <Modal
      modalTitle={"New GCP configuration"}
      icon="fa-plus"
      hideCloseBtn={false}
      show={show}
      hide={hide}
      hideFooter={false}
    >
      <div className="p-20">
        <ServicebotBaseForm
          form={GCPConfigForm}
          initialValues={{ ...config }}
          submissionRequest={submissionRequest}
          successMessage={"GCP configuration added successfully"}
          handleResponse={handleSuccessResponse}
          handleFailure={handleFailureResponse}
          reShowForm={true}
        />
      </div>
    </Modal>
  )
}

const lifecycleEvents = [
  { value: "pre_provision", name: "Pre provision" },
  { value: "post_provision", name: "Post provision" },
  { value: "pre_decommission", name: "Pre decommission" },
  { value: "post_decommission", name: "Post decommission" },
  { value: "pre_reactivate", name: "Pre reactivate" },
  { value: "post_reactivate", name: "Post reactivate" },
  { value: "pre_property_change", name: "Pre property change" },
  { value: "post_property_change", name: "Post property change" },
  {
    value: "pre_payment_structure_change",
    name: "Pre payment structure change"
  },
  {
    value: "post_payment_structure_change",
    name: "Post payment structure change"
  },
  { value: "post_seat_created", name: "Post seat created" },
  { value: "post_seat_deleted", name: "Post seat deleted" },
  { value: "post_cancellation_pending", name: "Post cancellation pending" }
]

const GCPTriggerForm = props => {
  console.log("[GCPTriggerForm] props: ", props)
  return (
    <form>
      <Field
        name="topic"
        type="text"
        validate={[required()]}
        component={inputField}
        placeholder="GCP Pub/Sub Topic"
      />
      <div className={`sb-form-group`}>
        <Field
          name="gcp_config_id"
          component="select"
          placeholder="Servicebot event"
        >
          {props.configs.map((config, index) => (
            <option key={`conf-${index}`} value={config.id}>{`${
              config.project_id
            }:${config.id}`}</option>
          ))}
        </Field>
      </div>
      <div className={`sb-form-group`}>
        <Field name="event" component="select" placeholder="Servicebot event">
          {lifecycleEvents.map((event, index) => (
            <option key={`evt-${index}`} value={event.value}>{`${event.name} (${
              event.value
            })`}</option>
          ))}
        </Field>
      </div>
      <div className="sb-form-group buttons-group">
        <Buttons
          btnType="primary"
          text="Add GCP Pub/Sub trigger"
          onClick={props.handleSubmit}
          type="submit"
          value="submit"
        />
      </div>
    </form>
  )
}

const GCPTriggerModal = props => {
  let {
    show,
    hide,
    trigger,
    configs,
    handleSuccessResponse,
    handleFailureResponse
  } = props
  let submissionRequest = {
    method: trigger.id ? "PUT" : "POST",
    url: trigger.id
      ? `/api/v1/gcp-pub-subs/${trigger.id}`
      : `/api/v1/gcp-pub-subs`
  }

  return (
    <Modal
      modalTitle={"New GCP Pub/Sub trigger"}
      icon="fa-plus"
      hideCloseBtn={false}
      show={show}
      hide={hide}
      hideFooter={false}
    >
      <div className="p-20">
        <ServicebotBaseForm
          form={GCPTriggerForm}
          initialValues={{ ...trigger }}
          formProps={{ configs }}
          submissionRequest={submissionRequest}
          successMessage={"Pub/Sub trigger added successfully"}
          handleResponse={handleSuccessResponse}
          handleFailure={handleFailureResponse}
          reShowForm={true}
        />
      </div>
    </Modal>
  )
}

class GCPTestTriggerModal extends React.Component {
  constructor(props) {
    super()
    this.state = {
      testSteps: []
    }
  }

  async componentWillMount() {
    const { id, event } = this.props.trigger
    const response = await Fetcher(`/api/v1/gcp-pub-sub/test/${id}/${event}`)
    console.log("test steps received", response)
    this.setState({ testSteps: response.messages })
  }

  render() {
    const { show, hide, trigger } = this.props
    const { testSteps } = this.state
    let content = <h4>Please wait ...</h4>
    if (testSteps.length > 0)
      content = (
        <div>
          <h4>Results:</h4>
          <div className="test-results">
            <pre>
              <code class="lang-csharp">
                {testSteps.map(msg => (
                  <div>{msg}</div>
                ))}
              </code>
            </pre>
          </div>
        </div>
      )
    return (
      <Modal
        modalTitle={`Testing trigger ${trigger.id}`}
        icon="fa-plus"
        hideCloseBtn={false}
        show={show}
        hide={hide}
        hideFooter={false}
      >
        <div className="p-20">{content}</div>
      </Modal>
    )
  }
}

const timeFormater = cell => {
  return (
    <div className="datatable-date">
      <span
        data-tip={getFormattedDate(cell, { time: true })}
        data-for="date-updated"
      >
        {getFormattedDate(cell)}
      </span>
      <ReactTooltip
        id="date-updated"
        aria-haspopup="true"
        delayShow={400}
        role="date"
        place="left"
        effect="solid"
      />
    </div>
  )
}

class GCPPubSubs extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      openConfig: false,
      openTrigger: false,
      openTestTrigger: false,
      config: null,
      configs: [],
      trigger: null,
      triggers: [],
      loading: true,
      showEventsInfo: false,
      templates: [],
      secretKey: null,
      selectedTemplate: 0,
      selectedServer: "node"
    }
    this.fetchConfigsData = this.fetchConfigsData.bind(this)
    this.fetchTriggersData = this.fetchTriggersData.bind(this)
    this.openConfigForm = this.openConfigForm.bind(this)
    this.closeConfigForm = this.closeConfigForm.bind(this)
    this.openTriggerForm = this.openTriggerForm.bind(this)
    this.closeTriggerForm = this.closeTriggerForm.bind(this)
    this.deleteConfig = this.deleteConfig.bind(this)
    this.deleteTrigger = this.deleteTrigger.bind(this)
    this.openTestTriggerModal = this.openTestTriggerModal.bind(this)
    this.closeTestTriggerModal = this.closeTestTriggerModal.bind(this)
    this.handleSuccessResponse = this.handleSuccessResponse.bind(this)
    this.handleFailureResponse = this.handleFailureResponse.bind(this)
    this.showEvents = this.showEvents.bind(this)
    this.hideEvents = this.hideEvents.bind(this)
  }

  async componentDidMount() {
    let self = this
    let configs = await Fetcher(`/api/v1/gcp-configs/`)
    let triggers = await Fetcher(`/api/v1/gcp-pub-subs/`)
    let templates = await Fetcher(`/api/v1/service-templates/`)
    let secretKey = (await Fetcher(`/api/v1/system-options/secret`)).secret

    self.setState({ triggers, configs, templates, secretKey, loading: false })
  }

  /**
   * Fetches Table Data
   * Sets the state with the fetched data for use in ServiceBotTableBase's props.row
   */
  fetchConfigsData() {
    let self = this
    return Fetcher("/api/v1/gcp-configs").then(response => {
      if (!response.error) {
        self.setState({ configs: response })
      }
      self.setState({ loading: false })
    })
  }

  fetchTriggersData() {
    let self = this
    return Fetcher("/api/v1/gcp-pub-subs").then(response => {
      if (!response.error) {
        self.setState({ triggers: response })
      }
      self.setState({ loading: false })
    })
  }
  /**
   * Modal Controls
   * Open and close modals by setting the state for rendering the modals,
   */
  deleteConfig(config) {
    let self = this
    Fetcher("/api/v1/gcp-configs/" + config.id, "DELETE").then(response => {
      if (!response.error) {
        self.fetchConfigsData()
      }
    })
  }

  deleteTrigger(trigger) {
    let self = this
    Fetcher("/api/v1/gcp-pub-subs/" + trigger.id, "DELETE").then(response => {
      if (!response.error) {
        self.fetchTriggersData()
      }
    })
  }

  openConfigForm(config) {
    this.setState({ openConfig: true, config })
  }

  closeConfigForm() {
    this.fetchConfigsData()
    this.setState({ openConfig: false, config: {}, lastFetch: Date.now() })
  }

  openTriggerForm(trigger) {
    this.setState({ openTrigger: true, trigger })
  }

  closeTriggerForm() {
    this.fetchTriggersData()
    this.setState({ openTrigger: false, trigger: {}, lastFetch: Date.now() })
  }

  openTestTriggerModal(trigger) {
    this.setState({ openTestTrigger: true, trigger })
  }

  closeTestTriggerModal() {
    this.setState({
      openTestTrigger: false,
      trigger: {},
      lastFetch: Date.now()
    })
  }

  handleSuccessResponse() {
    this.setState({
      openConfig: false,
      openTrigger: false,
      openTestTrigger: false,
      config: {},
      trigger: {},
      lastFetch: Date.now(),
      alerts: {
        type: "success",
        icon: "check",
        message: "Update has been successful"
      }
    })
    // ask the server to reload
    Fetcher("/api/v1/gcp-pub-sub/reload").then(response => {
      console.log("[GCP-PUB-SUB] server configuration reloaded:", response)
    })
    //re-render
    this.fetchConfigsData()
    this.fetchTriggersData()
  }

  handleFailureResponse(response) {
    if (response.error) {
      this.setState({
        alerts: {
          type: "danger",
          icon: "times",
          message: response.error
        }
      })
    }
  }

  showEvents() {
    this.setState({ showEventsInfo: true })
  }

  hideEvents() {
    this.setState({ showEventsInfo: false })
  }

  rowConfigActionsFormater(cell, row) {
    let dropdownOptions = [
      {
        type: "button",
        label: "Edit",
        action: () => {
          return this.openConfigForm(row)
        }
      },
      {
        type: "button",
        label: "Delete",
        action: () => {
          return this.deleteConfig(row)
        }
      }
    ]

    return <Dropdown direction="right" dropdown={dropdownOptions} />
  }

  rowTriggerActionsFormater(cell, row) {
    let dropdownOptions = [
      {
        type: "button",
        label: "Edit",
        action: () => {
          return this.openTriggerForm(row)
        }
      },
      {
        type: "button",
        label: "Delete",
        action: () => {
          return this.deleteTrigger(row)
        }
      },
      {
        type: "button",
        label: "Test",
        action: () => {
          return this.openTestTriggerModal(row)
        }
      }
    ]

    return <Dropdown direction="right" dropdown={dropdownOptions} />
  }

  render() {
    // TODO: is *self* usage really neccesary?
    let self = this
    let {
      openConfig,
      config,
      openTrigger,
      openTestTrigger,
      trigger,
      configs
    } = this.state
    const endpointModals = () => {
      if (openConfig) {
        return (
          <GCPConfigModal
            handleSuccessResponse={self.handleSuccessResponse}
            handleFailureResponse={self.handleFailureResponse}
            config={config}
            show={self.openConfigForm}
            hide={this.closeConfigForm}
          />
        )
      } else if (openTrigger) {
        return (
          <GCPTriggerModal
            handleSuccessResponse={self.handleSuccessResponse}
            handleFailureResponse={self.handleFailureResponse}
            trigger={trigger}
            configs={configs}
            show={self.openTriggerForm}
            hide={this.closeTriggerForm}
          />
        )
      } else if (openTestTrigger) {
        return (
          <GCPTestTriggerModal
            trigger={trigger}
            show={this.openTestTriggerModal}
            hide={this.closeTestTriggerModal}
          />
        )
      } else {
        return null
      }
    }
    return (
      <div>
        <div className="app-content __servicebot-webhooks" id="payment-form">
          <Content>
            <div className={`_title-container`}>
              <h1 className={`_heading`}>GCP Pub/Sub</h1>
            </div>
            <div className={`_section`}>
              <h3>Overview</h3>
              <div className="tiers">
                <div className={`_tier-details`}>
                  <span>
                    Servicebot can publish messages to topics in Google Cloud
                    Pub/Sub that notify your application or third-party system
                    any time an event happens. Use it for events, like new
                    customer subscription or trial expiration, that your SaaS
                    needs to know about.
                  </span>
                </div>
              </div>
            </div>
            <div className="_section">
              <h3>Manage Google Cloud Pub/Sub triggers</h3>
              <div className="tiers">
                <ServiceBotTableBase
                  rows={this.state.triggers}
                  fetchRows={this.fetchTriggersData}
                  sortColumn="created_at"
                  sortOrder="desc"
                >
                  <TableHeaderColumn
                    isKey
                    dataField="id"
                    dataSort={true}
                    width="50"
                  >
                    Id
                  </TableHeaderColumn>
                  <TableHeaderColumn
                    dataField="gcp_config_id"
                    dataSort={true}
                    width="50"
                  >
                    GCP Config
                  </TableHeaderColumn>
                  <TableHeaderColumn
                    dataField="topic"
                    dataSort={true}
                    width="120"
                  >
                    GCP Pub/Sub Topic
                  </TableHeaderColumn>
                  <TableHeaderColumn
                    dataField="event"
                    dataSort={true}
                    width="120"
                  >
                    Servicebot Event
                  </TableHeaderColumn>
                  <TableHeaderColumn
                    dataField="created_at"
                    dataFormat={timeFormater}
                    dataSort={true}
                    searchable={false}
                    width="120"
                  >
                    Created At
                  </TableHeaderColumn>
                  <TableHeaderColumn
                    dataField="updated_at"
                    dataFormat={timeFormater}
                    dataSort={true}
                    searchable={false}
                    width="120"
                  >
                    Updated At
                  </TableHeaderColumn>
                  <TableHeaderColumn
                    dataField="Actions"
                    className={"action-column-header"}
                    columnClassName={"action-column"}
                    dataFormat={this.rowTriggerActionsFormater.bind(this)}
                    searchable={false}
                    width="80"
                    filter={false}
                  />
                </ServiceBotTableBase>
                <div className="hook-actions buttons-group __gap">
                  <button
                    className="buttons _primary"
                    onClick={() => {
                      self.openTriggerForm({})
                    }}
                    type="submit"
                    value="submit"
                  >
                    <i className="fa fa-plus" />
                    Add GCP Pub/Sub trigger
                  </button>
                </div>
              </div>
            </div>

            <div className="_section">
              <h3>Manage Google Cloud Configurations</h3>
              <div className="tiers">
                <ServiceBotTableBase
                  rows={this.state.configs}
                  fetchRows={this.fetchConfigsData}
                  sortColumn="created_at"
                  sortOrder="desc"
                >
                  <TableHeaderColumn
                    isKey
                    dataField="id"
                    dataSort={true}
                    width="50"
                  >
                    Id
                  </TableHeaderColumn>
                  <TableHeaderColumn
                    dataField="project_id"
                    dataSort={true}
                    width="80"
                  >
                    GCP Project Id
                  </TableHeaderColumn>
                  <TableHeaderColumn
                    dataField="service_account_key"
                    dataSort={true}
                    width="280"
                  >
                    Service Account Key
                  </TableHeaderColumn>
                  <TableHeaderColumn
                    dataField="created_at"
                    dataFormat={timeFormater}
                    dataSort={true}
                    searchable={false}
                    width="120"
                  >
                    Created At
                  </TableHeaderColumn>
                  <TableHeaderColumn
                    dataField="updated_at"
                    dataFormat={timeFormater}
                    dataSort={true}
                    searchable={false}
                    width="120"
                  >
                    Updated At
                  </TableHeaderColumn>
                  <TableHeaderColumn
                    dataField="Actions"
                    className={"action-column-header"}
                    columnClassName={"action-column"}
                    dataFormat={this.rowConfigActionsFormater.bind(this)}
                    searchable={false}
                    width="80"
                    filter={false}
                  />
                </ServiceBotTableBase>
                <div className="hook-actions buttons-group __gap">
                  <button
                    className="buttons _primary"
                    onClick={() => {
                      self.openConfigForm({})
                    }}
                    type="submit"
                    value="submit"
                  >
                    <i className="fa fa-plus" />
                    Add GCP configuration
                  </button>
                </div>
              </div>
            </div>
            {endpointModals()}
          </Content>
        </div>
      </div>
    )
  }
}

const RouteDefinition = {
  component: GCPPubSubs,
  navType: "settings",
  name: "GCP Pub/Sub Settings",
  path: "/gcp-pub-sub",
  isVisible: user => {
    //todo: this is dirty, need to do permission based...
    return user.role_id === 1
  }
}

export default RouteDefinition
