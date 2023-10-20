// approvalStatuses = {{toJSON APPROVALS_STATUSES}}
$(document).ready(function () {
  jQuery.ajax({
    type: "GET",
    url: "https://trusisor.freshservice.com/api/v2/objects/27000052152/records?query=sr_id%20%3A%20%27{{last (split ticket.human_display_id " - ")}}%27",
    dataType: "json",
    headers: {
      Authorization: "Basic " + btoa("QEDIV2kU52hisyqESo1N" + ":x")
    },
    success: function (response) {
      const data = response.records[0].data.sr_json_approvals;
      const json = JSON.parse(data);
      renderApproval(json);
    },
    error: function (error) {
      console.log(error);
    }
  });
});

function renderApproval(approvals) {
  const reversedApprovals = approvals.slice().reverse();
  const container = document.getElementById("sr-item-approval-details");

  const firstApproval = reversedApprovals[0];
  const status = approvalStatuses[firstApproval.approval.approval_status.toString()];

  const approverDiv = document.createElement("div");
  approverDiv.classList.add("item-approval-details");

  const heading = document.createElement("h4");
  heading.classList.add("heading");

  heading.innerHTML = `
                        <span>Chấp thuận</span>
                        <span class="approvers-count">${approvals.length}</span>
                        <label class="status ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</label>
                    `;

  approverDiv.appendChild(heading);

  reversedApprovals.forEach((approval) => {
    const { avatar_url, name, remark, requestedOn, approval_status, updated_at } = approval.approval;
    const status = approvalStatuses[approval_status.toString()];
    const item = document.createElement("div");
    item.classList.add(`approver-${status}`);

    item.innerHTML = `
                                    <div class="approver">
                                        <div class="avatar-image">
                                            <div class="user-profile-holder small">
                                                <img class="user-profile-pic" src="${avatar_url}" onerror="fsImageHandler(this, true, 'small')" role="presentation">
                                            </div>
                                        </div>
                                        <div>
                                            <strong class="name">${name}</strong>
                                            <p class="requested-on">${requestedOn} ${formatDateString(updated_at)}</p>
                                        </div>
                                    </div>
                                    ${getRemark(remark, status)}
                            `;

    approverDiv.appendChild(item);
  });
  container.innerHTML = "";
  container.appendChild(approverDiv);
}

function getRemark(remark, status) {
  if (remark && remark.length > 0) {
    return `<p class="remark ${status}"><span class="short">${remark[0][1]}</span></p>`;
  }
  return "";
}
function formatDateString(dateString) {
  const options = { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "numeric", hour12: false };
  const dateObject = new Date(dateString);

  return dateObject.toLocaleString("vi-VN", options);
}
