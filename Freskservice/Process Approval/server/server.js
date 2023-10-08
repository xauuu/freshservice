const Handlebars = require("handlebars");
const FormData = require('form-data');

const fetch = require('./lib/fetch');
const utils = require('./lib/utils');

const SERVICE_REQUEST = "Service Request"

exports = {

  onTicketUpdateHandler: async function (args) {
    const ticket = args.data.ticket;
    const changes = args.data.ticket.changes;
    try {
      if (ticket.type_name !== SERVICE_REQUEST) return

      if (!(changes.approval_status && changes.approval_status.length > 0)) return;

      const requestedItems = await fetch.getRequestedItems(ticket.id)
      const serviceCategory = await fetch.getServiceCategory(requestedItems.service_item_id)
      if (!serviceCategory) return;

      console.log("START", ticket.id)
      const processLog = await fetch.getProcessLog(serviceCategory.app_code, serviceCategory.process_code, ticket.id)
      console.log("DEBUG: Process Data Log", processLog)

      const approvalRule = await fetch.getGroupApprovalRule(serviceCategory.app_code, serviceCategory.process_code, processLog.sr_state)
      console.log("DEBUG: Group Approval Rule", approvalRule)

      if (!approvalRule) return;
      if (changes.approval_status[0] == 0 && changes.approval_status[1] == 1) {
        if (Boolean(approvalRule.is_automator)) return
        await handleApproval(args, ticket, processLog, approvalRule, true)
      }
      if (changes.approval_status[0] == 0 && changes.approval_status[1] == 2) {
        await handleRejection(args, ticket, processLog, approvalRule)
      }
      console.log("END", ticket.id)
    } catch (error) {
      console.log(error)
      utils.sendMail(`${ticket.id} - Error Update Process Approval`, JSON.stringify(error), "qdatqb@gmail.com")
    }
  },
  onTicketCreateHandler: async function (args) {
    const ticket = args.data.ticket;
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

      await handleApproval(args, ticket, processLog, approvalRule, false)

      console.log("END", ticket.id)
    } catch (error) {
      console.log(error)
      utils.sendMail(`${ticket.id} - Error Create Process Approval`, JSON.stringify(error), "qdatqb@gmail.com")

    }
  }

};

async function handleApproval(args, ticket, processLog, approvalRule, isUpdated = false) {
  console.log("APPROVAL")
  let requesters = [];
  if (approvalRule.is_direct_line_report_approval) {
    const currentRequester = await fetch.getRequester(ticket.requester_id);
    const directRequester = await fetch.getRequester(currentRequester.reporting_manager_id);
    requesters = [directRequester];
  } else {
    requesters = await fetch.getRequesters(approvalRule.next_approval_group);
  }
  console.log('DEBUG: Group Approval', requesters)
  if (requesters && requesters.length > 0) {
    await Promise.all(requesters.map(async (item) => {
      fetch.requestApproval(ticket.id, item.id, approvalRule.approval_type, `${item.first_name} ${item.last_name}, please approve.`);
    }));
    if (isUpdated)
      sendEmailTemplate(approvalRule.approval_email_template_code, args.data, args.data.requester.email)
    sendEmailTemplate(approvalRule.email_template_code, args.data, requesters.map(r => r.primary_email).join(","))
    const approvals = await fetch.getTicketApprovals(ticket.id)
    const jsonApprovals = JSON.stringify(utils.formattedApprovals(approvals))
    const newVisible = processLog.sr_visible_to?.concat(';', requesters.map(r => r.id).join(";"))
    fetch.updateProcessLog(processLog.bo_display_id, approvalRule.new_state, jsonApprovals, newVisible);
  }
}

async function handleRejection(args, ticket, processLog, approvalRule) {
  console.log("REJECT")
  const requesters = await fetch.getRequesters(approvalRule.reject_next_approval_group);
  console.log('DEBUG: Group Approval', requesters)

  if (requesters && requesters.length > 0) {
    await Promise.all(requesters.map((item) => {
      fetch.requestApproval(ticket.id, item.id, approvalRule.approval_type, `${item.first_name} ${item.last_name}, please approve.`);
    }));
    sendEmailTemplate(approvalRule.reject_email_template_code, args.data, args.data.requester.email)
    const approvals = await fetch.getTicketApprovals(ticket.id)
    const jsonApprovals = JSON.stringify(utils.formattedApprovals(approvals))
    const newVisible = processLog.sr_visible_to?.concat(';', requesters.map(r => r.id).join(";"))
    fetch.updateProcessLog(processLog.bo_display_id, approvalRule.reject_new_state, jsonApprovals, newVisible);
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
