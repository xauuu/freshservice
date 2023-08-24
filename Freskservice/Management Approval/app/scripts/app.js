let clientApp = null;
let departments = []
let categories = []
let templates = []
let apps = []
let groups = []
function initApp(_client) {
  clientApp = _client;
  clientApp.events.on('app.activated', initHandlers);
  getAllGroupApproval();
  getAllEmailTemplate();
  getAllSRCategory();
  getDepartments()
}

function openModal(type, data = null) {
  if (type === ACTION_TYPES.GROUP_APPROVAL_CREATE || type === ACTION_TYPES.GROUP_APPROVAL_UPDATE) {
    sendData()
  }
  const titleMap = {
    [ACTION_TYPES.EMAIL_TEMPLATE_CREATE]: 'Add Record',
    [ACTION_TYPES.GROUP_APPROVAL_CREATE]: 'Add Record',
    [ACTION_TYPES.SERVICE_REQUEST_CREATE]: 'Add Record',
    [ACTION_TYPES.EMAIL_TEMPLATE_UPDATE]: 'Edit Record',
    [ACTION_TYPES.GROUP_APPROVAL_UPDATE]: 'Edit Record',
    [ACTION_TYPES.SERVICE_REQUEST_UPDATE]: 'Edit Record',
  };
  const templateMap = {
    [ACTION_TYPES.GROUP_APPROVAL_CREATE]: 'modal.html',
    [ACTION_TYPES.GROUP_APPROVAL_UPDATE]: 'modal.html',
    [ACTION_TYPES.EMAIL_TEMPLATE_CREATE]: 'email-modal.html',
    [ACTION_TYPES.EMAIL_TEMPLATE_UPDATE]: 'email-modal.html',
    [ACTION_TYPES.SERVICE_REQUEST_CREATE]: 'sr-modal.html',
    [ACTION_TYPES.SERVICE_REQUEST_UPDATE]: 'sr-modal.html',
  };
  clientApp.interface.trigger('showModal', {
    title: titleMap[type],
    template: templateMap[type],
    data: { type, data }
  });
}

function initHandlers() {
  document.getElementById('createButton').addEventListener('click', function () {
    openModal(ACTION_TYPES.GROUP_APPROVAL_CREATE)
  });
  document.getElementById('createEmailTemplate').addEventListener('click', function () {
    openModal(ACTION_TYPES.EMAIL_TEMPLATE_CREATE)
  });
  document.getElementById('createSR').addEventListener('click', function () {
    openModal(ACTION_TYPES.SERVICE_REQUEST_CREATE)
  });

  clientApp.instance.receive(async (e) => {
    const { type, data, id } = e.helper.getData();
    switch (type) {
      case ACTION_TYPES.GROUP_APPROVAL_CREATE:
        await handleCreateGA({ ...data, approval_type: Number(data.approval_type) });
        break;
      case ACTION_TYPES.GROUP_APPROVAL_UPDATE:
        await handleUpdateGA(id, { ...data, approval_type: Number(data.approval_type) });
        break;
      case ACTION_TYPES.EMAIL_TEMPLATE_CREATE:
        await handleCreateET(data);
        break;
      case ACTION_TYPES.EMAIL_TEMPLATE_UPDATE:
        await handleUpdateET(id, data);
        break;
      case ACTION_TYPES.SERVICE_REQUEST_CREATE:
        await handleCreateSR({ ...data, is_active: Number(data.is_active) });
        break;
      case ACTION_TYPES.SERVICE_REQUEST_UPDATE:
        await handleUpdateSR(id, { ...data, is_active: Number(data.is_active) });
        break;
    }
  });
}

async function handleCreateGA(data) {
  try {
    await clientApp.request.invokeTemplate("createGroupApproval", {
      body: JSON.stringify({ data })
    });
    handleSuccess(ACTION_TYPES.GROUP_APPROVAL_CREATE, 'Successfully created group approval');
  } catch (error) {
    handleError(error);
  }
}

async function handleUpdateGA(id, data) {
  try {
    console.log(data)
    await clientApp.request.invokeTemplate("updateGroupApproval", {
      context: { id },
      body: JSON.stringify({ data })
    });
    handleSuccess(ACTION_TYPES.GROUP_APPROVAL_UPDATE, 'Successfully updated group approval');
  } catch (error) {
    handleError(error);
  }
}

async function handleCreateET(data) {
  try {
    await clientApp.request.invokeTemplate("createEmailTemplate", {
      body: JSON.stringify({ data })
    });
    handleSuccess(ACTION_TYPES.EMAIL_TEMPLATE_CREATE, 'Successfully created email template');
  } catch (error) {
    showNotification("error", "An error occurred");
    console.log(error);
  }
};

async function handleUpdateET(id, data) {
  try {
    await clientApp.request.invokeTemplate("updateEmailTemplate", {
      context: { id },
      body: JSON.stringify({ data })
    });
    handleSuccess(ACTION_TYPES.EMAIL_TEMPLATE_UPDATE, 'Successfully updated email template');
  } catch (error) {
    showNotification("error", "An error occurred");
    console.log(error);
  }
};

async function handleCreateSR(data) {
  try {
    await clientApp.request.invokeTemplate("createSRCategory", {
      body: JSON.stringify({ data })
    });
    handleSuccess(ACTION_TYPES.SERVICE_REQUEST_CREATE, 'Successfully created Service Category');
  } catch (error) {
    showNotification("error", "An error occurred");
    console.log(error);
  }
};

async function handleUpdateSR(id, data) {
  try {
    await clientApp.request.invokeTemplate("updateSRCategory", {
      context: { id },
      body: JSON.stringify({ data })
    });
    handleSuccess(ACTION_TYPES.SERVICE_REQUEST_UPDATE, 'Successfully updated Service Category');
  } catch (error) {
    showNotification("error", "An error occurred");
    console.log(error);
  }
};

function handleSuccess(type, message) {
  showNotification('success', message);
  clientApp.instance.send({ message: { type: ACTION_TYPES.CLOSE_MODAL } });
  if (type === ACTION_TYPES.GROUP_APPROVAL_CREATE || type === ACTION_TYPES.GROUP_APPROVAL_UPDATE) {
    getAllGroupApproval();
  } else if (type === ACTION_TYPES.EMAIL_TEMPLATE_CREATE || type === ACTION_TYPES.EMAIL_TEMPLATE_UPDATE) {
    getAllEmailTemplate();
  } else if (type === ACTION_TYPES.SERVICE_REQUEST_CREATE || type === ACTION_TYPES.SERVICE_REQUEST_UPDATE) {
    getAllSRCategory();
  }
}

function handleError(error) {
  showNotification('error', 'An error occurred');
  console.error(error);
}

function showNotification(type, message) {
  clientApp.interface.trigger("showNotify", {
    type: type,
    message: message
  })
}

async function getAllGroupApproval() {
  try {
    const response = await clientApp.request.invokeTemplate("getAllGroupApproval", {});
    const data = JSON.parse(response.response);
    groups = data.records
    const html = generateGroupApproval(groups);
    updateListGroupApproval(html)
  } catch (error) {
    console.error(error);
  }
};

function generateGroupApproval(records) {
  let html = "";
  records?.forEach((item) => {
    const { name, app_code, process_code, status, approval_type, action_code } = item.data;
    const rowData = JSON.stringify(item.data);
    const row = `<tr class="border-b hover:bg-gray-50" data-item='${rowData}'>
                      <td class="px-4 py-3"> ${app_code}</td>
                      <td class="px-4 py-3"> ${process_code}</td>
                      <th scope="row" class="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        ${name}
                      </th>
                      <td class="px-4 py-3"> ${action_code}</td>
                      <td class="px-4 py-3"> ${approval_type}</td>
                      <td class="px-4 py-3"> ${status}</td>
                  </tr>`;
    html += row;
  });
  return html;
};


function updateListGroupApproval(html) {
  const listCO = document.getElementById("listCO");
  listCO.innerHTML = html;
  listCO.addEventListener("click", function (event) {
    const clickedRow = event.target.closest("tr");
    if (!clickedRow) return
    const rowData = clickedRow.getAttribute("data-item");
    openModal(ACTION_TYPES.GROUP_APPROVAL_UPDATE, JSON.parse(rowData))
  });
}

async function getDepartments() {
  try {
    const response = await clientApp.request.invokeTemplate("getAllDepartment", {});
    const data = JSON.parse(response.response);
    departments = data.departments
  } catch (error) {
    console.error(error);
  }
}

async function sendData() {
  try {
    await clientApp.request.invokeTemplate("getAllDepartment", {});
    clientApp.instance.send({ message: { type: ACTION_TYPES.LIST_DEPARTMENT, data: { departments, categories, templates, apps } } });
  } catch (error) {
    console.error(error);
  }
}

function generateEmailTemplateHTML(records) {
  let html = "";
  records?.forEach((item) => {
    const { email_code, email_name, subject } = item.data;
    const rowData = JSON.stringify({
      ...item.data,
      body: item.data.body.replace(/&quot;/g, '\\"').replace(/'/g, "\\'")
    });
    const row = `<tr class="border-b hover:bg-gray-50" data-item='${rowData}'>
                      <th scope="row" class="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        ${email_code}
                      </th>
                      <td class="px-4 py-3"> ${email_name}</td>
                      <td class="px-4 py-3"> ${subject}</td>
                  </tr>`;
    html += row;
  });
  return html;
};

async function getAllEmailTemplate() {
  try {
    const response = await clientApp.request.invokeTemplate("getAllEmailTemplate", {});
    const data = JSON.parse(response.response);
    const html = generateEmailTemplateHTML(data.records);
    templates = data.records
    const listEmail = document.getElementById("listEmail");
    listEmail.innerHTML = html;
    listEmail.addEventListener("click", function (event) {
      const clickedRow = event.target.closest("tr");
      if (!clickedRow) return
      const rowData = clickedRow.getAttribute("data-item");
      openModal(ACTION_TYPES.EMAIL_TEMPLATE_UPDATE, JSON.parse(rowData))
    });
  } catch (error) {
    console.error(error);
  }
};

function generateSRCategoryHTML(records) {
  let html = "";
  records?.forEach((item) => {
    const { app_code, app_name, process_code, process_name, process_image } = item.data;
    const rowData = JSON.stringify(item.data);
    const row = `<tr class="border-b hover:bg-gray-50" data-item='${rowData}'>
                      <td class="px-4 py-3">
                        <img class="h-10 w-10 rounded-lg" src="${process_image}" alt="image description">
                      </td>
                      <th scope="row" class="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        ${process_name}
                      </th>
                      <td class="px-4 py-3"> ${process_code}</td>
                      <td class="px-4 py-3"> ${app_name}</td>
                      <td class="px-4 py-3"> ${app_code}</td>
                  </tr>`;
    html += row;
  });
  return html;
};

async function getAllSRCategory() {
  try {
    const response = await clientApp.request.invokeTemplate("getAllSRCategory", {});
    const data = JSON.parse(response.response);
    const html = generateSRCategoryHTML(data.records);
    categories = data.records
    apps = getUniqueAppInfo(data.records)
    generateFilter()
    const listSR = document.getElementById("listSRCategory");
    listSR.innerHTML = html;
    listSR.addEventListener("click", function (event) {
      const clickedRow = event.target.closest("tr");
      if (!clickedRow) return
      const rowData = clickedRow.getAttribute("data-item");
      openModal(ACTION_TYPES.SERVICE_REQUEST_UPDATE, JSON.parse(rowData))
    });
  } catch (error) {
    console.error(error);
  }
};

function generateFilter() {
  html = ''
  apps.forEach((item, index) => {
    const { app_code, app_name } = item;
    html += `<li class="flex items-center">
              <input id="${app_code + index}" name="category" type="checkbox" value="${app_code}" checked=""
                class="w-4 h-4 bg-gray-100 border-gray-300 rounded text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500" />
              <label for="${app_code + index}" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                ${app_name}
              </label>
            </li>`
  });
  document.getElementById("filterDropdownContainer").innerHTML = html
  const categoryInputs = document.querySelectorAll('input[name="category"]');
  categoryInputs.forEach(input => {
    input.addEventListener('change', handleFilterChange);
  });
}
function handleFilterChange() {
  const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(input => input.value);
  const filterGroups = groups.filter(item => selectedCategories.includes(item.data.app_code));
  const html = generateGroupApproval(filterGroups);
  updateListGroupApproval(html)
}
function getUniqueAppInfo(jsonData) {
  const uniqueAppInfo = new Set();

  jsonData.forEach(record => {
    const appCode = record.data.app_code;
    const appName = record.data.app_name;
    uniqueAppInfo.add(`${appCode}-${appName}`);
  });

  const uniqueAppInfoArray = Array.from(uniqueAppInfo);

  const result = uniqueAppInfoArray.map(appInfo => {
    const [appCode, appName] = appInfo.split('-');
    return { app_code: appCode, app_name: appName };
  });
  return result;
}


document.addEventListener('DOMContentLoaded', () => {
  app.initialized().then(initApp);
});
