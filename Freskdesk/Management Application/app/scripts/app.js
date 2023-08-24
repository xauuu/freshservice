var client;
var map;
init();
initMap();

async function init() {
  client = await app.initialized();
  client.events.on("app.activated", onAppActivate);
  document.getElementById("createButton").addEventListener("click", openModal);
  getAllCustomObject();

  try {
    client.instance.receive(function (e) {
      let { message } = e.helper.getData();
      handleCreate(message);
    });
  } catch (error) {
    console.error(error);
  }
}

async function onAppActivate() {
  const data = await client.data.get("loggedInUser");
  document.getElementById("agentName").value = `Hello ${data.loggedInUser.contact.name},`;
  document.getElementById("btnSayHello").addEventListener("fwClick", function () {
    showNotification("success", `You clicked at ${new Date()}`);
    showBanner(`You clicked at ${new Date()}`);
  });
}

function showNotification(type, message) {
  return client.interface.trigger("showNotify", {
    type: type,
    message: message
  });
}

function showBanner(text) {
  document.getElementById("newTicketBanner").value = text;
}

function initMap() {
  map = new google.maps.Map(document.getElementById("initMap"), {
    center: { lat: 1.3139946, lng: 103.6794355 },
    zoom: 15
  });
}

async function getAllCustomObject() {
  try {
    const res = await client.request.invokeTemplate("getAllCustomObject", {});
    let html = "";
    const data = JSON.parse(res.response);
    data.records.forEach((item) => {
      const { name, address, code, postal_code } = item.data;
      const row = `<tr class="border-b dark:border-gray-700">
                    <th scope="row" class="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                      ${name}
                    </th>
                    <td class="px-4 py-3"> ${code}</td>
                    <td class="px-4 py-3"> ${address}</td>
                    <td class="px-4 py-3"> ${postal_code}</td>
                    <td class="px-4 py-3"> ${moment(item.created_time).startOf("hour").fromNow()}</td>
                </tr>`;
      html += row;
    });
    document.getElementById("listCO").innerHTML = html;
  } catch (error) {
    console.log(error);
  }
}

async function openModal() {
  try {
    // app.js
    await client.interface.trigger("showModal", {
      title: "Add record",
      template: "modal.html"
    });
  } catch (error) {
    // failure operation
    console.error(error);
  }
}

async function handleCreate(data) {
  const { name, address } = data;
  if (!name || !address) {
    showNotification("warning", "Please fill in all fields");
    return;
  }
  try {
    await client.request.invokeTemplate("createCustomObject", {
      body: JSON.stringify({ data })
    });
    await client.instance.send({
      message: true
    });
    getAllCustomObject();
    showNotification("success", "Successfully created custom object");
  } catch (error) {
    showNotification("error", "An error occurred");
    console.log(error);
  }
}
