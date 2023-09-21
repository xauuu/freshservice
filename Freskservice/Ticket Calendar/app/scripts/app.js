document.onreadystatechange = function () {
  if (document.readyState === 'interactive') renderApp();

  function renderApp() {
    var onInit = app.initialized();
    onInit
      .then(function getClient(_client) {
        window.client = _client;
        client.events.on('app.activated', onActivated);
      })
      .catch(handleErr);

    document.getElementById("detail").addEventListener('click', function () {
      onActivated()
    })
  }
};

// Ticket Utility

function onActivated() {
  client.data.get("ticket").then(
    async function (data) {
      console.log(data)
      id = data.ticket.display_id
      const response = await getCalendars(id)
      const calendars = mappingScheduled(response)
      const agents = getUniqueAgents(response)
      client.interface.trigger("showModal", {
        title: "Calendar",
        template: "calendar.html",
        data: { calendars, agents }
      })
    }
  );
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