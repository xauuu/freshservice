const modal = document.getElementById("modal-detail");
const form = document.getElementById("form-tab");
const buttonSave = document.getElementById("form-tab-save");
const buttonClose = document.getElementById("form-tab-close");
const buttonAdd = document.getElementById("form-tab-add");
const buttonNew = document.getElementById("new-tab");

buttonClose.addEventListener("click", () => {
    modal.close();
    document.getElementById("fields").value = [];
    form.doReset();
});

buttonSave.addEventListener("click", async () => {
    const { values } = await form.doSubmit();
    const select = await document.getElementById("fields").getSelectedItem();
    const table = document.getElementById("data-table-tabs");
    await table.selectAllRows();
    const tableValues = await table.getSelectedRows();
    const indexToUpdate = tableValues.findIndex((item) => item.bo_display_id === values.bo_display_id);
    if (indexToUpdate !== -1) {
        tableValues[indexToUpdate] = { ...values, fields: deleteProperty(select) };
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
    const select = await document.getElementById("fields").getSelectedItem();
    const table = document.getElementById("data-table-tabs");
    await table.selectAllRows();
    const tableValues = await table.getSelectedRows();
    table.rows = [...tableValues, { ...values, fields: deleteProperty(select), id: new Date().getTime() }];
    form.doReset();
    modal.close();
});

function generateDataTable(values) {
    const datatable = document.getElementById("data-table-tabs");
    const columns = [
        {
            key: "tab_code",
            text: "Tab Code"
        },
        {
            key: "tab_name",
            text: "Tab Name"
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
                form.setFieldsValue(rowData);
                setTimeout(() => {
                    document.getElementById("fields").value = rowData.fields_id?.split(";");
                }, 1000);
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

function deleteProperty(objects) {
    return objects.map((item) => {
        delete item.allowDeselect;
        delete item.disabled;
        delete item.hideTick;
        delete item.variant;
        delete item.selected;
        delete item.checkbox;

        return item;
    });
}
