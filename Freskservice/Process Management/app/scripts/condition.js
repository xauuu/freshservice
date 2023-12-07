const modal = document.getElementById("modal-detail");
const form = document.getElementById("form-condition");
const buttonSave = document.getElementById("form-condition-save");
const buttonClose = document.getElementById("form-condition-close");
const buttonNew = document.getElementById("new-condition");
const buttonAdd = document.getElementById("form-condition-add");

buttonClose.addEventListener("click", () => {
    modal.close();
});

buttonSave.addEventListener("click", async () => {
    const { values } = await form.doSubmit();
    const table = document.getElementById("data-table-values");
    await table.selectAllRows();
    const tableValues = await table.getSelectedRows();
    const indexToUpdate = tableValues.findIndex((item) => item.id === values.id);
    if (indexToUpdate !== -1) {
        tableValues[indexToUpdate] = values;
    }
    table.rows = tableValues;
    form.doReset();
    modal.close();
});

buttonNew.addEventListener("click", () => {
    toggleButton(true);
    modal.open();
    form.setFieldValue("condition_detail_field", document.getElementById("condition_field").value);
});

buttonAdd.addEventListener("click", async () => {
    const { values } = await form.doSubmit();
    const table = document.getElementById("data-table-values");
    await table.selectAllRows();
    const tableValues = await table.getSelectedRows();
    table.rows = [...tableValues, { ...values, id: new Date().getTime() }];
    form.doReset();
    modal.close();
});

function generateDataTable(values, newStates) {
    const datatable = document.getElementById("data-table-values");
    const columns = [
        {
            key: "operator",
            text: "Operator"
        },
        {
            key: "value",
            text: "Value"
        },
        {
            key: "state",
            text: "State",
            formatData: (state) => {
                return newStates.find((item) => item.data.state == state)?.data.state_name || state;
            }
        }
    ];
    datatable.columns = columns;
    try {
        var rows = JSON.parse(values);
    } catch (error) {
        rows = [];
    }
    datatable.rows = rows || [];
    datatable.rowActions = [
        {
            name: "Edit",
            handler: (rowData) => {
                toggleButton(false);
                modal.open();
                form.setFieldsValue(rowData);
                form.setFieldValue("condition_detail_field", document.getElementById("condition_field").value);
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
