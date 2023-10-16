function generateApp(list, selected) {
    const options = list?.map((item) => {
        return { value: item.app_code, text: item.app_name };
    });
    document.getElementById("app_code").choices = options
    document.getElementById("app_code").value = selected
}

function generateProcess(list, selected) {
    const options = list?.map((item) => {
        return { value: item.data.process_code, text: item.data.process_name };
    });
    document.getElementById("process_code").choices = options
    document.getElementById("process_code").value = selected
}

function generateGroup(container, list, context) {
    const options = list?.map((item) => {
        return { value: String(item.id), text: item.name };
    });
    document.getElementById(container).choices = options
    document.getElementById(container).value = String(context.detail?.[container])
}

function generateState(id, list, context) {
    const options = list?.map((item) => {
        return { value: item.data.state, text: item.data.state_name };
    });
    document.getElementById(id).choices = options.sort((a, b) => a.value.localeCompare(b.value));
    document.getElementById(id).value = context.detail?.[id]
}

function generateEmailTemplate(id, list, context) {
    const selectElement = document.getElementById(id);

    const options = list?.map((item) => {
        return { value: item.data.email_code, text: item.data.email_name };
    });
    selectElement.choices = options
    selectElement.value = context.detail?.[id]
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