let departments = [];
let requesters = [];
let requester_groups = [];
let agent_groups = [];
let workspaces = [];
let chart;

var iconDataSource = [
    {
        value: "chart",
        text: "Chart View"
    },
    {
        value: "tree",
        text: "Tree View"
    }
];

const departmentSelect = document.getElementById("departments");
const menu = document.getElementById("icon-kebab-menu");
const wsSelect = document.getElementById("workspace");
const chartContainer = $("#chart-container");
const treeContainer = $("#tree");

document.onreadystatechange = function () {
    if (document.readyState === "interactive") renderApp();

    function renderApp() {
        let onInit = app.initialized();
        onInit
            .then(function getClient(_client) {
                window.client = _client;
                client.events.on("app.activated", onActivated);
                onEventHandled();
                onReceived();
            })
            .catch(handleErr);
    }
};

async function onActivated() {
    await Promise.all([getDepartments(), getRequesters(), getAgentGroup(), getRequesterGroup(), getWorkspaces()]);
    generateDeptSelect(departments);
    generateWorkspaceSelect();
    menu.options = iconDataSource;
    generateDatatableRequester();
    generateDatatableAgent();
}

function onEventHandled() {
    document.getElementById("new-department").addEventListener("click", () => {
        client.interface.trigger("showModal", {
            title: "New Department",
            template: "modal/new-department.html",
            data: { requesters, departments, requester_groups }
        });
    });

    document.getElementById("new-requester-group").addEventListener("click", () => {
        window.open(`https://trusisor.freshservice.com/admin/requester_groups/new`, "_blank").focus();
    });
    document.getElementById("new-agent-group").addEventListener("click", () => {
        window.open(`https://trusisor.freshservice.com/ws/2/admin/agent_groups/new`, "_blank").focus();
    });

    menu.addEventListener("fwSelect", (e) => {
        const view = e.detail.value;
        if (view == "chart") {
            chartContainer.css("display", "block");
            treeContainer.css("display", "none");
        }
        if (view == "tree") {
            treeContainer.css("display", "block");
            chartContainer.css("display", "none");
        }
    });

    wsSelect.addEventListener("fwChange", (e) => {
        generateDatatableAgent(e.detail.value);
    });
}

function onReceived() {
    client.instance.receive(async (e) => {
        const { type, data, id } = e.helper.getData();
        switch (type) {
            case "CREATE_DEPARTMENT":
                await handleCreateDepartment(data);
                break;
            case "UPDATE_DEPARTMENT":
                await handleUpdateDepartment(id, data);
                break;
        }
    });
}

function generateDeptSelect(departments) {
    const rootDepartments = departments.filter((item) => item.custom_fields.is_root && !item.custom_fields.parent_department_id);
    departmentSelect.options = rootDepartments;
    departmentSelect.addEventListener("fwChange", (e) => {
        const root = e.detail.meta.selectedOptions[0];
        const list = departments.filter((item) => item.custom_fields.parent_department_id == e.detail.value);
        renderOrgChart(root, list);
        renderTreeView(root, list);
    });
}

function renderOrgChart(root, list) {
    chart?.$chartContainer.off("click");
    const dataSource = { ...root, children: getDeptOrgChart(list) };

    if (chart) chart.init({ data: dataSource });
    else
        chart = chartContainer.orgchart({
            data: dataSource,
            nodeContent: "description",
            collapsed: true,
            pan: true,
            zoom: true,
            initCompleted: function () {
                var $container = $("#chart-container");
                $container.scrollLeft(($container[0].scrollWidth - $container.width()) / 2);
            }
        });

    var modalOpen = false;
    chart.$chartContainer.on("click", ".node", async function () {
        var $this = $(this);

        nodeClickHandled($this.attr("id"), modalOpen);
    });
}

function renderTreeView(root, list) {
    const dataTree = [{ ...root, text: root.name, nodes: getDeptTreeView(list) }];

    treeContainer.treeview({
        data: dataTree,
        levels: 2,
        onNodeSelected: function (event, node) {
            var modalOpen = false;
            nodeClickHandled(node.id, modalOpen);
        }
    });
}

async function nodeClickHandled(id, modalOpen) {
    if (modalOpen) {
        return;
    }
    try {
        modalOpen = true;
        const department = await getDepartment(id);
        client.interface.trigger("showModal", {
            title: department.name,
            template: "modal/department.html",
            data: { department, departments, requesters, requester_groups }
        });
    } finally {
        modalOpen = false;
    }
}

function getDeptOrgChart(list) {
    const result = [];
    list = list?.map((item) => {
        const children = departments.filter((dept) => dept.custom_fields.parent_department_id == item.id);
        return {
            ...item,
            children: getDeptOrgChart(children)
        };
    });
    result.push(...list);
    return result;
}

function getDeptTreeView(list) {
    const result = [];
    list = list?.map((item) => {
        const children = departments.filter((dept) => dept.custom_fields.parent_department_id == item.id);
        if (children.length > 0) var nodes = { nodes: getDeptTreeView(children) };
        return {
            ...item,
            text: item.name,
            ...nodes
        };
    });
    result.push(...list);
    return result;
}

async function getDepartments() {
    departments = [];
    try {
        await Promise.all(
            Array.from({ length: 5 }).map(async (_, index) => {
                const res = await client.request.invokeTemplate("getDepartments", {
                    context: { page: index + 1 }
                });
                const data = JSON.parse(res.response).departments;
                if (data.length == 0) return;
                departments.push(...data);
            })
        );
    } catch (error) {
        console.log(error);
    }
}

async function getDepartment(id) {
    try {
        const res = await client.request.invokeTemplate("getDepartment", { context: { id } });
        const data = JSON.parse(res.response);
        return data.department;
    } catch (error) {
        console.log(error);
    }
}

async function getRequesters() {
    try {
        await Promise.all(
            Array.from({ length: 5 }).map(async (_, index) => {
                const res = await client.request.invokeTemplate("getRequesters", {
                    context: { page: index + 1 }
                });
                const data = JSON.parse(res.response).requesters;
                if (data.length == 0) return;
                requesters.push(...data);
            })
        );
    } catch (error) {
        console.log(error);
    }
}

async function getRequester(id) {
    try {
        const res = await client.request.invokeTemplate("getRequester", { context: { id } });
        const data = JSON.parse(res.response);
        return data.requester;
    } catch (error) {
        console.log(error);
    }
}

async function handleCreateDepartment(data) {
    try {
        await client.request.invokeTemplate("createDepartment", {
            body: JSON.stringify(data)
        });
        handleSuccess("CREATE_DEPARTMENT", "Successfully created department");
    } catch (error) {
        handleErr(error);
    }
}

async function handleUpdateDepartment(id, data) {
    try {
        await client.request.invokeTemplate("updateDepartment", {
            context: { id },
            body: JSON.stringify(data)
        });
        handleSuccess("UPDATE_DEPARTMENT", "Successfully updated department");
    } catch (error) {
        handleErr(error);
    }
}

async function getRequesterGroup() {
    try {
        await Promise.all(
            Array.from({ length: 5 }).map(async (_, index) => {
                const res = await client.request.invokeTemplate("getRequesterGroup", {
                    context: { page: index + 1 }
                });
                const data = JSON.parse(res.response).requester_groups;
                if (data.length == 0) return;
                requester_groups.push(...data);
            })
        );
    } catch (error) {
        console.log(error);
    }
}

async function getAgentGroup() {
    try {
        await Promise.all(
            Array.from({ length: 5 }).map(async (_, index) => {
                const res = await client.request.invokeTemplate("getAgentGroup", {
                    context: { page: index + 1 }
                });
                const data = JSON.parse(res.response).groups;
                if (data.length == 0) return;
                agent_groups.push(...data);
            })
        );
    } catch (error) {
        console.log(error);
    }
}

function displayDataOnPage(lits, page, perPage) {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const currentPageData = lits.slice(startIndex, endIndex);
    return currentPageData;
}

function generateDatatableRequester() {
    const columns = [
        {
            key: "name",
            text: "Name"
        },
        {
            key: "description",
            text: "Description",
            widthProperties: {
                width: "800px"
            }
        }
    ];

    const rowActions = [
        {
            name: "Edit",
            handler: (rowData) => {
                window.open(`https://trusisor.freshservice.com/admin/requester_groups/${rowData.id}/edit`, "_blank").focus();
            },
            graphicsProps: { name: "edit" }
        }
    ];

    var datatable = document.getElementById("datatable-requester");
    var pagination = document.getElementById("pagination-requester");
    datatable.columns = columns;
    pagination.total = requester_groups.length;
    pagination.page = 1;
    pagination.perPage = 10;
    datatable.rows = displayDataOnPage(requester_groups, 1, 10);
    datatable.rowActions = rowActions;
    pagination.addEventListener("fwChange", function (e) {
        datatable.rows = displayDataOnPage(requester_groups, e.detail.page, 10);
    });
}

function generateDatatableAgent(ws_id = "") {
    const columns = [
        {
            key: "name",
            text: "Name"
        },
        {
            key: "description",
            text: "Description",
            widthProperties: {
                width: "800px"
            }
        }
    ];
    const rowActions = [
        {
            name: "Edit",
            handler: (rowData) => {
                window.open(`https://trusisor.freshservice.com/ws/${rowData.workspace_id}/admin/agent_groups/${rowData.id}/edit`, "_blank").focus();
            },
            graphicsProps: { name: "edit" }
        }
    ];
    const rows = getAgentList(ws_id);
    var datatable = document.getElementById("datatable-agent");
    var pagination = document.getElementById("pagination-agent");
    datatable.columns = columns;
    pagination.total = rows.length;
    pagination.page = 1;
    pagination.perPage = 10;
    datatable.rows = displayDataOnPage(rows, 1, 10);
    datatable.rowActions = rowActions;
    pagination.addEventListener("fwChange", function (e) {
        datatable.rows = displayDataOnPage(rows, e.detail.page, 10);
    });
}

function getAgentList(ws_id = "") {
    let list = agent_groups;
    if (ws_id) list = agent_groups.filter((item) => item.workspace_id == ws_id);
    if (ws_id == "all") list = agent_groups;
    return list;
}

async function getWorkspaces() {
    try {
        const res = await client.request.invokeTemplate("getWorkspaces", {});
        const data = JSON.parse(res.response).records;
        workspaces = data;
    } catch (error) {
        console.log(error);
    }
}

function generateWorkspaceSelect() {
    const options = workspaces.map((item) => {
        return {
            value: item.data.workspace_id,
            text: item.data.name
        };
    });
    wsSelect.options = [{ text: "All Workspace", value: "all" }, ...options];
}

async function handleSuccess(type, message) {
    showNotification("success", message);
    client.instance.send({ message: { close_modal: true } });
    await getDepartments();
    const selectedItem = await document.getElementById("departments").getSelectedItem();
    if (selectedItem && selectedItem.length > 0) {
        const root = selectedItem[0];
        const list = departments.filter((item) => item.custom_fields.parent_department_id == root?.id);
        renderOrgChart(root, list);
    }
}

function showNotification(type, message) {
    client.interface.trigger("showNotify", {
        type: type,
        message: message
    });
}

function handleErr(error) {
    console.log(error);
}
