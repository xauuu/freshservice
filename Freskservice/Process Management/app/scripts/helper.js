function generateApp(list, selected) {
    list?.forEach((item) => {
        const { app_code, app_name } = item;
        const option = document.createElement('option')
        option.value = app_code
        option.text = app_name
        option.selected = selected
        document.getElementById("app_code").append(option)
    });
}

function generateProcess(list, selected) {
    document.getElementById("process_code").innerHTML = ""
    list?.forEach((item) => {
        const { process_code, process_name } = item.data;
        const option = document.createElement('option')
        option.value = process_code
        option.text = process_name
        option.selected = selected
        document.getElementById("process_code").append(option)
    });
}

function generateGroup(container, list, context) {
    list.forEach((item) => {
        const { id, name } = item;
        const option = document.createElement('option')
        option.value = id
        option.text = name
        option.selected = id == context.detail?.[container]
        document.getElementById(container).append(option)
    });
}

function generateState(states, selected) {
    states.forEach((item) => {
        const { state_name, state } = item.data;
        const option = document.createElement('option')
        option.value = state
        option.text = state_name
        option.selected = state == selected
        document.getElementById("current_state").append(option)
    });
}

function generateNewState(id, states, context) {
    states.forEach((item) => {
        const { state_name, state: new_state } = item.data;
        const option = document.createElement('option')
        option.value = new_state
        option.text = state_name
        option.selected = new_state == context.detail?.[id]
        document.getElementById(id).append(option)
    });
}

function generateEmailTemplate(id, list, context) {
    const selectElement = document.getElementById(id);

    if (!selectElement) {
        console.error(`Element with ID ${id} not found.`);
        return;
    }

    list.forEach((item) => {
        const { email_code, email_name } = item.data;
        const option = document.createElement('option');
        option.value = email_code;
        option.text = email_name;

        if (email_code === context.detail?.[id]) {
            option.selected = true;
        }

        selectElement.append(option);
    });
}

function generateWorkflow(processList, selected) {
    processList.forEach((item) => {
        const { workflow_code, workflow_name } = item.data;
        const option = document.createElement('option')
        option.value = workflow_code
        option.text = workflow_name
        option.selected = selected == workflow_code
        document.getElementById("workflow_code").append(option)
    });
}