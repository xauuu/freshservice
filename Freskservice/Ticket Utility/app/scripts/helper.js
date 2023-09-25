const ACTIONS = {
    CLOSE_MODAL: "CLOSE_MODAL",
    CREATE_CHECK_STOCKS: "CREATE_CHECK_STOCKS",
    UPDATE_CHECK_STOCKS: "UPDATE_CHECK_STOCKS",
    CREATE_SCHEDULE_CALENDAR: "CREATE_SCHEDULE_CALENDAR",
    UPDATE_SCHEDULE_CALENDAR: "UPDATE_SCHEDULE_CALENDAR",
    FILTER_AGENT: "FILTER_AGENT",
}

function generateAssetType(container, list, selected_id) {
    list.forEach((item) => {
        const { bo_display_id, asset_type_name } = item.data;
        const option = document.createElement('option')
        option.value = bo_display_id
        option.text = asset_type_name
        option.selected = bo_display_id === selected_id
        document.getElementById(container).append(option)
    });
}
function generateAgent(container, list) {
    list.forEach((item) => {
        const { id, first_name, last_name, email } = item;
        const option = document.createElement('option')
        option.value = container === "filter_agent" ? email : id
        option.text = `${first_name} ${last_name} <${email}>`
        document.getElementById(container).append(option)
    });
}