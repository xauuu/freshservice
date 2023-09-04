window.frsh_init().then(function (client) {
    client.instance.context().then(
        async function (context) {
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
            <tr class="bg-white border-b dark:bg-gray-800 hover:bg-gray-50">
                <th scope="row" class="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">
                    ${data.leave_date}
                </th>
                <td class="px-4 py-2">
                    ${data.is_half_day == 1 ? "Half day" : "Full day"}
                </td>
                <td class="px-4 py-2">
                    ${data.session}
                </td>
                <td class="px-4 py-2">
                    ${data.notes}
                </td>
            </tr>
        `
    })
    document.getElementById("leaveDetail").innerHTML = html
}

