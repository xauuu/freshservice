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

function onActivated() {
  client.data.get("ticket").then(
    async function (data) {
      id = data.ticket.display_id
      const [requested, details] = await Promise.all([getRequestedItems(id), getDetails(id)])

      client.interface.trigger("showModal", {
        title: "Ticket Detail",
        template: "full.html",
        data: { requested, details }
      })
    }
  );
}

async function getRequestedItems(id) {
  try {
    const res = await client.request.invokeTemplate("getRequestedItems", {
      context: { id }
    });
    const data = JSON.parse(res.response);
    return data.requested_items[0]
  } catch (error) {
    console.log(error)
  }
}

async function getDetails(id) {
  try {

    const res = await client.request.invokeTemplate("getDetailTicket", {
      context: { id }
    });
    const data = JSON.parse(res.response);
    return data.records
  } catch (error) {
    console.log(error)
  }
}
function handleErr(err = 'None') {
  console.error(`Error occured. Details:`, err);
}