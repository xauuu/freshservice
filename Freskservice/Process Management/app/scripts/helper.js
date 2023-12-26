function generateApp(list, selected) {
    const options = list?.map((item) => {
        return { value: item.app_code, text: item.app_name };
    });
    document.getElementById("app_code").choices = options;
    document.getElementById("app_code").value = selected;
}

function generateProcess(list, selected) {
    const options = list?.map((item) => {
        return { value: item.data.process_code, text: item.data.process_name };
    });
    document.getElementById("process_code").choices = options;
    document.getElementById("process_code").value = selected;
}

function generateGroup(container, list, context) {
    const options = list?.map((item) => {
        return { value: String(item.id), text: item.name };
    });
    document.getElementById(container).choices = options;
    document.getElementById(container).value = String(context.detail?.[container]);
}

function generateState(id, list, context) {
    const options = list?.map((item) => {
        return { value: item.data.state, text: item.data.state_name };
    });
    document.getElementById(id).choices = options?.sort((a, b) => a.value.localeCompare(b.value));
    document.getElementById(id).value = String(context.detail?.[id]);
}

function generateEmailTemplate(id, list, context) {
    const selectElement = document.getElementById(id);

    const options = list?.map((item) => {
        return { value: item.data.email_code, text: item.data.email_name };
    });
    selectElement.choices = options;
    selectElement.value = context.detail?.[id];
}

function generateDocumentTemplate(id, list, context) {
    const selectElement = document.getElementById(id);

    const options = list?.map((item) => {
        return { value: item.data.template_code, text: item.data.template_name };
    });
    selectElement.choices = options;
    selectElement.value = context.detail?.[id];
}

function generateWorkflow(processList, selected) {
    processList.forEach((item) => {
        const { workflow_code, workflow_name } = item.data;
        const option = document.createElement("option");
        option.value = workflow_code;
        option.text = workflow_name;
        option.selected = selected == workflow_code;
        document.getElementById("workflow_code").append(option);
    });
}

function generateFields(container, list) {
    const selectElement = document.getElementById(container);
    const options = list?.map((item) => {
        return { value: item.name, text: item.label };
    });
    selectElement.choices = options;
}

function generateSelectFields(container, list) {
    const selectElement = document.getElementById(container);
    const options = list?.map((item) => {
        return { ...item, value: item.name, text: item.label };
    });
    selectElement.options = options;
}

function generateCustomObject(container, list) {
    const options = list?.map((item) => {
        return { value: String(item.id), text: item.title };
    });
    document.getElementById(container).choices = options;
}

function blobToBase64(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(blob);
    });
}

const b64toBlob = (b64Data, contentType = "", sliceSize = 512) => {
    try {
        const byteCharacters = atob(b64Data);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);

            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        const blob = new Blob(byteArrays, { type: contentType });
        return blob;
    } catch (error) {
        console.log(error);
    }
};
