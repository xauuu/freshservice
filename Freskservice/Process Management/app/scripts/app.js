var clientApp = null;
var requesterGroups = [];
var categories = [];
var templates = [];
var apps = [];
var stateChanges = [];
var states = [];
var workflows = [];
var serviceItems = [];
var agentGroups = [];
var workspaces = [];
var documentTemplates = [];
var iparams;

const loading = document.getElementById("loading");
const categoryContainer = document.getElementById("listSRCategory");
const emailContainer = document.getElementById("listEmail");
const stateContainer = document.getElementById("listState");
const approvalContainer = document.getElementById("listCO");
const documentContainer = document.getElementById("listDocument");

async function initApp(_client) {
    toggleLoading();
    clientApp = _client;
    iparams = await clientApp.iparams.get();
    await getAllServiceItem();
    await SERVICE_REQUEST.all();
    await STATE_APPROVAL.all();
    await Promise.all([EMAIL_TEMPLATE.all(), DOCUMENT_TEMPLATE.all(), STATE_CHANGE.all(), getAllRequesterGroup(), getAllAgentGroup()]);
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
        [ACTION_TYPES.STATE_APPROVAL_UPDATE]: "Edit State",
        [ACTION_TYPES.DOCUMENT_TEMPLATE_CREATE]: "Add Document Template",
        [ACTION_TYPES.DOCUMENT_TEMPLATE_UPDATE]: "Edit Document Template"
    };
    const templateMap = {
        [ACTION_TYPES.GROUP_APPROVAL_CREATE]: "modals/modal.html",
        [ACTION_TYPES.GROUP_APPROVAL_UPDATE]: "modals/modal.html",
        [ACTION_TYPES.EMAIL_TEMPLATE_CREATE]: "modals/email-modal.html",
        [ACTION_TYPES.EMAIL_TEMPLATE_UPDATE]: "modals/email-modal.html",
        [ACTION_TYPES.SERVICE_REQUEST_CREATE]: "modals/sr-modal.html",
        [ACTION_TYPES.SERVICE_REQUEST_UPDATE]: "modals/sr-modal.html",
        [ACTION_TYPES.STATE_APPROVAL_CREATE]: "modals/state-modal.html",
        [ACTION_TYPES.STATE_APPROVAL_UPDATE]: "modals/state-modal.html",
        [ACTION_TYPES.DOCUMENT_TEMPLATE_CREATE]: "modals/document-modal.html",
        [ACTION_TYPES.DOCUMENT_TEMPLATE_UPDATE]: "modals/document-modal.html"
    };
    const listMap = {
        [ACTION_TYPES.GROUP_APPROVAL_CREATE]: { apps, categories, workflows, templates, requesterGroups, states, agentGroups, documentTemplates },
        [ACTION_TYPES.GROUP_APPROVAL_UPDATE]: { apps, categories, workflows, templates, requesterGroups, states, agentGroups, documentTemplates },
        [ACTION_TYPES.EMAIL_TEMPLATE_CREATE]: {},
        [ACTION_TYPES.EMAIL_TEMPLATE_UPDATE]: {},
        [ACTION_TYPES.SERVICE_REQUEST_CREATE]: { serviceItems, workspaces },
        [ACTION_TYPES.SERVICE_REQUEST_UPDATE]: { serviceItems, workspaces },
        [ACTION_TYPES.STATE_APPROVAL_CREATE]: { apps, categories, requesterGroups, agentGroups, states },
        [ACTION_TYPES.STATE_APPROVAL_UPDATE]: { apps, categories, requesterGroups, agentGroups, states },
        [ACTION_TYPES.DOCUMENT_TEMPLATE_CREATE]: {},
        [ACTION_TYPES.DOCUMENT_TEMPLATE_UPDATE]: {}
    };

    if (type === ACTION_TYPES.SERVICE_REQUEST_UPDATE) {
        const [state, tabs] = await Promise.all([getDataSR(detail?.app_code, detail?.process_code), TABS_CONFIG.detail(detail?.service_item_id)]);
        var more = { state, tabs };
    }
    if (type === ACTION_TYPES.GROUP_APPROVAL_UPDATE) {
        const [approval, template, condition] = await Promise.all([
            APPROVAL_STATE.detail(detail?.bo_display_id),
            FILE_GENERATION.detail(detail?.bo_display_id),
            CONDITIONS_CONFIG.detail(detail?.bo_display_id)
        ]);
        var more = { approval, template, condition };
    }
    if (type === ACTION_TYPES.STATE_APPROVAL_UPDATE) {
        const [tabPermissions, tabs] = await Promise.all([TAB_PERMISSION.detail(detail?.service_item_id), TABS_CONFIG.detail(detail?.service_item_id)]);
        var more = { tabPermissions, tabs };
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
    document.getElementById("createDocument").addEventListener("click", function () {
        openModal(ACTION_TYPES.DOCUMENT_TEMPLATE_CREATE);
    });
    clientApp.instance.receive(async (e) => {
        const { type, data, id } = e.helper.getData();
        switch (type) {
            case ACTION_TYPES.GROUP_APPROVAL_CREATE:
                await STATE_CHANGE.create(type, data);
                break;
            case ACTION_TYPES.GROUP_APPROVAL_UPDATE:
                await STATE_CHANGE.update(type, id, data);
                break;
            case ACTION_TYPES.EMAIL_TEMPLATE_CREATE:
                await EMAIL_TEMPLATE.create(type, data);
                break;
            case ACTION_TYPES.EMAIL_TEMPLATE_UPDATE:
                await EMAIL_TEMPLATE.update(type, id, data);
                break;
            case ACTION_TYPES.SERVICE_REQUEST_CREATE:
                await SERVICE_REQUEST.create(type, { ...data, is_active: Number(data.is_active) });
                break;
            case ACTION_TYPES.SERVICE_REQUEST_UPDATE:
                await SERVICE_REQUEST.update(type, id, { ...data, is_active: Number(data.is_active) });
                break;
            case ACTION_TYPES.STATE_APPROVAL_CREATE:
                await STATE_APPROVAL.create(type, data);
                break;
            case ACTION_TYPES.STATE_APPROVAL_UPDATE:
                await STATE_APPROVAL.update(type, id, data);
                break;
            case ACTION_TYPES.DOCUMENT_TEMPLATE_CREATE:
                DOCUMENT_TEMPLATE.create(type, data);
                break;
            case ACTION_TYPES.DOCUMENT_TEMPLATE_UPDATE:
                DOCUMENT_TEMPLATE.update(type, id, data);
                break;
            case ACTION_TYPES.SERVICE_ITEM:
                const sr = categories.find((item) => item.data.app_code == data.app_code && item.data.process_code == data.process_code);
                const custom_objects = await getCustomObjects(sr.data.workspace_id);
                const related_ids = sr.data.related_custom_objects?.split(";");
                if (related_ids && related_ids.length > 0) {
                    const related_custom_objects = custom_objects.filter((item) => related_ids.includes(item.id.toString()));
                    await clientApp.instance.send({ message: { type: ACTION_TYPES.RELATED_CUSTOM_OBJECT, data: related_custom_objects } });
                }
                break;
            case ACTION_TYPES.CUSTOM_OBJECT:
                await getCustomObjects(data);
                break;
            case ACTION_TYPES.CUSTOM_OBJECT_FIELDS:
                const fields = await getDetailCustomObject(data);
                await clientApp.instance.send({ message: { type: ACTION_TYPES.CUSTOM_OBJECT_FIELDS, data: fields?.fields } });
                break;
            case ACTION_TYPES.TABS_CONFIG:
                handleTabsConfig(data);
                break;
            case ACTION_TYPES.FILE_GENERATION:
                if (id) FILE_GENERATION.update(id, data);
                else FILE_GENERATION.create(data);
                break;
            case ACTION_TYPES.APPROVAL_STATE:
                if (id) APPROVAL_STATE.update(id, data);
                else APPROVAL_STATE.create(data);
                break;
            case ACTION_TYPES.GET_FIELDS_BY_TYPE:
                await getFieldsByType(data);
                break;
            case ACTION_TYPES.CONDITIONS_CONFIGURATION:
                if (id) CONDITIONS_CONFIG.update(id, data);
                else CONDITIONS_CONFIG.create(data);
                break;
            case ACTION_TYPES.TABS_PERMISSION:
                handleTabPermission(data);
                break;
        }
    });
}

const STATE_CHANGE = {
    create: async (type, data) => {
        try {
            await clientApp.request.invokeTemplate("createCustomObject", {
                context: { custom_object_id: iparams.group_approval_id },
                body: JSON.stringify({ data })
            });
            handleSuccess(type);
        } catch (error) {
            handleError(error);
        }
    },
    update: async (type, id, data) => {
        try {
            await clientApp.request.invokeTemplate("updateCustomObject", {
                context: { id, custom_object_id: iparams.group_approval_id },
                body: JSON.stringify({ data })
            });
            handleSuccess(type);
        } catch (error) {
            handleError(error);
        }
    },
    all: async () => {
        try {
            const response = await clientApp.request.invokeTemplate("getAllCustomObject", {
                context: { custom_object_id: iparams.group_approval_id }
            });
            const data = JSON.parse(response.response);
            stateChanges = data.records;
            generateGroupApproval(stateChanges);
        } catch (error) {
            console.error(error);
        }
    }
};

const SERVICE_REQUEST = {
    create: async (type, data) => {
        try {
            await clientApp.request.invokeTemplate("createCustomObject", {
                context: { custom_object_id: iparams.sr_category_id },
                body: JSON.stringify({ data })
            });
            handleSuccess(type);
        } catch (error) {
            handleError(error);
        }
    },
    update: async (type, id, data) => {
        try {
            await clientApp.request.invokeTemplate("updateCustomObject", {
                context: { id, custom_object_id: iparams.sr_category_id },
                body: JSON.stringify({ data })
            });
            handleSuccess(type);
        } catch (error) {
            handleError(error);
        }
    },
    all: async () => {
        try {
            const response = await clientApp.request.invokeTemplate("getAllCustomObject", {
                context: { custom_object_id: iparams.sr_category_id }
            });
            const data = JSON.parse(response.response);
            generateSRCategoryHTML(data.records);
            categories = data.records;
            apps = getUniqueAppInfo(data.records);
            generateFilter();
            generateStateFilter();
        } catch (error) {
            console.error(error);
        }
    }
};

const EMAIL_TEMPLATE = {
    create: async (type, data) => {
        try {
            await clientApp.request.invokeTemplate("createCustomObject", {
                context: { custom_object_id: iparams.email_template_id },
                body: JSON.stringify({ data })
            });
            handleSuccess(type);
        } catch (error) {
            handleError(error);
        }
    },
    update: async (type, id, data) => {
        try {
            await clientApp.request.invokeTemplate("updateCustomObject", {
                context: { id, custom_object_id: iparams.email_template_id },
                body: JSON.stringify({ data })
            });
            handleSuccess(type);
        } catch (error) {
            handleError(error);
        }
    },
    all: async () => {
        try {
            const response = await clientApp.request.invokeTemplate("getAllCustomObject", {
                context: { custom_object_id: iparams.email_template_id }
            });
            const data = JSON.parse(response.response);
            generateEmailTemplateHTML(data.records);
            templates = data.records;
        } catch (error) {
            console.error(error);
        }
    }
};

const STATE_APPROVAL = {
    create: async (type, data) => {
        try {
            await clientApp.request.invokeTemplate("createCustomObject", {
                context: { custom_object_id: iparams.state_approval_id },
                body: JSON.stringify({ data })
            });
            handleSuccess(type);
        } catch (error) {
            handleError(error);
        }
    },
    update: async (type, id, data) => {
        try {
            await clientApp.request.invokeTemplate("updateCustomObject", {
                context: { id, custom_object_id: iparams.state_approval_id },
                body: JSON.stringify({ data })
            });
            handleSuccess(type);
        } catch (error) {
            handleError(error);
        }
    },
    all: async () => {
        try {
            const response = await clientApp.request.invokeTemplate("getAllCustomObject", {
                context: { custom_object_id: iparams.state_approval_id }
            });
            const data = JSON.parse(response.response);
            states = data.records;
            generateStateApprovalHTML(states);
        } catch (error) {
            console.error(error);
        }
    }
};

const APPROVAL_STATE = {
    create: (data) => {
        clientApp.request
            .invokeTemplate("createCustomObject", {
                context: { custom_object_id: iparams.process_approval_state_id },
                body: JSON.stringify({ data })
            })
            .then(
                function (data) {
                    console.log("CREATE APPROVAL_STATE", data);
                },
                function (error) {
                    console.error("CREATE APPROVAL_STATE", error);
                }
            );
    },
    update: (id, data) => {
        clientApp.request
            .invokeTemplate("updateCustomObject", {
                context: { id, custom_object_id: iparams.process_approval_state_id },
                body: JSON.stringify({ data })
            })
            .then(
                function (data) {
                    console.log("UPDATE APPROVAL_STATE", data);
                },
                function (error) {
                    console.error("UPDATE APPROVAL_STATE", error);
                }
            );
    },
    detail: async (id) => {
        try {
            const response = await clientApp.request.invokeTemplate("queryCustomObject", {
                context: { query: `state_change_id : '${id}'`, custom_object_id: iparams.process_approval_state_id }
            });
            const data = JSON.parse(response.response);
            return data.records[0];
        } catch (error) {
            console.error(error);
        }
    }
};

const FILE_GENERATION = {
    create: (data) => {
        clientApp.request
            .invokeTemplate("createCustomObject", {
                context: { custom_object_id: iparams.process_file_generation_id },
                body: JSON.stringify({ data })
            })
            .then(
                function (data) {
                    console.log("CREATE FILE_GENERATION", data);
                },
                function (error) {
                    console.error("CREATE FILE_GENERATION", error);
                }
            );
    },
    update: (id, data) => {
        clientApp.request
            .invokeTemplate("updateCustomObject", {
                context: { id, custom_object_id: iparams.process_file_generation_id },
                body: JSON.stringify({ data })
            })
            .then(
                function (data) {
                    console.log("UPDATE FILE_GENERATION", data);
                },
                function (error) {
                    console.error("UPDATE FILE_GENERATION", error);
                }
            );
    },
    detail: async (id) => {
        try {
            const response = await clientApp.request.invokeTemplate("queryCustomObject", {
                context: { query: `state_change_id : '${id}'`, custom_object_id: iparams.process_file_generation_id }
            });
            const data = JSON.parse(response.response);
            return data.records[0];
        } catch (error) {
            console.error(error);
        }
    }
};

const DOCUMENT_TEMPLATE = {
    create: async (type, data) => {
        try {
            await clientApp.request.invokeTemplate("createCustomObject", {
                context: { custom_object_id: iparams.document_template_id },
                body: JSON.stringify({ data })
            });
            handleSuccess(type);
        } catch (error) {
            handleError(error);
        }
    },
    update: async (type, id, data) => {
        try {
            await clientApp.request.invokeTemplate("updateCustomObject", {
                context: { id, custom_object_id: iparams.document_template_id },
                body: JSON.stringify({ data })
            });
            handleSuccess(type);
        } catch (error) {
            handleError(error);
        }
    },
    all: async () => {
        try {
            const response = await clientApp.request.invokeTemplate("queryCustomObject", {
                context: { query: "", custom_object_id: iparams.document_template_id }
            });
            const data = JSON.parse(response.response);
            documentTemplates = data.records;
            generateDocumentTemplateHTML(documentTemplates);
            // documentContainer.addEventListener("click", documentClickHandler);
        } catch (error) {
            console.error(error);
        }
    }
};

const TABS_CONFIG = {
    create: (data) => {
        clientApp.request
            .invokeTemplate("createCustomObject", {
                context: { custom_object_id: iparams.tabs_id },
                body: JSON.stringify({ data })
            })
            .then(
                function (data) {
                    console.log("CREATE TABS_CONFIG", data);
                },
                function (error) {
                    console.error("CREATE TABS_CONFIG", error);
                }
            );
    },
    update: (id, data) => {
        clientApp.request
            .invokeTemplate("updateCustomObject", {
                context: { id, custom_object_id: iparams.tabs_id },
                body: JSON.stringify({ data })
            })
            .then(
                function (data) {
                    console.log("UPDATE TABS_CONFIG", data);
                },
                function (error) {
                    console.error("UPDATE TABS_CONFIG", error);
                }
            );
    },
    detail: async (id) => {
        try {
            const response = await clientApp.request.invokeTemplate("queryCustomObject", {
                context: { query: `service_item_id : '${id}'`, custom_object_id: iparams.tabs_id }
            });
            const data = JSON.parse(response.response);
            return data.records;
        } catch (error) {
            console.error(error);
        }
    }
};

const CONDITIONS_CONFIG = {
    create: (data) => {
        clientApp.request
            .invokeTemplate("createCustomObject", {
                context: { custom_object_id: iparams.process_condition_state_id },
                body: JSON.stringify({ data })
            })
            .then(
                function (data) {
                    console.log("CREATE CONDITIONS_CONFIG", data);
                },
                function (error) {
                    console.error("CREATE CONDITIONS_CONFIG", error);
                }
            );
    },
    update: (id, data) => {
        clientApp.request
            .invokeTemplate("updateCustomObject", {
                context: { id, custom_object_id: iparams.process_condition_state_id },
                body: JSON.stringify({ data })
            })
            .then(
                function (data) {
                    console.log("UPDATE CONDITIONS_CONFIG", data);
                },
                function (error) {
                    console.error("UPDATE CONDITIONS_CONFIG", error);
                }
            );
    },
    detail: async (id) => {
        try {
            const response = await clientApp.request.invokeTemplate("queryCustomObject", {
                context: { query: `state_change_id : '${id}'`, custom_object_id: iparams.process_condition_state_id }
            });
            const data = JSON.parse(response.response);
            return data.records[0];
        } catch (error) {
            console.error(error);
        }
    }
};

const TAB_PERMISSION = {
    create: (data) => {
        console.log({ data });
        clientApp.request
            .invokeTemplate("createCustomObject", {
                context: { custom_object_id: iparams.tab_permission_id },
                body: JSON.stringify({ data })
            })
            .then(
                function (data) {
                    console.log("CREATE TAB_PERMISSION", data);
                },
                function (error) {
                    console.error("CREATE TAB_PERMISSION", error);
                }
            );
    },
    update: (id, data) => {
        clientApp.request
            .invokeTemplate("updateCustomObject", {
                context: { id, custom_object_id: iparams.tab_permission_id },
                body: JSON.stringify({ data })
            })
            .then(
                function (data) {
                    console.log("UPDATE TAB_PERMISSION", data);
                },
                function (error) {
                    console.error("UPDATE TAB_PERMISSION", error);
                }
            );
    },
    detail: async (id) => {
        try {
            const response = await clientApp.request.invokeTemplate("queryCustomObject", {
                context: { query: `service_item_id : '${id}'`, custom_object_id: iparams.tab_permission_id }
            });
            const data = JSON.parse(response.response);
            return data.records;
        } catch (error) {
            console.error(error);
        }
    }
};

async function handleSuccess(type) {
    showNotification("success", MESSAGES[type]);
    clientApp.instance.send({ message: { type: ACTION_TYPES.CLOSE_MODAL } });
    if (type === ACTION_TYPES.GROUP_APPROVAL_CREATE || type === ACTION_TYPES.GROUP_APPROVAL_UPDATE) {
        STATE_CHANGE.all();
    } else if (type === ACTION_TYPES.EMAIL_TEMPLATE_CREATE || type === ACTION_TYPES.EMAIL_TEMPLATE_UPDATE) {
        EMAIL_TEMPLATE.all();
    } else if (type === ACTION_TYPES.SERVICE_REQUEST_CREATE || type === ACTION_TYPES.SERVICE_REQUEST_UPDATE) {
        SERVICE_REQUEST.all();
    } else if (type === ACTION_TYPES.STATE_APPROVAL_CREATE || type === ACTION_TYPES.STATE_APPROVAL_UPDATE) {
        STATE_APPROVAL.all();
    } else if (type === ACTION_TYPES.DOCUMENT_TEMPLATE_CREATE || type === ACTION_TYPES.DOCUMENT_TEMPLATE_UPDATE) {
        DOCUMENT_TEMPLATE.all();
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

function generateGroupApproval(records) {
    approvalContainer.innerHTML = "";
    records?.forEach((item) => {
        const { name, app_code, process_code, current_state, expired_new_state, configuration_type } = item.data;
        const trElement = document.createElement("tr");
        trElement.classList.add("border-b", "hover:bg-gray-50");

        trElement.innerHTML = `<td class="px-4 py-3"> ${apps.find((item) => item.app_code == app_code)?.app_name || ""}</td>
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
                      <td class="px-4 py-3"> ${configuration_type}</td>`;
        trElement.addEventListener("click", () => {
            openModal(ACTION_TYPES.GROUP_APPROVAL_UPDATE, item.data);
        });

        approvalContainer.appendChild(trElement);
    });
}

function generateEmailTemplateHTML(records) {
    emailContainer.innerHTML = "";
    records?.forEach((item) => {
        const { email_code, email_name, subject } = item.data;
        const trElement = document.createElement("tr");
        trElement.classList.add("border-b", "hover:bg-gray-50");

        trElement.innerHTML = `<th scope="row" class="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                              ${email_code}
                            </th>
                            <td class="px-4 py-3">${email_name}</td>
                            <td class="px-4 py-3">${subject}</td>`;
        trElement.addEventListener("click", () => {
            openModal(ACTION_TYPES.EMAIL_TEMPLATE_UPDATE, item.data);
        });
        emailContainer.appendChild(trElement);
    });
}

function generateSRCategoryHTML(records) {
    categoryContainer.innerHTML = "";
    records?.forEach((item) => {
        const { workspace_id, app_code, app_name, process_code, process_name, process_image } = item.data;

        const trElement = document.createElement("tr");
        trElement.classList.add("border-b", "hover:bg-gray-50");

        trElement.innerHTML = `<td class="px-4 py-3 w-24">
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
                                <td class="px-4 py-3"> ${app_code}</td>`;
        trElement.addEventListener("click", () => {
            openModal(ACTION_TYPES.SERVICE_REQUEST_UPDATE, item.data);
        });
        categoryContainer.appendChild(trElement);
    });
}

function generateStateApprovalHTML(records) {
    stateContainer.innerHTML = "";
    records?.forEach((item) => {
        const { app_code, process_code, state_name, state } = item.data;
        const trElement = document.createElement("tr");
        trElement.classList.add("border-b", "hover:bg-gray-50");

        trElement.innerHTML = `<td class="px-4 py-3"> ${apps.find((item) => item.app_code == app_code)?.app_name || ""}</td>
                                <td class="px-4 py-3"> ${categories.find((item) => item.data.process_code == process_code)?.data.process_name || ""}</td>
                                <th scope="row" class="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                    ${state_name}
                                </td>
                                <td class="px-4 py-3"> ${state}</td>`;
        trElement.addEventListener("click", () => {
            openModal(ACTION_TYPES.STATE_APPROVAL_UPDATE, item.data);
        });

        stateContainer.appendChild(trElement);
    });
}

function generateDocumentTemplateHTML(records) {
    documentContainer.innerHTML = "";
    records?.forEach((item) => {
        const { template_code, template_name, type } = item.data;
        const trElement = document.createElement("tr");
        trElement.classList.add("border-b", "hover:bg-gray-50");

        trElement.innerHTML = `<th scope="row" class="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                              ${template_code}
                            </th>
                            <td class="px-4 py-3">${template_name}</td>
                            <td class="px-4 py-3">${type}</td>`;
        // trElement.dataset.item = item.data;
        trElement.addEventListener("click", () => {
            openModal(ACTION_TYPES.DOCUMENT_TEMPLATE_UPDATE, item.data);
        });

        documentContainer.appendChild(trElement);
    });
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
        return custom_objects;
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
    let list = stateChanges;
    if (selectedCategories) {
        list = stateChanges.filter((item) => item.data.app_code == selectedCategories);
    }
    generateGroupApproval(list);
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
    generateStateApprovalHTML(list);
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
    generateSRCategoryHTML(list);
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
                fields: Array.isArray(item.fields) ? JSON.stringify(item.fields) : item.fields,
                fields_id: Array.isArray(item.fields) ? item.fields.map((item) => item.name)?.join(";") : item.fields_id,
                agent_groups_id: Array.isArray(item.agent_groups_id) ? item.agent_groups_id.join(";") : "",
                requester_groups_id: Array.isArray(item.requester_groups_id) ? item.requester_groups_id.join(";") : ""
            };
            if (item.bo_display_id) {
                TABS_CONFIG.update(item.bo_display_id, body);
            } else {
                TABS_CONFIG.create(body);
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

async function getTicketFields() {
    try {
        const response = await clientApp.request.invokeTemplate("getTicketFields", {});
        const data = JSON.parse(response.response);
        return data.ticket_fields;
    } catch (error) {
        console.error(error);
    }
}

async function getFieldsByType(data) {
    const { app_code, process_code, object_type, object_id } = data;
    let fields = [];
    if (object_type === "ticket") {
        fields = await getTicketFields();
    }
    if (object_type === "service_request") {
        const sr = categories.find((item) => item.data.app_code == app_code && item.data.process_code == process_code);
        const res = await getServiceItem(sr.data.service_item_id, sr.data.workspace_id);
        fields = res.custom_fields;
    }
    if (object_type === "custom_object") {
        const res = await getDetailCustomObject(object_id);
        fields = res.fields;
    }
    await clientApp.instance.send({ message: { type: ACTION_TYPES.GET_FIELDS_BY_TYPE, data: fields } });
}

function handleTabPermission(data) {
    const { service_item_id, tabPermissions, state } = data;
    Promise.all(
        tabPermissions?.map(async (item) => {
            const body = {
                can_view: Number(item.can_view),
                can_edit: Number(item.can_edit),
                can_delete: Number(item.can_delete),
                apply_to_requester: Number(item.apply_to_requester),
                agent_groups_id: item.agent_groups_id,
                requester_groups_id: item.requester_groups_id,
                tab_code: item.tab_code,
                state,
                service_item_id
            };
            if (item.bo_display_id) {
                TAB_PERMISSION.update(item.bo_display_id, body);
            } else {
                TAB_PERMISSION.create(body);
            }
        })
    );
}

document.addEventListener("DOMContentLoaded", () => {
    app.initialized().then(initApp);
});
