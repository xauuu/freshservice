window.frsh_init().then(function (client) {
    client.instance.context().then(
        async function (context) {
            console.log("Modal instance method context", context);
            const { requested, details } = context.data
            render(requested, details);
        }
    );
});
function render(requested, details) {
    document.getElementById("title").innerText = requested.custom_fields.title
    document.getElementById("description").innerText = requested.custom_fields.description
    document.getElementById("from_date").innerText = requested.custom_fields.from_date
    document.getElementById("to_date").innerText = requested.custom_fields.to_date
    document.getElementById("total_leave").innerText = Number(requested.custom_fields.total_leave)
    let html = ''
    details.slice(0).reverse().forEach((item) => {
        const data = item.data
        html += `
            <tr class="lt-row ember-view">
                <td class="lt-cell align-left ellipsis ember-view">
                    ${data.leave_date}
                </td>
                <td class="lt-cell align-left ellipsis ember-view">${data.is_half_day == 1 ? "Half day" : "Full day"}
                </td>
                <td class="lt-cell align-left ellipsis ember-view">${data.session}</td>
                <td class="lt-cell align-left ellipsis ember-view">${data.notes}</td>
            </tr>
        `
    })
    document.getElementById("leaveDetail").innerHTML = html
}

