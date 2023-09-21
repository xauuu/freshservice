window.frsh_init().then(function (client) {
    client.instance.context().then(
        async function (context) {
            const { requested, details, logs } = context.data
            render(requested, details);
            renderLogs(logs)
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

function renderLogs(data) {
    const logs = JSON.parse(data.sr_json_approvals)
    console.log(logs)
    let html = ''
    logs.slice(0).reverse().forEach((item) => {
        const data = item.approval
        html += `
                <li class="mb-10 ml-4">
                    <div class="absolute w-3 h-3 bg-gray-300 rounded-full mt-1.5 -left-1.5 border border-white"></div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${data.name}</h3>
                    <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">${data.requestedOn} ${formatLocalDateFromUTC(data.updated_at)}</time>
                    <p class="mb-4 text-base font-normal text-gray-500 dark:text-gray-400">${getRemarkText(data.remark)}</p>
                </li>
        `
    })
    document.getElementById("logs").innerHTML = html
}


function getRemarkText(remark) {
    if (Array.isArray(remark) && remark.length > 0) {
        return remark[0][1];
    } else {
        return '';
    }
}

function formatLocalDateFromUTC(inputDateString) {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const utcDate = new Date(inputDateString);

    // Lấy múi giờ cục bộ của client
    const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const localDate = new Date(utcDate.toLocaleString('en-US', { timeZone: clientTimezone }));

    // Định dạng lại thời gian theo yêu cầu
    const outputFormat = `${dayNames[localDate.getUTCDay()]}, ${localDate.getUTCDate()} ${monthNames[localDate.getUTCMonth()]} ${localDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;

    return outputFormat;
}