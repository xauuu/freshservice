const modal = document.getElementById("modal-detail");
const form = document.getElementById("form-tab");
const buttonSave = document.getElementById("form-tab-save");
const buttonClose = document.getElementById("form-tab-close");
const buttonAdd = document.getElementById("form-tab-add");
const buttonNew = document.getElementById("new-tab");

buttonClose.addEventListener("click", () => {
    modal.close();
    form.doReset();
});

buttonSave.addEventListener("click", async () => {
    const { values } = await form.doSubmit();
    const table = document.getElementById("data-table-tabs");
    await table.selectAllRows();
    const tableValues = await table.getSelectedRows();
    const indexToUpdate = tableValues.findIndex((item) => item.bo_display_id === values.bo_display_id);
    if (indexToUpdate !== -1) {
        tableValues[indexToUpdate] = {
            ...values,
            tab_code: values.tab_code?.join(";"),
            agent_groups_id: values.agent_groups_id?.join(";"),
            requester_groups_id: values.requester_groups_id?.join(";")
        };
    }
    table.rows = tableValues;
    form.doReset();
    modal.close();
});

buttonNew.addEventListener("click", () => {
    toggleButton(true);
    modal.open();
});

buttonAdd.addEventListener("click", async () => {
    const { values } = await form.doSubmit();
    const table = document.getElementById("data-table-tabs");
    await table.selectAllRows();
    const tableValues = await table.getSelectedRows();
    table.rows = [
        ...tableValues,
        {
            ...values,
            id: new Date().getTime(),
            tab_code: values.tab_code?.join(";"),
            agent_groups_id: values.agent_groups_id?.join(";"),
            requester_groups_id: values.requester_groups_id?.join(";")
        }
    ];
    form.doReset();
    modal.close();
});

function generateDataTable(values) {
    const datatable = document.getElementById("data-table-tabs");
    const columns = [
        {
            key: "tab_code",
            text: "Tab Code"
        }
    ];
    datatable.columns = columns;
    const rows = values.map((item) => item.data);
    datatable.rows = rows || [];
    datatable.rowActions = [
        {
            name: "Edit",
            handler: (rowData) => {
                toggleButton(false);
                modal.open();
                form.setFieldsValue({
                    ...rowData,
                    tab_code: rowData.tab_code?.split(";"),
                    agent_groups_id: rowData.agent_groups_id?.split(";"),
                    requester_groups_id: rowData.requester_groups_id?.split(";")
                });
            },
            graphicsProps: { name: "edit" }
        }
    ];
}

function toggleButton(isCreate) {
    if (isCreate) {
        buttonAdd.style.display = "inline-block";
        buttonSave.style.display = "none";
    } else {
        buttonSave.style.display = "inline-block";
        buttonAdd.style.display = "none";
    }
}
