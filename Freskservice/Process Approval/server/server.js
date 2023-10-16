const Handlebars = require("handlebars");

const fetch = require('./lib/fetch');
const utils = require('./lib/utils');

const SERVICE_REQUESTS = ["Service Request", "Request"]

exports = {

  onTicketUpdateHandler: async function (args) {
    const ticket = args.data.ticket;
    const changes = args.data.ticket.changes;
    try {
      if (!SERVICE_REQUESTS.includes(ticket.type_name) || !(changes.gf_int_01 && changes.gf_int_01.length > 0)) return;
      // utils.sendMail("SR Update", JSON.stringify(ticket), "qdatqb@gmail.com")

      const requestedItems = await fetch.getRequestedItems(ticket.id)
      console.log(requestedItems)
      const serviceCategory = await fetch.getServiceCategory(requestedItems.service_item_id)
      if (!serviceCategory) return;

      console.log("START", ticket.id)
      // const processLog = await fetch.getProcessLog(serviceCategory.app_code, serviceCategory.process_code, ticket.id)
      // console.log("DEBUG: Process Data Log", processLog)

      if (changes.gf_int_01[0] < changes.gf_int_01[1] || changes.gf_int_01[1] == 0) {
        const approvalRule = await fetch.getGroupApprovalRule(serviceCategory.app_code, serviceCategory.process_code, changes.gf_int_01[1])
        console.log("DEBUG-APPROVAL: Group Approval Rule", approvalRule)
        if (!approvalRule) return
        await handleApproval(args, ticket, approvalRule, true, requestedItems)
      }
      if (changes.gf_int_01[0] > changes.gf_int_01[1]) {
        const approvalRule = await fetch.getGroupApprovalRule(serviceCategory.app_code, serviceCategory.process_code, changes.gf_int_01[0])
        console.log("DEBUG-REJECT: Group Approval Rule", approvalRule)
        if (!approvalRule) return
        await handleRejection(args, ticket, approvalRule)
      }
      console.log("END", ticket.id)
    } catch (error) {
      console.log(error)
      utils.sendMail(`${ticket.id} - Error Update Process Approval`, JSON.stringify(error), "qdatqb@gmail.com")
    }
  },
  onTicketCreateHandler: async function (args) {
    const ticket = args.data.ticket;
    console.log(ticket.id)
    /*
    try {
      if (ticket.type_name !== SERVICE_REQUEST) return

      const requestedItems = await fetch.getRequestedItems(ticket.id)
      const serviceCategory = await fetch.getServiceCategory(requestedItems.service_item_id)
      console.log(serviceCategory)
      if (!serviceCategory) return;

      console.log("START", ticket.id)
      const data = {
        "app_code": serviceCategory.app_code,
        "process_code": serviceCategory.process_code,
        "sr_requester_id": String(ticket.requester_id),
        "sr_id": "SR_" + ticket.id,
        "sr_display_id": String(ticket.id),
        "updated_date": utils.formatDate(new Date()),
        "created_date": utils.formatDate(new Date()),
        "sr_state": "0",
        "sr_title": ticket.subject,
        "sr_visible_to": String(ticket.requester_id)
      }
      const processLog = await fetch.createProcessLog(data)
      console.log("DEBUG: Process Data Log", processLog)

      const approvalRule = await fetch.getGroupApprovalRule(serviceCategory.app_code, serviceCategory.process_code, processLog.sr_state)
      console.log("DEBUG: Group Approval Rule", approvalRule)

      if (!approvalRule || Boolean(approvalRule.is_automator)) return;

      await handleApproval(args, ticket, processLog, approvalRule, false, requestedItems)

      console.log("END", ticket.id)
    } catch (error) {
      console.log(error)
      utils.sendMail(`${ticket.id} - Error Create Process Approval`, JSON.stringify(error), "qdatqb@gmail.com")

    }
    */
  }

};

async function handleApproval(args, ticket, approvalRule, isUpdated = false, requestedItems) {
  console.log("APPROVAL")
  let requesters = [];
  let approver = ""
  if (approvalRule.approver == 1) {
    //reporting manager
    const currentRequester = await fetch.getRequester(ticket.requester_id);
    const directRequester = await fetch.getRequester(currentRequester.reporting_manager_id);
    requesters = [directRequester];
    approver = `Reporting Manager: ${directRequester?.first_name} ${directRequester?.last_name}`
  } else if (approvalRule.approver == 2) {
    //department head
    const department = await fetch.getDepartment(ticket.department_id)
    if (department.head_user_id) {
      const requester = await fetch.getRequester(department.head_user_id);
      requesters = [requester]
      approver = `Head of ${ticket.department_name} Department: ${requester?.first_name} ${requester?.last_name}`
    }
  } else if (approvalRule.approver == 3) {
    //selected department
    if (requestedItems.custom_fields.hasOwnProperty('department') && !!requestedItems.custom_fields.department) {
      const department = await fetch.getDepartment(requestedItems.custom_fields.department)
      if (department.head_user_id) {
        fetch.updateRequestedItem(ticket.id, requestedItems.id, {
          "custom_fields": {
            "department_head": department.head_user_id
          }
        })
        const requester = await fetch.getRequester(department?.head_user_id);
        requesters = [requester]
        approver = `Head of ${department?.name} Department: ${requester?.first_name} ${requester?.last_name}`
      }
    }
  } else if (approvalRule.approver == 4) {
    //group
    const [list, detail] = await Promise.all([fetch.getRequesters(approvalRule.next_approval_group), fetch.getRequesterGroup(approvalRule.next_approval_group)]);
    requesters = list
    approver = `Group ${detail.name}`
  }
  console.log('DEBUG: Group Approval', requesters)
  fetch.updateTicket(ticket.id, {
    "custom_fields": {
      "ticket_status": approvalRule.name,
      "pending_approver": `Pending ${approver}`,
    }
  })
  if (requesters && requesters.length > 0) {
    await Promise.all(requesters.map(async (item) => {
      await fetch.requestApproval(ticket.id, item.id, approvalRule.approval_type, `${item.first_name} ${item.last_name}, please approve.`);
    })).then(async function () {
      console.log('All requests were successful');
      if (isUpdated)
        sendEmailTemplate(approvalRule.approval_email_template_code, args.data, args.data.requester.email)
      sendEmailTemplate(approvalRule.email_template_code, args.data, requesters.map(r => r.primary_email).join(","))
    }).catch(function (err) {
      console.error('An error occurred:', err);
    });
    // const approvals = await fetch.getTicketApprovals(ticket.id)
    // const jsonApprovals = JSON.stringify(utils.formattedApprovals(approvals))
    // const newVisible = processLog.sr_visible_to?.concat(';', requesters.map(r => r.id).join(";"))
    // fetch.updateProcessLog(processLog.bo_display_id, approvalRule.new_state, jsonApprovals, newVisible);
  }
}

async function handleRejection(args, ticket, approvalRule) {
  console.log("REJECT")
  const requesters = await fetch.getRequesters(approvalRule.reject_next_approval_group);
  console.log('DEBUG: Group Approval', requesters)

  if (requesters && requesters.length > 0) {
    await Promise.all(requesters.map((item) => {
      fetch.requestApproval(ticket.id, item.id, approvalRule.approval_type, `${item.first_name} ${item.last_name}, please approve.`);
    }));
    sendEmailTemplate(approvalRule.reject_email_template_code, args.data, args.data.requester.email)
    // const approvals = await fetch.getTicketApprovals(ticket.id)
    // const jsonApprovals = JSON.stringify(utils.formattedApprovals(approvals))
    // const newVisible = processLog.sr_visible_to?.concat(';', requesters.map(r => r.id).join(";"))
    // fetch.updateProcessLog(processLog.bo_display_id, approvalRule.reject_new_state, jsonApprovals, newVisible);
  }
}

async function sendEmailTemplate(template_code, data, to_list) {
  if (!template_code) return
  const emailTemplate = await fetch.getEmailTemplate(template_code)
  if (!emailTemplate) return
  const templateBody = Handlebars.compile(emailTemplate.body);
  const templateSubject = Handlebars.compile(emailTemplate.subject);
  const body = templateBody(data);
  const subject = templateSubject(data)
  utils.sendMail(subject, body, to_list)
}
