var clientApp = null;
var requesterGroups = [];
var categories = [];
var templates = [];
var apps = [];
var stateChange = [];
var states = [];
var workflows = [];
var serviceItems = [];
var agentGroups = [];
var workspaces = [];

const loading = document.getElementById("loading");
const categoryContainer = document.getElementById("listSRCategory");
const emailContainer = document.getElementById("listEmail");
const workflowContainer = document.getElementById("listWorkflow");
const stateContainer = document.getElementById("listState");
const approvalContainer = document.getElementById("listCO");
const conditionContainer = document.getElementById("listCondition");

async function initApp(_client) {
    toggleLoading();
    clientApp = _client;
    await getAllServiceItem();
    await getAllSRCategory();
    await getAllStateApproval();
    await Promise.all([getAllEmailTemplate(), getAllGroupApproval(), getAllRequesterGroup(), getAllAgentGroup()]);
    toggleLoading(false);
    clientApp.events.on("app.activated", initHandlers);
}

async function openModal(type, detail = null) {
    toggleLoading();
    const titleMap = {
        [ACTION_TYPES.EMAIL_TEMPLATE_CREATE]: "Add Email Template",
        [ACTION_TYPES.EMAIL_TEMPLATE_UPDATE]: "Edit Email Template",
        [ACTION_TYPES.GROUP_APPROVAL_CREATE]: "Add State Change",
        [ACTION_TYPES.GROUP_APPROVAL_UPDATE]: "Edit State Change",
        [ACTION_TYPES.SERVICE_REQUEST_CREATE]: "Add Service Request",
        [ACTION_TYPES.SERVICE_REQUEST_UPDATE]: "Edit Service Request",
        [ACTION_TYPES.STATE_APPROVAL_CREATE]: "Add State",
        [ACTION_TYPES.STATE_APPROVAL_UPDATE]: "Edit State"
    };
    const templateMap = {
        [ACTION_TYPES.GROUP_APPROVAL_CREATE]: "modals/modal.html",
        [ACTION_TYPES.GROUP_APPROVAL_UPDATE]: "modals/modal.html",
        [ACTION_TYPES.EMAIL_TEMPLATE_CREATE]: "modals/email-modal.html",
        [ACTION_TYPES.EMAIL_TEMPLATE_UPDATE]: "modals/email-modal.html",
        [ACTION_TYPES.SERVICE_REQUEST_CREATE]: "modals/sr-modal.html",
        [ACTION_TYPES.SERVICE_REQUEST_UPDATE]: "modals/sr-modal.html",
        [ACTION_TYPES.STATE_APPROVAL_CREATE]: "modals/state-modal.html",
        [ACTION_TYPES.STATE_APPROVAL_UPDATE]: "modals/state-modal.html"
    };
    const listMap = {
        [ACTION_TYPES.GROUP_APPROVAL_CREATE]: { apps, categories, workflows, templates, requesterGroups, states, agentGroups },
        [ACTION_TYPES.GROUP_APPROVAL_UPDATE]: { apps, categories, workflows, templates, requesterGroups, states, agentGroups },
        [ACTION_TYPES.EMAIL_TEMPLATE_CREATE]: {},
        [ACTION_TYPES.EMAIL_TEMPLATE_UPDATE]: {},
        [ACTION_TYPES.SERVICE_REQUEST_CREATE]: { serviceItems, workspaces },
        [ACTION_TYPES.SERVICE_REQUEST_UPDATE]: { serviceItems, workspaces },
        [ACTION_TYPES.STATE_APPROVAL_CREATE]: { apps, categories },
        [ACTION_TYPES.STATE_APPROVAL_UPDATE]: { apps, categories }
    };

    if (type === ACTION_TYPES.SERVICE_REQUEST_UPDATE) {
        const [state, template, tabs] = await Promise.all([
            getDataSR(detail?.app_code, detail?.process_code),
            getDocumentTemplate(detail?.service_item_id),
            getTabsConfig(detail?.service_item_id)
        ]);
        var more = { state, template, tabs };
    }
    clientApp.interface.trigger("showModal", {
        title: titleMap[type],
        template: templateMap[type],
        data: { type, detail, data: { ...listMap[type], ...more } }
    });

    toggleLoading(false);
}

function initHandlers() {
    document.getElementById("createButton").addEventListener("click", function () {
        openModal(ACTION_TYPES.GROUP_APPROVAL_CREATE);
    });
    document.getElementById("createEmailTemplate").addEventListener("click", function () {
        openModal(ACTION_TYPES.EMAIL_TEMPLATE_CREATE);
    });
    document.getElementById("createSR").addEventListener("click", function () {
        openModal(ACTION_TYPES.SERVICE_REQUEST_CREATE);
    });
    document.getElementById("createState").addEventListener("click", function () {
        openModal(ACTION_TYPES.STATE_APPROVAL_CREATE);
    });
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
            case ACTION_TYPES.SERVICE_ITEM:
                const sr = categories.find((item) => item.data.app_code == data.app_code && item.data.process_code == data.process_code);
                await getConditionFields(sr);
                break;
            case ACTION_TYPES.CUSTOM_OBJECT:
                await getCustomObjects(data);
                break;
            case ACTION_TYPES.CUSTOM_OBJECT_FIELDS:
                const fields = await getDetailCustomObject(data);
                await clientApp.instance.send({ message: { type: ACTION_TYPES.CUSTOM_OBJECT_FIELDS, data: fields?.fields } });
                break;
            case ACTION_TYPES.CREATE_DOCUMENT_TEMPLATE:
                createDocumentTemplate(data);
                break;
            case ACTION_TYPES.DOCUMENT_TEMPLATE:
                if (id) updateDocumentTemplate(id, data);
                else createDocumentTemplate(data);
                break;
            case ACTION_TYPES.TABS_CONFIG:
                handleTabsConfig(data);
                break;
        }
    });
}

async function handleCreateGA(data) {
    try {
        await clientApp.request.invokeTemplate("createGroupApproval", {
            body: JSON.stringify({ data })
        });
        handleSuccess(ACTION_TYPES.GROUP_APPROVAL_CREATE, "Successfully created group approval");
    } catch (error) {
        handleError(error);
    }
}

async function handleUpdateGA(id, data) {
    try {
        console.log(data);
        await clientApp.request.invokeTemplate("updateGroupApproval", {
            context: { id },
            body: JSON.stringify({ data })
        });
        handleSuccess(ACTION_TYPES.GROUP_APPROVAL_UPDATE, "Successfully updated group approval");
    } catch (error) {
        handleError(error);
    }
}

async function handleCreateET(data) {
    try {
        await clientApp.request.invokeTemplate("createEmailTemplate", {
            body: JSON.stringify({ data })
        });
        handleSuccess(ACTION_TYPES.EMAIL_TEMPLATE_CREATE, "Successfully created email template");
    } catch (error) {
        showNotification("error", "An error occurred");
        console.log(error);
    }
}

async function handleUpdateET(id, data) {
    try {
        await clientApp.request.invokeTemplate("updateEmailTemplate", {
            context: { id },
            body: JSON.stringify({ data })
        });
        handleSuccess(ACTION_TYPES.EMAIL_TEMPLATE_UPDATE, "Successfully updated email template");
    } catch (error) {
        showNotification("error", "An error occurred");
        console.log(error);
    }
}

async function handleCreateSR(data) {
    try {
        await clientApp.request.invokeTemplate("createSRCategory", {
            body: JSON.stringify({ data })
        });
        handleSuccess(ACTION_TYPES.SERVICE_REQUEST_CREATE, "Successfully created Service Category");
    } catch (error) {
        showNotification("error", "An error occurred");
        console.log(error);
    }
}

async function handleUpdateSR(id, data) {
    try {
        await clientApp.request.invokeTemplate("updateSRCategory", {
            context: { id },
            body: JSON.stringify({ data })
        });
        handleSuccess(ACTION_TYPES.SERVICE_REQUEST_UPDATE, "Successfully updated Service Category");
    } catch (error) {
        showNotification("error", "An error occurred");
        console.log(error);
    }
}

async function handleCreateState(data) {
    try {
        await clientApp.request.invokeTemplate("createStateApproval", {
            body: JSON.stringify({ data })
        });
        handleSuccess(ACTION_TYPES.STATE_APPROVAL_CREATE, "Successfully created State Approval");
    } catch (error) {
        showNotification("error", "An error occurred");
        console.log(error);
    }
}

async function handleUpdateState(id, data) {
    try {
        await clientApp.request.invokeTemplate("updateStateApproval", {
            context: { id },
            body: JSON.stringify({ data })
        });
        handleSuccess(ACTION_TYPES.STATE_APPROVAL_UPDATE, "Successfully updated State Approval");
    } catch (error) {
        showNotification("error", "An error occurred");
        console.log(error);
    }
}

function createDocumentTemplate(data) {
    clientApp.request
        .invokeTemplate("createDocumentTemplate", {
            body: JSON.stringify({ data })
        })
        .then(
            function (data) {
                console.log(data);
            },
            function (error) {
                console.log(error);
            }
        );
}

function updateDocumentTemplate(id, data) {
    clientApp.request
        .invokeTemplate("updateDocumentTemplate", {
            context: { id },
            body: JSON.stringify({ data })
        })
        .then(
            function (data) {
                console.log(data);
            },
            function (error) {
                console.log(error);
            }
        );
}

async function getDocumentTemplate(id) {
    try {
        const response = await clientApp.request.invokeTemplate("getDocumentTemplate", {
            context: { id }
        });
        const data = JSON.parse(response.response);
        return data.records[0];
    } catch (error) {
        console.log(error);
    }
}

function createTabsConfig(data) {
    clientApp.request
        .invokeTemplate("createTabsConfig", {
            body: JSON.stringify({ data })
        })
        .then(
            function (data) {
                console.log(data);
            },
            function (error) {
                console.log(error);
            }
        );
}

function updateTabsConfig(id, data) {
    clientApp.request
        .invokeTemplate("updateTabsConfig", {
            context: { id },
            body: JSON.stringify({ data })
        })
        .then(
            function (data) {
                console.log(data);
            },
            function (error) {
                console.log(error);
            }
        );
}

async function getTabsConfig(id) {
    try {
        const response = await clientApp.request.invokeTemplate("getTabsConfig", {
            context: { id }
        });
        const data = JSON.parse(response.response);
        return data.records;
    } catch (error) {
        console.log(error);
    }
}

async function handleSuccess(type, message) {
    showNotification("success", message);
    clientApp.instance.send({ message: { type: ACTION_TYPES.CLOSE_MODAL } });
    if (type === ACTION_TYPES.GROUP_APPROVAL_CREATE || type === ACTION_TYPES.GROUP_APPROVAL_UPDATE) {
        approvalContainer.removeEventListener("click", approvalClickHandler);
        getAllGroupApproval();
    } else if (type === ACTION_TYPES.EMAIL_TEMPLATE_CREATE || type === ACTION_TYPES.EMAIL_TEMPLATE_UPDATE) {
        emailContainer.removeEventListener("click", emailClickHandler);
        getAllEmailTemplate();
    } else if (type === ACTION_TYPES.SERVICE_REQUEST_CREATE || type === ACTION_TYPES.SERVICE_REQUEST_UPDATE) {
        categoryContainer.removeEventListener("click", categoryClickHandler);
        getAllSRCategory();
    } else if (type === ACTION_TYPES.STATE_APPROVAL_CREATE || type === ACTION_TYPES.STATE_APPROVAL_UPDATE) {
        stateContainer.removeEventListener("click", stateClickHandler);
        getAllStateApproval();
    }
}

function handleError(error) {
    showNotification("error", "An error occurred");
    console.error(error);
}

function showNotification(type, message) {
    clientApp.interface.trigger("showNotify", {
        type: type,
        message: message
    });
}

async function getAllGroupApproval() {
    try {
        const response = await clientApp.request.invokeTemplate("getAllGroupApproval", {});
        const data = JSON.parse(response.response);
        stateChange = data.records;
        const html = generateGroupApproval(stateChange);
        approvalContainer.innerHTML = html;
        approvalContainer.addEventListener("click", approvalClickHandler);
    } catch (error) {
        console.error(error);
    }
}

function generateGroupApproval(records) {
    let html = "";
    records?.forEach((item) => {
        const { name, app_code, process_code, current_state, expired_new_state, configuration_type } = item.data;
        const rowData = JSON.stringify(item.data);
        const row = `<tr class="border-b hover:bg-gray-50" data-item='${rowData}'>
                      <td class="px-4 py-3"> ${apps.find((item) => item.app_code == app_code)?.app_name || ""}</td>
                      <td class="px-4 py-3"> ${categories.find((item) => item.data.process_code == process_code)?.data.process_name || ""}</td>
                      <th scope="row" class="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        ${name}
                      </th>
                      <td class="px-4 py-3"> ${
                          states.find((item) => item.data.app_code == app_code && item.data.process_code == process_code && item.data.state == current_state)
                              ?.data.state_name || ""
                      }</td>
                      <td class="px-4 py-3"> ${
                          states.find(
                              (item) => item.data.app_code == app_code && item.data.process_code == process_code && item.data.state == expired_new_state
                          )?.data.state_name || ""
                      }</td>
                      <td class="px-4 py-3"> ${configuration_type}</td>
                  </tr>`;
        html += row;
    });
    return html;
}

function updateListGroupApproval(html) {
    approvalContainer.innerHTML = html;
    approvalContainer.addEventListener("click", approvalClickHandler);
}

function approvalClickHandler(event) {
    const clickedRow = event.target.closest("tr");
    if (!clickedRow) return;
    const rowData = clickedRow.getAttribute("data-item");
    openModal(ACTION_TYPES.GROUP_APPROVAL_UPDATE, JSON.parse(rowData));
}

async function getAllRequesterGroup() {
    try {
        await Promise.all(
            Array.from({ length: 5 }).map(async (_, index) => {
                const res = await clientApp.request.invokeTemplate("getAllRequesterGroup", {
                    context: { page: index + 1 }
                });
                const data = JSON.parse(res.response).requester_groups;
                if (data.length == 0) return;
                requesterGroups.push(...data);
            })
        );
    } catch (error) {
        console.error(error);
    }
}

async function getAllAgentGroup() {
    try {
        await Promise.all(
            Array.from({ length: 5 }).map(async (_, index) => {
                const res = await clientApp.request.invokeTemplate("getAllAgentGroup", {
                    context: { page: index + 1 }
                });
                const data = JSON.parse(res.response).groups;
                if (data.length == 0) return;
                agentGroups.push(...data);
            })
        );
    } catch (error) {
        console.error(error);
    }
}

function generateEmailTemplateHTML(records) {
    emailContainer.innerHTML = "";
    records?.forEach((item) => {
        const { email_code, email_name, subject } = item.data;
        const rowData = JSON.stringify({
            ...item.data,
            body: item.data.body.replace(/&quot;/g, '\\"').replace(/'/g, "\\'")
        });
        const trElement = document.createElement("tr");
        trElement.classList.add("border-b", "hover:bg-gray-50");

        trElement.innerHTML = `<th scope="row" class="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                              ${email_code}
                            </th>
                            <td class="px-4 py-3">${email_name}</td>
                            <td class="px-4 py-3">${subject}</td>`;
        trElement.dataset.item = rowData;

        emailContainer.appendChild(trElement);
    });
}

function emailClickHandler(event) {
    const clickedRow = event.target.closest("tr");
    if (!clickedRow) return;
    const rowData = clickedRow.getAttribute("data-item");
    openModal(ACTION_TYPES.EMAIL_TEMPLATE_UPDATE, JSON.parse(rowData));
}

async function getAllEmailTemplate() {
    try {
        const response = await clientApp.request.invokeTemplate("getAllEmailTemplate", {});
        const data = JSON.parse(response.response);
        generateEmailTemplateHTML(data.records);
        templates = data.records;
        emailContainer.addEventListener("click", emailClickHandler);
    } catch (error) {
        console.error(error);
    }
}

function generateSRCategoryHTML(records) {
    let html = "";
    records?.forEach((item) => {
        const { workspace_id, app_code, app_name, process_code, process_name, process_image } = item.data;
        const rowData = JSON.stringify(item.data);
        const row = `<tr class="border-b hover:bg-gray-50" data-item='${rowData}'>
                      <td class="px-4 py-3 w-24">
                        ${process_image}
                      </td>
                      <td class="px-4 py-3">
                        ${workspaces.find((item) => item.data.workspace_id == workspace_id)?.data.name || ""}
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
}

function categoryClickHandler(event) {
    const clickedRow = event.target.closest("tr");
    if (!clickedRow) return;
    const rowData = clickedRow.getAttribute("data-item");
    openModal(ACTION_TYPES.SERVICE_REQUEST_UPDATE, JSON.parse(rowData));
}

async function getAllSRCategory() {
    try {
        const response = await clientApp.request.invokeTemplate("getAllSRCategory", {});
        const data = JSON.parse(response.response);
        const html = generateSRCategoryHTML(data.records);
        categories = data.records;
        apps = getUniqueAppInfo(data.records);
        generateFilter();
        generateStateFilter();
        categoryContainer.innerHTML = html;
        categoryContainer.addEventListener("click", categoryClickHandler);
    } catch (error) {
        console.error(error);
    }
}

async function getConditionFields(sr) {
    const [customObject, serviceItem] = await Promise.all([
        getDetailCustomObject(sr.data.related_custom_object),
        getServiceItem(sr.data.service_item_id, sr.data.workspace_id)
    ]);
    const fields = [...(serviceItem?.custom_fields ?? []), ...(customObject?.fields ?? [])];
    await clientApp.instance.send({ message: { type: ACTION_TYPES.SERVICE_ITEM, data: fields } });
}

async function getCustomObjects(id) {
    try {
        const response = await clientApp.request.invokeTemplate("getCustomObjects", {
            context: { id }
        });
        const custom_objects = JSON.parse(response.response)?.custom_objects;
        await clientApp.instance.send({ message: { type: ACTION_TYPES.CUSTOM_OBJECT, data: custom_objects } });
    } catch (error) {
        console.error(error);
    }
}

async function getServiceItem(id, workspace_id) {
    try {
        const response = await clientApp.request.invokeTemplate("getServiceItem", {
            context: { id, workspace_id }
        });
        const data = JSON.parse(response.response)?.service_item;
        return data;
    } catch (error) {
        console.error(error);
    }
}

async function getDetailCustomObject(id) {
    try {
        const response = await clientApp.request.invokeTemplate("getDetailCustomObject", {
            context: { id }
        });
        const data = JSON.parse(response.response)?.custom_object;
        return data;
    } catch (error) {
        console.error(error);
    }
}

function generateStateApprovalHTML(records) {
    let html = "";
    records?.forEach((item) => {
        const { app_code, process_code, state_name, state } = item.data;
        const rowData = JSON.stringify(item.data);
        const row = `<tr class="border-b hover:bg-gray-50" data-item='${rowData}'>
                      <td class="px-4 py-3"> ${apps.find((item) => item.app_code == app_code)?.app_name || ""}</td>
                      <td class="px-4 py-3"> ${categories.find((item) => item.data.process_code == process_code)?.data.process_name || ""}</td>
                      <th scope="row" class="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        ${state_name}
                      </td>
                      <td class="px-4 py-3"> ${state}</td>
                  </tr>`;
        html += row;
    });
    return html;
}

function stateClickHandler(event) {
    const clickedRow = event.target.closest("tr");
    if (!clickedRow) return;
    const rowData = clickedRow.getAttribute("data-item");
    openModal(ACTION_TYPES.STATE_APPROVAL_UPDATE, JSON.parse(rowData));
}

async function getAllStateApproval() {
    try {
        const response = await clientApp.request.invokeTemplate("getAllStateApproval", {});
        const data = JSON.parse(response.response);
        states = data.records;
        const html = generateStateApprovalHTML(states);
        stateContainer.innerHTML = html;
        stateContainer.addEventListener("click", stateClickHandler);
    } catch (error) {
        console.error(error);
    }
}

function generateFilter() {
    html = "";
    apps.forEach((item) => {
        const { app_code, app_name } = item;
        const option = document.createElement("option");
        option.value = app_code;
        option.text = app_name;
        document.getElementById("appFilter").append(option);
    });
    document.getElementById("appFilter").addEventListener("change", handleFilterChange);
}

function handleFilterChange(e) {
    const selectedCategories = e.target.value;
    let list = stateChange;
    if (selectedCategories) {
        list = stateChange.filter((item) => item.data.app_code == selectedCategories);
    }
    const html = generateGroupApproval(list);
    updateListGroupApproval(html);
}

function generateStateFilter() {
    html = "";
    apps.forEach((item) => {
        const { app_code, app_name } = item;
        const option = document.createElement("option");
        option.value = app_code;
        option.text = app_name;
        document.getElementById("appStateFilter").append(option);
    });
    document.getElementById("appStateFilter").addEventListener("change", handleStateFilterChange);
}

function handleStateFilterChange(e) {
    const selectedCategories = e.target.value;
    let list = states;
    if (selectedCategories) {
        list = states.filter((item) => item.data.app_code == selectedCategories);
    }
    const html = generateStateApprovalHTML(list);
    stateContainer.innerHTML = html;
    stateContainer.addEventListener("click", stateClickHandler);
}

function generateSRFilter() {
    workspaces.forEach((item) => {
        const { workspace_id, name } = item.data;
        const option = document.createElement("option");
        option.value = workspace_id;
        option.text = name;
        document.getElementById("workspaceFilter").append(option);
    });

    document.getElementById("workspaceFilter").addEventListener("change", handleFilterSRChange);
}

function handleFilterSRChange(e) {
    const selectedWorkspace = e.target.value;
    let list = categories;
    if (selectedWorkspace) {
        list = categories.filter((item) => item.data.workspace_id == selectedWorkspace);
    }
    const html = generateSRCategoryHTML(list);
    categoryContainer.innerHTML = html;
    categoryContainer.addEventListener("click", categoryClickHandler);
}

function getUniqueAppInfo(jsonData) {
    const uniqueAppInfo = new Set();

    jsonData.forEach((record) => {
        const appCode = record.data.app_code;
        const appName = record.data.app_name;
        uniqueAppInfo.add(`${appCode}-${appName}`);
    });

    const uniqueAppInfoArray = Array.from(uniqueAppInfo);

    const result = uniqueAppInfoArray.map((appInfo) => {
        const [appCode, appName] = appInfo.split("-");
        return { app_code: appCode, app_name: appName };
    });
    return result;
}

async function getAllServiceItem() {
    try {
        const response = await clientApp.request.invokeTemplate("getAllWorkspace", {});
        workspaces = JSON.parse(response.response).records;
        generateSRFilter(workspaces);
        await Promise.all(
            workspaces.map(async ({ data }) => {
                const res = await clientApp.request.invokeTemplate("getAllServiceItem", {
                    context: { workspace_id: data.workspace_id }
                });
                serviceItems.push(...mappingServiceCatalog(data, JSON.parse(res.response).service_items));
            })
        );
    } catch (error) {
        console.error(error);
    }
}

async function getStateApprovalByApp(app_code, process_code) {
    try {
        const response = await clientApp.request.invokeTemplate("getStateApprovalByApp", {
            context: { app_code, process_code }
        });
        const data = JSON.parse(response.response);
        return data.records;
    } catch (error) {
        console.error(error);
    }
}

async function getStateChangeApprovalByApp(app_code, process_code) {
    try {
        const response = await clientApp.request.invokeTemplate("getStateChangeApprovalByApp", {
            context: { app_code, process_code }
        });
        const data = JSON.parse(response.response);
        return data.records;
    } catch (error) {
        console.error(error);
    }
}

async function getDataSR(app_code, process_code) {
    const [states, state_changes] = await Promise.all([getStateApprovalByApp(app_code, process_code), getStateChangeApprovalByApp(app_code, process_code)]);
    return { states, state_changes };
}

function handleTabsConfig(data) {
    const { service_item_id, tabs } = data;
    Promise.all(
        tabs?.map(async (item) => {
            const body = {
                service_item_id,
                tab_code: item.tab_code,
                tab_name: item.tab_name,
                custom_object_id: item.custom_object_id,
                is_table: Number(item.is_table),
                fields: JSON.stringify(item.fields),
                fields_id: Array.isArray(item.fields) ? item.fields.map((field) => field.name).join(";") : ""
            };
            console.log(body);
            if (item.bo_display_id) {
                updateTabsConfig(item.bo_display_id, body);
            } else {
                createTabsConfig(body);
            }
        })
    );
}

function mappingServiceCatalog(workspace, list) {
    return list?.map((item) => {
        return {
            ...item,
            name: `[${workspace.name}] ${item.name}`
        };
    });
}

function toggleLoading(isLoading = true) {
    if (isLoading) loading.style.display = "block";
    else loading.style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
    app.initialized().then(initApp);
});
