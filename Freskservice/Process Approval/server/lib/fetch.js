const moment = require('moment');

async function getGroupApprovalRule(current_state) {
    const { response: groupApprovalRes } = await $request.invokeTemplate("getGroupApprovalRule", {
        context: { current_state }
    });
    const groupApproval = JSON.parse(groupApprovalRes).records[0]?.data;
    return groupApproval
}

async function getRequester(requester_id) {
    const { response } = await $request.invokeTemplate("getARequester", {
        context: { requester_id }
    });
    return JSON.parse(response).requester;
}

async function getRequesters(department_id) {
    const { response } = await $request.invokeTemplate("getRequesters", {
        context: { department_id }
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

async function getProcessLog(ticket_id) {
    const { response: currentStateRes } = await $request.invokeTemplate("getProcessLog", {
        context: { ticket_id }
    });
    const currentState = JSON.parse(currentStateRes).records[0]?.data;
    return currentState
}

async function createProcessLog(data) {
    const { response: currentStateRes } = await $request.invokeTemplate("createProcessLog", {
        body: JSON.stringify({ data: data })
    });
    const currentState = JSON.parse(currentStateRes)?.custom_object.data;
    return currentState
}

async function updateProcessLog(id, newState, sr_json_approvals, sr_visible_to = '') {
    await $request.invokeTemplate("updateProcessLog", {
        context: { id },
        body: JSON.stringify({
            data: {
                "sr_state": newState,
                "updated_date": moment(new Date()).format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'),
                "sr_json_approvals": sr_json_approvals,
                "sr_visible_to": sr_visible_to
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
exports = {
    getGroupApprovalRule,
    getProcessLog,
    createProcessLog,
    updateProcessLog,
    getRequester,
    getRequesters,
    getRequestedItems,
    getTicketApprovals,
    requestApproval
};