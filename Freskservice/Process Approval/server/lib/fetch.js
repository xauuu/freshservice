const moment = require("moment");
const fetch = require("node-fetch");
const base64 = require("base-64");

async function getGroupApprovalRule(app_code, process_code, current_state) {
    const { response: groupApprovalRes } = await $request.invokeTemplate("getGroupApprovalRule", {
        context: { app_code, process_code, current_state }
    });
    const groupApproval = JSON.parse(groupApprovalRes).records[0]?.data;
    return groupApproval;
}

async function getRequester(requester_id) {
    const { response } = await $request.invokeTemplate("getARequester", {
        context: { requester_id }
    });
    return JSON.parse(response).requester;
}

async function getRequesters(requester_group_id) {
    const { response } = await $request.invokeTemplate("getRequesters", {
        context: { requester_group_id }
    });
    return JSON.parse(response).requesters;
}

async function requestApproval(ticket_id, approver_id, approval_type, email_content) {
    await $request.invokeTemplate("requestApproval", {
        context: { ticket_id },
        body: JSON.stringify({
            approver_id,
            approval_type: Number(approval_type),
            email_content
        })
    });
}

async function getProcessLog(app_code, process_code, ticket_id) {
    const { response: currentStateRes } = await $request.invokeTemplate("getProcessLog", {
        context: { app_code, process_code, ticket_id }
    });
    const currentState = JSON.parse(currentStateRes).records[0]?.data;
    return currentState;
}

async function createProcessLog(data) {
    const { response: currentStateRes } = await $request.invokeTemplate("createProcessLog", {
        body: JSON.stringify({ data: data })
    });
    const currentState = JSON.parse(currentStateRes)?.custom_object.data;
    return currentState;
}

async function updateProcessLog(id, newState, sr_json_approvals, sr_visible_to = "") {
    await $request.invokeTemplate("updateProcessLog", {
        context: { id },
        body: JSON.stringify({
            data: {
                sr_state: newState,
                updated_date: moment(new Date()).format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]"),
                sr_json_approvals: sr_json_approvals,
                sr_visible_to: sr_visible_to
            }
        })
    });
}

async function getRequestedItems(ticket_id) {
    const { response } = await $request.invokeTemplate("getRequestedItems", {
        context: { ticket_id }
    });
    return JSON.parse(response).requested_items[0];
}

async function getTicketApprovals(ticket_id) {
    const { response } = await $request.invokeTemplate("getTicketApprovals", {
        context: { ticket_id }
    });
    return JSON.parse(response).approvals;
}

async function getServiceCategory(service_item_id) {
    const { response } = await $request.invokeTemplate("getServiceCategory", {
        context: { service_item_id }
    });
    return JSON.parse(response).records[0]?.data;
}

async function getEmailTemplate(email_code) {
    const { response } = await $request.invokeTemplate("getEmailTemplate", {
        context: { email_code }
    });
    return JSON.parse(response).records[0].data;
}

async function getDepartment(id) {
    const { response } = await $request.invokeTemplate("getDepartment", {
        context: { id }
    });
    return JSON.parse(response).department;
}

async function updateRequestedItem(ticket_id, id, body) {
    await $request.invokeTemplate("updateRequestedItem", {
        context: { ticket_id, id },
        body: JSON.stringify(body)
    });
}

async function updateTicket(ticket_id, body) {
    return await $request.invokeTemplate("updateTicket", {
        context: { ticket_id },
        body: JSON.stringify(body)
    });
}

async function getRequesterGroup(id) {
    const { response } = await $request.invokeTemplate("getRequesterGroup", {
        context: { id }
    });
    return JSON.parse(response).requester_group;
}

async function getAgentGroup(id) {
    try {
        const { response } = await $request.invokeTemplate("getAgentGroup", {
            context: { id }
        });
        return JSON.parse(response).group;
    } catch (error) {
        return [];
    }
}

async function createApprovalLog(data) {
    try {
        await $request.invokeTemplate("createApprovalLog", {
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.log("Error in create approval log", error);
    }
}

async function getProcessApproval(id) {
    try {
        const { response } = await $request.invokeTemplate("getProcessApproval", {
            context: { id }
        });
        return JSON.parse(response).records[0]?.data;
    } catch (error) {
        console.log(error);
    }
}

async function getProcessCondition(id) {
    try {
        const { response } = await $request.invokeTemplate("getProcessCondition", {
            context: { id }
        });
        return JSON.parse(response).records[0]?.data;
    } catch (error) {
        console.log(error);
    }
}

async function getProcessFileGeneration(id) {
    try {
        const { response } = await $request.invokeTemplate("getProcessFileGeneration", {
            context: { id }
        });
        return JSON.parse(response).records[0]?.data;
    } catch (error) {
        console.log(error);
    }
}

async function getCustomObject(custom_object_id, query) {
    try {
        const { response } = await $request.invokeTemplate("getCustomObject", {
            context: { custom_object_id, query }
        });
        const result = JSON.parse(response).records;
        return result?.map((item) => item.data);
    } catch (error) {
        console.log(error);
    }
}

async function getDocumentTemplate(template_code) {
    const { response } = await $request.invokeTemplate("getDocumentTemplate", {
        context: { template_code }
    });
    return JSON.parse(response).records[0].data;
}

function updateTicketAttachment(args, ticket_id, body) {
    return new Promise((resolve, reject) => {
        fetch(`https://${args.iparams.domain}/api/v2/tickets/` + ticket_id, {
            method: "PUT",
            body,
            headers: {
                Authorization: "Basic " + base64.encode(args.iparams.apikey + ":X")
            }
        })
            .then((response) => {
                if (!response.ok) {
                    reject(`Lỗi HTTP: ${response.status}`);
                } else {
                    resolve(response);
                }
            })
            .catch((error) => {
                reject(error);
            });
    });
}

async function getAnAgent(id) {
    const { response } = await $request.invokeTemplate("getAnAgent", {
        context: { id }
    });
    return JSON.parse(response).agent;
}

async function createCustomObject(args, custom_object_id, data) {
    // try {
    //     return await $request.invokeTemplate("createCustomObject", {
    //         context: { custom_object_id },
    //         body: JSON.stringify(data)
    //     });
    // } catch (error) {
    //     console.log("Error in create createCustomObject", error);
    //     throw error;
    // }
    return new Promise((resolve, reject) => {
        fetch(`https://${args.iparams.domain}/api/v2/objects/${custom_object_id}/records`, {
            method: "POST",
            body: JSON.stringify({ data }),
            headers: {
                Authorization: "Basic " + base64.encode(args.iparams.apikey + ":X"),
                Accept: "application/json",
                "Content-Type": "application/json"
            }
        })
            .then((response) => {
                if (!response.ok) {
                    reject(`Lỗi HTTP: ${response.status}`);
                } else {
                    resolve(response);
                }
            })
            .catch((error) => {
                reject(error);
            });
    });
}

async function showCustomObject(custom_object_id) {
    const { response } = await $request.invokeTemplate("showCustomObject", {
        context: { custom_object_id }
    });
    return JSON.parse(response).custom_object;
}

exports = {
    getGroupApprovalRule,
    getProcessLog,
    createProcessLog,
    updateProcessLog,
    getRequester,
    getRequesters,
    getRequestedItems,
    getTicketApprovals,
    requestApproval,
    getServiceCategory,
    getEmailTemplate,
    getDepartment,
    updateRequestedItem,
    updateTicket,
    getRequesterGroup,
    getAgentGroup,
    createApprovalLog,
    getProcessApproval,
    getProcessCondition,
    getProcessFileGeneration,
    getCustomObject,
    getDocumentTemplate,
    updateTicketAttachment,
    getAnAgent,
    createCustomObject,
    showCustomObject
};
