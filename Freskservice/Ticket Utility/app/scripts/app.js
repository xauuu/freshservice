let client = null;
let ticket;
let user;
let serviceRequest;
let assetTypeList = []
let agents = []
const buttonView = document.getElementById("detail")
const buttonNewCheck = document.getElementById("new-check")
const buttonNewSchedule = document.getElementById("new-schedule")
const buttonEditCheck = document.getElementById("edit-check")
const buttonEditSchedule = document.getElementById("edit-schedule")

async function initApp(_client) {
  client = _client;
  const data = await client.data.get("ticket")
  const dataUser = await client.data.get("loggedInUser")
  user = dataUser.loggedInUser.user
  ticket = data.ticket
  serviceRequest = await getDetailSR(ticket.display_id)
  assetTypeList = await getAllAssetType()
  agents = await getAllAgent()
  handleEvent()
  receiveData()
  checkType(ticket.subject)
}

function receiveData() {
  client.instance.receive(async (e) => {
    const { type, data } = e.helper.getData();
    switch (type) {
      case ACTIONS.CREATE_CHECK_STOCKS:
        await createCheckStock(data)
        break;
      case ACTIONS.UPDATE_CHECK_STOCKS:
        await updateCheckStock(ticket.display_id, serviceRequest.id, data)
        break;
      case ACTIONS.CREATE_SCHEDULE_CALENDAR:
        await createScheduleCalendar(data)
        break;
      case ACTIONS.UPDATE_SCHEDULE_CALENDAR:
        await updateScheduleCalendar(ticket.display_id, serviceRequest.id, data)
        break;
      case ACTIONS.FILTER_AGENT:
        await filterAgent(data)
        break;
    }
  });
}

function handleEvent() {
  buttonView.addEventListener('click', function () {
    openCalendar()
  })
  buttonNewCheck.addEventListener('click', function () {
    client.interface.trigger("showModal", {
      title: "New Check Stocks",
      template: "modals/check-stocks.html",
      data: {
        list: assetTypeList,
        detail: serviceRequest?.custom_fields,
        agents
      }
    })
  })
  buttonNewSchedule.addEventListener('click', function () {
    client.interface.trigger("showModal", {
      title: "New Schedule Calendar",
      template: "modals/new-schedule.html",
      data: {
        agents,
        detail: serviceRequest?.custom_fields
      }
    })
  })
  buttonEditSchedule.addEventListener('click', function () {
    client.interface.trigger("showModal", {
      title: "Edit Schedule Calendar",
      template: "modals/edit-schedule.html",
      data: {
        agents,
        detail: serviceRequest?.custom_fields
      }
    })
  })
  buttonEditCheck.addEventListener('click', function () {
    client.interface.trigger("showModal", {
      title: "Edit Check Stocks",
      template: "modals/edit-check-stocks.html",
      data: {
        list: assetTypeList,
        detail: serviceRequest?.custom_fields,
        agents
      }
    })
  })
}

async function openCalendar() {
  client.interface.trigger("showModal", {
    title: "Calendar",
    template: "modals/calendar.html",
    data: { agents }
  })
}

async function getCalendars(ticket_id) {
  try {
    const res = await client.request.invokeTemplate("getAllScheduled", {
      context: { ticket_id }
    });
    const data = JSON.parse(res.response);
    return data.records
  } catch (error) {
    console.log(error)
  }
}

async function getScheduleByAgent(agent_email) {
  try {
    const res = await client.request.invokeTemplate("getScheduleByAgent", {
      context: { agent_email }
    });
    const data = JSON.parse(res.response);
    return data.records
  } catch (error) {
    console.log(error)
  }
}

async function filterAgent(data) {
  const response = await getScheduleByAgent(data.email)
  const calendars = mappingScheduled(response)

  client.instance.send({ message: { type: "FILTER_AGENT", calendars } });
}

async function getAllAssetType() {
  try {
    const res = await client.request.invokeTemplate("getAllAssetType", {});
    const data = JSON.parse(res.response);
    return data.records
  } catch (error) {
    console.log(error)
  }
}

async function getAllAgent() {
  try {
    const res = await client.request.invokeTemplate("getAllAgent", {});
    const data = JSON.parse(res.response);
    return data.agents
  } catch (error) {
    console.log(error)
  }
}

async function getDetailSR(id) {
  try {
    const res = await client.request.invokeTemplate("getDetailSR", {
      context: { id }
    });
    const data = JSON.parse(res.response);
    return data.requested_items[0]
  } catch (error) {
    console.log(error)
  }
}

async function createCheckStock(data) {
  try {
    const res = await client.request.invokeTemplate("createCheckStock", {
      body: JSON.stringify({
        "email": user.email,
        "parent_ticket_id": ticket.display_id,
        "custom_fields": data
      })
    });
    if (res.status === 200) {
      const { service_request } = JSON.parse(res.response)
      await addAgentToTicket(service_request.id, data.assign_to_agent)
    }
    showNotification("success", "Create new Check Stocks Successfully");
    closeModal()
  } catch (error) {
    showNotification("error", "The error occurred while creating new Check Stocks");
    console.log(error)
  }
}

async function updateCheckStock(ticket_id, id, data) {
  try {
    const res = await client.request.invokeTemplate("updateScheduleCalendar", {
      context: { ticket_id, id },
      body: JSON.stringify({
        "custom_fields": data
      })
    });

    if (res.status === 200) {
      const { requested_item } = JSON.parse(res.response)
      await addAgentToTicket(requested_item.ticket_id, data.assign_to_agent)
    }
    showNotification("success", "Update Check Stocks Successfully");
    closeModal()
  } catch (error) {
    showNotification("error", "The error occurred while updating Check Stocks");
    console.log(error)
  }
}

async function createScheduleCalendar(data) {
  try {
    const res = await client.request.invokeTemplate("createScheduleCalendar", {
      body: JSON.stringify({
        "email": user.email,
        "parent_ticket_id": ticket.display_id,
        "custom_fields": data
      })
    });
    console.log(res)
    if (res.status === 200) {
      const { service_request } = JSON.parse(res.response)
      await addAgentToTicket(service_request.id, data.assign_to_agent)
    }
    showNotification("success", "Create new Schedule Calendar Successfully");
    closeModal()
  } catch (error) {
    showNotification("error", "The error occurred while updating new Schedule Calendar");
    console.log(error)
  }
}

async function updateScheduleCalendar(ticket_id, id, data) {
  try {
    const res = await client.request.invokeTemplate("updateScheduleCalendar", {
      context: { ticket_id, id },
      body: JSON.stringify({
        "custom_fields": data
      })
    });

    if (res.status === 200) {
      const { requested_item } = JSON.parse(res.response)
      await addAgentToTicket(requested_item.ticket_id, data.assign_to_agent, ticket.status)
    }
    showNotification("success", "Update Schedule Calendar Successfully");
    closeModal()
  } catch (error) {
    showNotification("error", "The error occurred while updating Schedule Calendar");
    console.log(error)
  }
}

async function addAgentToTicket(id, agent_id, status = 0) {
  try {
    await client.request.invokeTemplate("addAgentToTicket", {
      context: { id },
      body: JSON.stringify({
        "responder_id": Number(agent_id),
        "status": status ? getNewStatus(status) : ticket.status
      })
    });
  } catch (error) {
    showNotification("error", "The error occurred when updating the agent for the ticket");
    console.log(error)
  }
}

function mappingScheduled(list) {
  return list?.map(item => {
    const { object_id: id, title, address, agent_email, agent_name } = item.data
    return {
      id: id,
      title: `[${id}] ${title}`,
      start: item.data.from_date_time.replace('Z', ''),
      end: item.data.to_date_time.replace('Z', ''),
      address: address,
      agent_name: agent_name,
      agent_email: agent_email
    };
  });
}

function getUniqueAgents(list) {
  const uniqueAgents = new Map();

  const agentList = list.reduce((acc, item) => {
    const { agent_name, agent_email } = item.data;
    if (agent_name && agent_email && !uniqueAgents.has(agent_email)) {
      uniqueAgents.set(agent_email, agent_name);
      acc.push({ agent_name, agent_email });
    }
    return acc;
  }, []);
  return agentList
}

function handleErr(err = 'None') {
  console.error(`Error occured. Details:`, err);
}

function checkType(type) {
  if (type?.includes("Support Order")) {
    buttonView.style.display = 'block'
    buttonNewCheck.style.display = 'block'
    buttonNewSchedule.style.display = 'block'
  } else if (type?.includes("Schedule Calendar")) {
    buttonEditSchedule.style.display = 'block'
  } else if (type?.includes("Check Stocks")) {
    buttonEditCheck.style.display = 'block'
  }
}

function showNotification(type, message) {
  client.interface.trigger("showNotify", {
    type: type,
    message: message
  })
}

function closeModal() {
  client.instance.send({ message: { type: ACTIONS.CLOSE_MODAL } });
}

function getNewStatus(status) {
  if (status === 6) return 7;
  if (status === 7) return 6;
  return 6
}

document.addEventListener('DOMContentLoaded', () => {
  app.initialized().then(initApp);
});
