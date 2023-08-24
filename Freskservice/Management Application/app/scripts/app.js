(function () {
  let clientApp = null;
  var dataCSV = null
  const initApp = async function (_client) {
    clientApp = _client;
    clientApp.events.on("app.activated", initHandlers);
    await initMap();
    await getAllCustomObject();
  };

  const openModal = function () {
    clientApp.interface.trigger("showModal", {
      title: "Add record",
      template: "modal.html"
    });
  };

  const initHandlers = function () {
    const createButton = document.getElementById("createButton");
    createButton.addEventListener("click", openModal);
    document.getElementById("exportButton").addEventListener('click', function () {
      downloadCSVFromJson('data.csv', dataCSV.map(item => item.data))
    })
    clientApp.instance.receive(function (e) {
      const data = e.helper.getData();
      handleCreate(data);
    });
  };

  const handleCreate = async function (data) {
    const { name, address } = data;
    if (!name || !address) {
      showNotification("warning", "Please fill in all fields");
      return;
    }

    try {
      await clientApp.request.invokeTemplate("createCustomObject", {
        body: JSON.stringify({ data })
      });
      await clientApp.instance.send({ message: true });
      await getAllCustomObject();
      showNotification("success", "Successfully created custom object");
    } catch (error) {
      showNotification("error", "An error occurred");
      console.log(error);
    }
  };

  const showNotification = function (type, message) {
    clientApp.interface.trigger("showNotify", {
      type: type,
      message: message
    });
  };

  const getAllCustomObject = async function () {
    try {
      const response = await clientApp.request.invokeTemplate("getAllCustomObject", {});
      const data = JSON.parse(response.response);
      const html = generateCustomObjectHTML(data.records);
      dataCSV = data.records
      updateCustomObjectList(html);
    } catch (error) {
      console.log(error);
    }
  };

  const generateCustomObjectHTML = function (records) {
    let html = "";
    records?.forEach((item) => {
      const { name, address, code, postal_code, bo_created_at } = item.data;
      const row = `<tr class="border-b dark:border-gray-700">
                      <th scope="row" class="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        ${name}
                      </th>
                      <td class="px-4 py-3"> ${code}</td>
                      <td class="px-4 py-3"> ${address}</td>
                      <td class="px-4 py-3"> ${postal_code}</td>
                      <td class="px-4 py-3"> ${moment(bo_created_at).fromNow()}</td>
                  </tr>`;
      html += row;
    });
    return html;
  };

  const updateCustomObjectList = function (html) {
    const listCO = document.getElementById("listCO");
    listCO.innerHTML = html;
  };

  const initMap = function () {
    new google.maps.Map(document.getElementById("initMap"), {
      center: { lat: 1.3139946, lng: 103.6794355 },
      zoom: 15
    });
  };

  const downloadCSVFromJson = (filename, arrayOfJson) => {
    const headers = ['Name', 'Address', 'Code', 'Postal Code', 'Created At'];
    const csvRows = [];
    console.log(arrayOfJson)
    // Add headers to the CSV
    csvRows.push(headers.join(','));

    // Convert data to CSV rows
    arrayOfJson.forEach(item => {
      const { name, address, code, postal_code, bo_created_at } = item;
      const row = [
        name,
        `"${address.replace(/"/g, '""')}"`,
        code,
        postal_code,
        bo_created_at
      ];
      csvRows.push(row.join(','));
    });
    csv = csvRows.join('\n')
    console.log(csv)
    // Create link and download
    var link = document.createElement('a');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,%EF%BB%BF' + encodeURIComponent(csv));
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  document.addEventListener("DOMContentLoaded", function () {
    app.initialized().then(initApp);
  });
})();
