let clientApp = null;
let requesterGroups = []
let categories = []
let templates = []
let apps = []
let stateChange = []
let states = []
let workflows = []
let serviceItems = []

const categoryContainer = document.getElementById('listSRCategory')
const emailContainer = document.getElementById('listEmail')
const workflowContainer = document.getElementById('listWorkflow')
const stateContainer = document.getElementById('listState')
const approvalContainer = document.getElementById('listCO')
const conditionContainer = document.getElementById('listCondition')

async function initApp(_client) {
  clientApp = _client;
  await getAllSRCategory()
  await getAllStateApproval()
  await Promise.all([getAllEmailTemplate(), getAllGroupApproval(), getAllRequesterGroup()])
  await getAllServiceItem()
  clientApp.events.on('app.activated', initHandlers);
}

function openModal(type, detail = null) {
  const titleMap = {
    [ACTION_TYPES.EMAIL_TEMPLATE_CREATE]: 'Add Email Template',
    [ACTION_TYPES.EMAIL_TEMPLATE_UPDATE]: 'Edit Email Template',
    [ACTION_TYPES.GROUP_APPROVAL_CREATE]: 'Add State Change',
    [ACTION_TYPES.GROUP_APPROVAL_UPDATE]: 'Edit State Change',
    [ACTION_TYPES.SERVICE_REQUEST_CREATE]: 'Add Category',
    [ACTION_TYPES.SERVICE_REQUEST_UPDATE]: 'Edit Category',
    [ACTION_TYPES.STATE_APPROVAL_CREATE]: 'Add State',
    [ACTION_TYPES.STATE_APPROVAL_UPDATE]: 'Edit State',
    // [ACTION_TYPES.WORKFLOW_CREATE]: 'Add Workflow',
    // [ACTION_TYPES.WORKFLOW_UPDATE]: 'Edit Workflow',
    // [ACTION_TYPES.CONDITION_CREATE]: 'Add Condition',
    // [ACTION_TYPES.CONDITION_UPDATE]: 'Edit Condition',
  };
  const templateMap = {
    [ACTION_TYPES.GROUP_APPROVAL_CREATE]: 'modals/modal.html',
    [ACTION_TYPES.GROUP_APPROVAL_UPDATE]: 'modals/modal.html',
    [ACTION_TYPES.EMAIL_TEMPLATE_CREATE]: 'modals/email-modal.html',
    [ACTION_TYPES.EMAIL_TEMPLATE_UPDATE]: 'modals/email-modal.html',
    [ACTION_TYPES.SERVICE_REQUEST_CREATE]: 'modals/sr-modal.html',
    [ACTION_TYPES.SERVICE_REQUEST_UPDATE]: 'modals/sr-modal.html',
    [ACTION_TYPES.STATE_APPROVAL_CREATE]: 'modals/state-modal.html',
    [ACTION_TYPES.STATE_APPROVAL_UPDATE]: 'modals/state-modal.html',
    // [ACTION_TYPES.WORKFLOW_CREATE]: 'modals/workflow-modal.html',
    // [ACTION_TYPES.WORKFLOW_UPDATE]: 'modals/workflow-modal.html',
    // [ACTION_TYPES.CONDITION_CREATE]: 'modals/condition-modal.html',
    // [ACTION_TYPES.CONDITION_UPDATE]: 'modals/condition-modal.html',
  };
  const listMap = {
    [ACTION_TYPES.GROUP_APPROVAL_CREATE]: { apps, categories, workflows, templates, requesterGroups, states },
    [ACTION_TYPES.GROUP_APPROVAL_UPDATE]: { apps, categories, workflows, templates, requesterGroups, states },
    [ACTION_TYPES.EMAIL_TEMPLATE_CREATE]: {},
    [ACTION_TYPES.EMAIL_TEMPLATE_UPDATE]: {},
    [ACTION_TYPES.SERVICE_REQUEST_CREATE]: { serviceItems },
    [ACTION_TYPES.SERVICE_REQUEST_UPDATE]: { serviceItems },
    [ACTION_TYPES.STATE_APPROVAL_CREATE]: { apps, categories },
    [ACTION_TYPES.STATE_APPROVAL_UPDATE]: { apps, categories },
    // [ACTION_TYPES.WORKFLOW_CREATE]: { apps, categories },
    // [ACTION_TYPES.WORKFLOW_UPDATE]: { apps, categories },
    // [ACTION_TYPES.CONDITION_CREATE]: { apps, categories },
    // [ACTION_TYPES.CONDITION_UPDATE]: { apps, categories },
  };

  clientApp.interface.trigger('showModal', {
    title: titleMap[type],
    template: templateMap[type],
    data: { type, detail, data: listMap[type] }
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
  document.getElementById('createState').addEventListener('click', function () {
    openModal(ACTION_TYPES.STATE_APPROVAL_CREATE)
  });
  // document.getElementById('createWorkflow').addEventListener('click', function () {
  //   openModal(ACTION_TYPES.WORKFLOW_CREATE)
  // });
  // document.getElementById('createCondition').addEventListener('click', function () {
  //   openModal(ACTION_TYPES.CONDITION_CREATE)
  // });
  clientApp.instance.receive(async (e) => {
    const { type, data, id } = e.helper.getData();
    switch (type) {
      case ACTION_TYPES.GROUP_APPROVAL_CREATE:
        await handleCreateGA(data);
        break;
      case ACTION_TYPES.GROUP_APPROVAL_UPDATE:
        await handleUpdateGA(id, data);
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
      case ACTION_TYPES.STATE_APPROVAL_CREATE:
        await handleCreateState(data);
        break;
      case ACTION_TYPES.STATE_APPROVAL_UPDATE:
        await handleUpdateState(id, data);
        break;
      case ACTION_TYPES.WORKFLOW_CREATE:
        await handleCreateWorkflow({ ...data, is_active: Number(data.is_active) });
        break;
      case ACTION_TYPES.WORKFLOW_UPDATE:
        await handleUpdateWorkflow(id, { ...data, is_active: Number(data.is_active) });
        break;
      case ACTION_TYPES.CONDITION_CREATE:
        await handleCreateCondition({ ...data, condition_type: Number(data.condition_type) });
        break;
      case ACTION_TYPES.CONDITION_UPDATE:
        await handleUpdateCondition(id, { ...data, condition_type: Number(data.condition_type) });
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

async function handleCreateState(data) {
  try {
    await clientApp.request.invokeTemplate("createStateApproval", {
      body: JSON.stringify({ data })
    });
    handleSuccess(ACTION_TYPES.STATE_APPROVAL_CREATE, 'Successfully created State Approval');
  } catch (error) {
    showNotification("error", "An error occurred");
    console.log(error);
  }
};

async function handleUpdateState(id, data) {
  try {
    await clientApp.request.invokeTemplate("updateStateApproval", {
      context: { id },
      body: JSON.stringify({ data })
    });
    handleSuccess(ACTION_TYPES.STATE_APPROVAL_UPDATE, 'Successfully updated State Approval');
  } catch (error) {
    showNotification("error", "An error occurred");
    console.log(error);
  }
};

// async function handleCreateWorkflow(data) {
//   try {
//     await clientApp.request.invokeTemplate("createWorkflow", {
//       body: JSON.stringify({ data })
//     });
//     handleSuccess(ACTION_TYPES.WORKFLOW_CREATE, 'Successfully created Workflow');
//   } catch (error) {
//     showNotification("error", "An error occurred");
//     console.log(error);
//   }
// };

// async function handleUpdateWorkflow(id, data) {
//   try {
//     await clientApp.request.invokeTemplate("updateWorkflow", {
//       context: { id },
//       body: JSON.stringify({ data })
//     });
//     handleSuccess(ACTION_TYPES.WORKFLOW_UPDATE, 'Successfully updated Workflow');
//   } catch (error) {
//     showNotification("error", "An error occurred");
//     console.log(error);
//   }
// };

// async function handleCreateCondition(data) {
//   try {
//     await clientApp.request.invokeTemplate("createCondition", {
//       body: JSON.stringify({ data })
//     });
//     handleSuccess(ACTION_TYPES.CONDITION_CREATE, 'Successfully created Condition');
//   } catch (error) {
//     showNotification("error", "An error occurred");
//     console.log(error);
//   }
// };

// async function handleUpdateCondition(id, data) {
//   try {
//     await clientApp.request.invokeTemplate("updateCondition", {
//       context: { id },
//       body: JSON.stringify({ data })
//     });
//     handleSuccess(ACTION_TYPES.CONDITION_UPDATE, 'Successfully updated Condition');
//   } catch (error) {
//     showNotification("error", "An error occurred");
//     console.log(error);
//   }
// };

async function handleSuccess(type, message) {
  showNotification('success', message);
  clientApp.instance.send({ message: { type: ACTION_TYPES.CLOSE_MODAL } });
  if (type === ACTION_TYPES.GROUP_APPROVAL_CREATE || type === ACTION_TYPES.GROUP_APPROVAL_UPDATE) {
    approvalContainer.removeEventListener('click', approvalClickHandler)
    getAllGroupApproval();
  } else if (type === ACTION_TYPES.EMAIL_TEMPLATE_CREATE || type === ACTION_TYPES.EMAIL_TEMPLATE_UPDATE) {
    emailContainer.removeEventListener('click', emailClickHandler)
    getAllEmailTemplate();
  } else if (type === ACTION_TYPES.SERVICE_REQUEST_CREATE || type === ACTION_TYPES.SERVICE_REQUEST_UPDATE) {
    categoryContainer.removeEventListener('click', categoryClickHandler)
    getAllSRCategory();
  } else if (type === ACTION_TYPES.STATE_APPROVAL_CREATE || type === ACTION_TYPES.STATE_APPROVAL_UPDATE) {
    stateContainer.removeEventListener('click', stateClickHandler)
    getAllStateApproval();
  }
  // } else if (type === ACTION_TYPES.WORKFLOW_CREATE || type === ACTION_TYPES.WORKFLOW_UPDATE) {
  //   workflowContainer.removeEventListener('click', workflowClickHandler)
  //   getAllWorkflow();
  // } else if (type === ACTION_TYPES.CONDITION_CREATE || type === ACTION_TYPES.CONDITION_UPDATE) {
  //   conditionContainer.removeEventListener('click', conditionClickHandler)
  //   getAllCondition();
  // }
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
    stateChange = data.records
    const html = generateGroupApproval(stateChange);
    approvalContainer.innerHTML = html;
    approvalContainer.addEventListener("click", approvalClickHandler);
  } catch (error) {
    console.error(error);
  }
};

function generateGroupApproval(records) {
  let html = "";
  records?.forEach((item) => {
    const { name, app_code, process_code, new_state, current_state, reject_new_state, expired_new_state } = item.data;
    const rowData = JSON.stringify(item.data);
    const row = `<tr class="border-b hover:bg-gray-50" data-item='${rowData}'>
                      <th scope="row" class="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        ${name}
                      </th>
                      <td class="px-4 py-3"> ${(apps.find(item => item.app_code == app_code))?.app_name || ''}</td>
                      <td class="px-4 py-3"> ${(categories.find(item => item.data.process_code == process_code))?.data.process_name || ''}</td>
                      <td class="px-4 py-3"> ${(states.find(item => item.data.app_code == app_code && item.data.process_code == process_code && item.data.state == current_state))?.data.state_name || ''}</td>
                      <td class="px-4 py-3"> ${(states.find(item => item.data.app_code == app_code && item.data.process_code == process_code && item.data.state == new_state))?.data.state_name || ''}</td>
                      <td class="px-4 py-3"> ${(states.find(item => item.data.app_code == app_code && item.data.process_code == process_code && item.data.state == reject_new_state))?.data.state_name || ''}</td>
                      <td class="px-4 py-3"> ${(states.find(item => item.data.app_code == app_code && item.data.process_code == process_code && item.data.state == expired_new_state))?.data.state_name || ''}</td>
                  </tr>`;
    html += row;
  });
  return html;
};

function updateListGroupApproval(html) {
  approvalContainer.innerHTML = html;
  approvalContainer.addEventListener("click", approvalClickHandler);
}

function approvalClickHandler(event) {
  const clickedRow = event.target.closest("tr");
  if (!clickedRow) return
  const rowData = clickedRow.getAttribute("data-item");
  openModal(ACTION_TYPES.GROUP_APPROVAL_UPDATE, JSON.parse(rowData))
}

async function getAllRequesterGroup() {
  try {
    const response = await clientApp.request.invokeTemplate("getAllRequesterGroup", {});
    const data = JSON.parse(response.response);
    requesterGroups = data.requester_groups
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

function emailClickHandler(event) {
  const clickedRow = event.target.closest("tr");
  if (!clickedRow) return
  const rowData = clickedRow.getAttribute("data-item");
  openModal(ACTION_TYPES.EMAIL_TEMPLATE_UPDATE, JSON.parse(rowData))
}

async function getAllEmailTemplate() {
  try {
    const response = await clientApp.request.invokeTemplate("getAllEmailTemplate", {});
    const data = JSON.parse(response.response);
    const html = generateEmailTemplateHTML(data.records);
    templates = data.records
    emailContainer.innerHTML = html;
    emailContainer.addEventListener("click", emailClickHandler);
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
                      <td class="px-4 py-3 w-36">
                        ${process_image}
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

function categoryClickHandler(event) {
  const clickedRow = event.target.closest("tr");
  if (!clickedRow) return
  const rowData = clickedRow.getAttribute("data-item");
  openModal(ACTION_TYPES.SERVICE_REQUEST_UPDATE, JSON.parse(rowData))
}

async function getAllSRCategory() {
  try {
    const response = await clientApp.request.invokeTemplate("getAllSRCategory", {});
    const data = JSON.parse(response.response);
    const html = generateSRCategoryHTML(data.records);
    categories = data.records
    apps = getUniqueAppInfo(data.records)
    generateFilter()
    categoryContainer.innerHTML = html;
    categoryContainer.addEventListener("click", categoryClickHandler);
  } catch (error) {
    console.error(error);
  }
};

function generateStateApprovalHTML(records) {
  let html = "";
  records?.forEach((item) => {
    const { app_code, process_code, state_name, state } = item.data;
    const rowData = JSON.stringify(item.data);
    const row = `<tr class="border-b hover:bg-gray-50" data-item='${rowData}'>
                      <th scope="row" class="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        ${state_name}
                      </td>
                      <td class="px-4 py-3"> ${state}</td>
                      <td class="px-4 py-3"> ${(apps.find(item => item.app_code == app_code))?.app_name || ''}</td>
                      <td class="px-4 py-3"> ${(categories.find(item => item.data.process_code == process_code))?.data.process_name || ''}</td>
                  </tr>`;
    html += row;
  });
  return html;
};

function stateClickHandler(event) {
  const clickedRow = event.target.closest("tr");
  if (!clickedRow) return
  const rowData = clickedRow.getAttribute("data-item");
  openModal(ACTION_TYPES.STATE_APPROVAL_UPDATE, JSON.parse(rowData))
}

async function getAllStateApproval() {
  try {
    const response = await clientApp.request.invokeTemplate("getAllStateApproval", {});
    const data = JSON.parse(response.response);
    states = data.records
    const html = generateStateApprovalHTML(states);
    stateContainer.innerHTML = html;
    stateContainer.addEventListener("click", stateClickHandler);
  } catch (error) {
    console.error(error);
  }
};

// function generateWorkflowHTML(records) {
//   let html = "";
//   records?.forEach((item) => {
//     const { app_code, process_code, workflow_name, workflow_code } = item.data;
//     const rowData = JSON.stringify(item.data);
//     const row = `<tr class="border-b hover:bg-gray-50" data-item='${rowData}'>
//                       <th scope="row" class="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
//                         ${workflow_name}
//                       </td>
//                       <td class="px-4 py-3">${workflow_code}</td>
//                       <td class="px-4 py-3">${(apps.find(item => item.app_code == app_code))?.app_name || ''}</td>
//                       <td class="px-4 py-3">${(categories.find(item => item.data.process_code == process_code))?.data.process_name || ''}</td>
//                   </tr>`;
//     html += row;
//   });
//   return html;
// };

// function workflowClickHandler(event) {
//   const clickedRow = event.target.closest("tr");
//   if (!clickedRow) return
//   const rowData = clickedRow.getAttribute("data-item");
//   openModal(ACTION_TYPES.WORKFLOW_UPDATE, JSON.parse(rowData))
// }

// async function getAllWorkflow() {
//   try {
//     const response = await clientApp.request.invokeTemplate("getAllWorkflow", {});
//     const data = JSON.parse(response.response);
//     workflows = data.records
//     const html = generateWorkflowHTML(workflows);
//     workflowContainer.innerHTML = html;
//     workflowContainer.addEventListener("click", workflowClickHandler);
//   } catch (error) {
//     console.error(error);
//   }
// };

// function generateConditionHTML(records) {
//   let html = "";
//   records?.forEach((item) => {
//     const { app_code, process_code, name, field_name } = item.data;
//     const rowData = JSON.stringify(item.data);
//     const row = `<tr class="border-b hover:bg-gray-50" data-item='${rowData}'>
//                       <th scope="row" class="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
//                         ${name}
//                       </td>
//                       <td class="px-4 py-3">${field_name}</td>
//                       <td class="px-4 py-3">${(apps.find(item => item.app_code == app_code))?.app_name || ''}</td>
//                       <td class="px-4 py-3">${(categories.find(item => item.data.process_code == process_code))?.data.process_name || ''}</td>
//                   </tr>`;
//     html += row;
//   });
//   return html;
// };

// function conditionClickHandler(event) {
//   const clickedRow = event.target.closest("tr");
//   if (!clickedRow) return
//   const rowData = clickedRow.getAttribute("data-item");
//   openModal(ACTION_TYPES.CONDITION_UPDATE, JSON.parse(rowData))
// }

// async function getAllCondition() {
//   try {
//     const response = await clientApp.request.invokeTemplate("getAllCondition", {});
//     const data = JSON.parse(response.response);
//     conditions = data.records
//     const html = generateConditionHTML(conditions);
//     conditionContainer.innerHTML = html;
//     conditionContainer.addEventListener("click", conditionClickHandler);
//   } catch (error) {
//     console.error(error);
//   }
// };

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
  const filterStateChange = stateChange.filter(item => selectedCategories.includes(item.data.app_code));
  const html = generateGroupApproval(filterStateChange);
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

async function getAllServiceItem() {
  try {
    const response = await clientApp.request.invokeTemplate("getAllWorkspace", {});
    const workspaces = JSON.parse(response.response).records
    await Promise.all(workspaces.map(async ({ data }) => {
      const res = await clientApp.request.invokeTemplate("getAllServiceItem", {
        context: { workspace_id: data.workspace_id }
      });
      serviceItems.push(...mappingServiceCatalog(data, JSON.parse(res.response).service_items))
    }))
  } catch (error) {
    console.error(error);
  }
}

function mappingServiceCatalog(workspace, list) {
  return list?.map(item => {
    return {
      ...item,
      name: `[${workspace.name}] ${item.name}`
    }
  })
}

document.addEventListener('DOMContentLoaded', () => {
  app.initialized().then(initApp);
});