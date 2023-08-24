const nodemailer = require("nodemailer");
const moment = require('moment');

const transporter = nodemailer.createTransport({
  host: "email-smtp.ap-southeast-1.amazonaws.com",
  port: 587,
  secure: false,
  auth: {
    user: "AKIAR6X2FCDUCAUH5CF5",
    pass: "BB6+9lWVXwURGcp6qKmfNb7ZXvff8mef24zAXyFm+mB+"
  }
});

exports = {

  onTicketUpdateHandler: async function (args) {
    try {
      const ticket = args.data.ticket;
      const changes = args.data.ticket.changes;
      sendMail(`Ticket Updated - ${ticket.id}`, JSON.stringify(ticket), 'lethanhtrung2020@gmail.com')
      if (changes.approval_status && changes.approval_status.length > 0) {
        const { response: currentStateRes } = await $request.invokeTemplate("getCurrentState", {
          context: {
            ticket_id: ticket.id
          }
        });
        const currentState = JSON.parse(currentStateRes).records[0].data;
        console.log('DEBUG: currentState', currentState)
        if (changes.approval_status[0] < changes.approval_status[1]) {
          const { response: nextGroupRes } = await $request.invokeTemplate("getNextGroupApproval", {
            context: {
              state: currentState.sr_state || '',
              action: 'approve'
            }
          });
          const nextGroup = JSON.parse(nextGroupRes).records[0].data;
          console.log('DEBUG: TableLookup', nextGroup)

          if (nextGroup) {
            let requesters = [];

            if (nextGroup.is_direct_line_report_approval === 'yes') {
              const currentRequester = await getDirectRequester(ticket.requester_id);
              const directRequester = await getDirectRequester(currentRequester.reporting_manager_id);
              requesters = [directRequester];
            } else {
              requesters = await getRequesters(nextGroup.next_approval_group.id);
            }
            console.log('DEBUG: listRequester', requesters)
            if (requesters && requesters.length > 0) {
              await Promise.all(requesters.map(async (item) => {
                await requestApproval(ticket.id, item.id, nextGroup.approval_type, `${item.first_name} ${item.last_name}, please approve.`);
              }));
              const replacements = {
                ticket_id: ticket.id,
                display_id: currentState.sr_display_id,
                title: currentState.sr_title
              }
              sendMailTemplate(nextGroup.email_template_code, replacements, requesters.map(r => r.primary_email).join(","))
              const approvals = await getTicketApprovals(ticket.id)
              const jsonApprovals = JSON.stringify(formattedApprovals(approvals))
              await updateState(currentState.bo_display_id, nextGroup.new_state, jsonApprovals);
            }
          }
        }
        if (changes.approval_status[0] > changes.approval_status[1]) {
          const replacements = {
            ticket_id: ticket.id,
            display_id: currentState.sr_display_id,
            title: currentState.sr_title
          }
          sendMailTemplate("LEAVE_REQUEST_REJECT", replacements, args.data.requester.email)
          const approvals = await getTicketApprovals(ticket.id)
          const jsonApprovals = JSON.stringify(formattedApprovals(approvals))
          await updateState(currentState.bo_display_id, "0", jsonApprovals);
        }
      }
    } catch (error) {
      console.log(error);
      await sendMail('ERROR in TicketUpdateHandler', JSON.stringify(error), 'qdatqb@gmail.com')

    }
  },
  onTicketCreateHandler: async function (args) {
    try {
      const { ticket } = args.data;

      await sendMail(`Ticket Created - ${ticket.id}`, JSON.stringify(ticket), "lethanhtrung2020@gmail.com")
      const requestedItems = await getRequestedItems(ticket.id)
      if (ticket.type_name !== 'Service Request') return;
      const data = {
        "sr_app_code": "hr",
        "sr_process_code": "hr_leave",
        "sr_requester_id": String(ticket.requester_id),
        "sr_id": Number(ticket.id),
        "sr_display_id": "SR_" + ticket.id,
        "sr_updated_date": moment(new Date()).format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'),
        "sr_created_date": moment(new Date()).format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'),
        "sr_state": "0",
        "sr_title": requestedItems?.custom_fields.title
      }
      console.log(data)
      const { response: currentStateRes } = await $request.invokeTemplate("createState", {
        body: JSON.stringify({ data: data })
      });

      const currentState = JSON.parse(currentStateRes).custom_object.data;
      console.log('DEBUG: currentState', currentState)

      const { response: nextGroupRes } = await $request.invokeTemplate("getNextGroupApproval", {
        context: {
          state: '0',
          action: 'submit'
        }
      });

      const nextGroup = JSON.parse(nextGroupRes).records[0].data;
      console.log('DEBUG: TableLookup', nextGroup)

      let requesters = [];

      if (nextGroup.is_direct_line_report_approval === 'yes') {
        const currentRequester = await getDirectRequester(ticket.requester_id);
        const directRequester = await getDirectRequester(currentRequester.reporting_manager_id);
        requesters = [directRequester];
      } else {
        requesters = await getRequesters(nextGroup.next_approval_group.id);
      }
      console.log('DEBUG: listRequester', requesters)

      if (requesters && requesters.length > 0) {
        await Promise.all(requesters.map(async (item) => {
          await requestApproval(ticket.id, item.id, nextGroup.approval_type, `${item.first_name} ${item.last_name}, please approve.`);
        }));
        const replacements = {
          ticket_id: ticket.id,
          display_id: currentState.sr_display_id,
          title: currentState.sr_title
        }
        sendMailTemplate("LEAVE_REQUEST_SUBMIT", replacements, args.data.requester.email)
        sendMailTemplate(nextGroup.email_template_code, replacements, requesters.map(r => r.primary_email).join(","))
        const approvals = await getTicketApprovals(ticket.id)
        const jsonApprovals = JSON.stringify(formattedApprovals(approvals))
        await updateState(currentState.bo_display_id, nextGroup.new_state, jsonApprovals);
      }
    } catch (error) {
      console.log(error);
      await sendMail('ERROR in TicketCreateHandler', JSON.stringify(error), 'qdatqb@gmail.com')
    }
  }

};

async function sendMail(subject, html, to) {
  await transporter.sendMail({
    from: "Truvisor Freshservice <info@truebpm.vn>",
    to,
    subject,
    html
  });
}

async function sendMailTemplate(template_code, replacements, to) {
  const template = await getEmailTemplate(template_code)
  const body = replaceHtmlContent(template.body, replacements)
  const subject = replaceHtmlContent(template.subject, replacements)
  await transporter.sendMail({
    from: "Truvisor Freshservice <info@truebpm.vn>",
    to,
    subject,
    html: body
  });
}

async function getDirectRequester(requesterId) {
  const { response } = await $request.invokeTemplate("getARequester", {
    context: {
      requester_id: requesterId
    }
  });
  return JSON.parse(response).requester;
}

async function getRequesters(departmentId) {
  const { response } = await $request.invokeTemplate("getRequesters", {
    context: {
      department_id: departmentId
    }
  });
  return JSON.parse(response).requesters;
}

async function requestApproval(ticketId, approverId, approvalType, emailContent) {
  await $request.invokeTemplate("requestApproval", {
    context: {
      ticket_id: ticketId
    },
    body: JSON.stringify({
      approver_id: approverId,
      approval_type: approvalType,
      email_content: emailContent
    })
  });
}

async function updateState(id, newState, sr_json_approvals) {
  await $request.invokeTemplate("updateState", {
    context: {
      id
    },
    body: JSON.stringify({
      data: {
        "sr_state": newState,
        "sr_updated_date": moment(new Date()).format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'),
        "sr_json_approvals": sr_json_approvals
      }
    })
  });
}

async function getRequestedItems(ticketId) {
  const { response } = await $request.invokeTemplate("getRequestedItems", {
    context: {
      ticket_id: ticketId
    }
  });
  return JSON.parse(response).requested_items[0];
}

async function getTicketApprovals(ticketId) {
  const { response } = await $request.invokeTemplate("getTicketApprovals", {
    context: {
      ticket_id: ticketId
    }
  });
  return JSON.parse(response).approvals;
}

const formattedApprovals = (approvals) => {
  return approvals.map(approval => {
    let approvalStatus;
    if (approval.approval_status.id === 0) {
      approvalStatus = "Requested";
    } else if (approval.approval_status.id === 1) {
      approvalStatus = "Approved";
    } else if (approval.approval_status.id === 2) {
      approvalStatus = "Rejected";
    } else {
      approvalStatus = "Unknown";
    }

    return {
      approval: {
        approval_status: approval.approval_status.id,
        approvable_type: "Helpdesk::Ticket",
        remark: approval.latest_remark ? [[approval.approval_status.id, approval.latest_remark, Date.now()]] : [],
        created_at: approval.created_at,
        updated_at: approval.updated_at,
        level_id: approval.level,
        approval_type: approval.approval_type,
        requestedOn: approvalStatus + " on ",
        name: approval.approver_name,
        avatar_url: `https://trusisor.myfreshworks.com/api/v2/users/${approval.user_id}/image?variant=SMALL`
      }
    };
  });
};

function replaceHtmlContent(html, replacements) {
  let modifiedHtml = html;

  for (const key in replacements) {
    if (replacements.hasOwnProperty(key)) {
      const value = replacements[key];
      const regex = new RegExp(`{{${key}}}`, 'g');
      modifiedHtml = modifiedHtml.replace(regex, value);
    }
  }

  return modifiedHtml;
}

async function getEmailTemplate(email_code) {
  const { response } = await $request.invokeTemplate("getEmailTemplate", {
    context: {
      email_code
    }
  });
  return JSON.parse(response).records[0].data;
}