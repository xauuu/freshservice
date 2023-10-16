async function getGroupApprovalRule(app_code, process_code, current_state) {
    const { response: groupApprovalRes } = await $request.invokeTemplate("getGroupApprovalRule", {
        context: { app_code, process_code, current_state }
    });
    const groupApproval = JSON.parse(groupApprovalRes).records[0]?.data;
    return groupApproval
}

async function getRequestedItems(ticket_id) {
    const { response } = await $request.invokeTemplate("getRequestedItems", {
        context: { ticket_id }
    });
    return JSON.parse(response).requested_items[0];
}

async function getServiceCategory(service_item_id) {
    const { response } = await $request.invokeTemplate("getServiceCategory", {
        context: { service_item_id }
    });
    return JSON.parse(response).records[0]?.data;;
}

exports = { getGroupApprovalRule, getRequestedItems, getServiceCategory }
