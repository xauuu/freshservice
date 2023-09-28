const fetch = require('./lib/fetch');
const utils = require('./lib/utils');

exports = {

  onTicketUpdateHandler: async function (args) {
    const ticket = args.data.ticket;
    const changes = args.data.ticket.changes;
    try {
      if (ticket.type_name !== "Service Request") return

      const requestedItems = await fetch.getRequestedItems(ticket.id)
      if (requestedItems.service_item_name !== args.iparams.service_item_name) return;

      if (!(changes.approval_status && changes.approval_status.length > 0)) return;

      console.log("START", ticket.id)
      const processLog = await fetch.getProcessLog(ticket.id)
      console.log("DEBUG: Process Data Log", processLog)

      const approvalRule = await fetch.getGroupApprovalRule(processLog.sr_state)
      console.log("DEBUG: Group Approval Rule", approvalRule)

      if (!approvalRule) return;

      if (changes.approval_status[0] < changes.approval_status[1]) {

        let requesters = [];
        if (approvalRule.is_direct_line_report_approval) {
          const currentRequester = await fetch.getRequester(ticket.requester_id);
          const directRequester = await fetch.getRequester(currentRequester.reporting_manager_id);
          requesters = [directRequester];
        } else {
          requesters = await fetch.getRequesters(approvalRule.next_approval_group.id);
        }
        console.log('DEBUG: Group Approval', requesters)
        if (requesters && requesters.length > 0) {
          await Promise.all(requesters.map(async (item) => {
            await fetch.requestApproval(ticket.id, item.id, approvalRule.approval_type, `${item.first_name} ${item.last_name}, please approve.`);
          }));
          // sendMailTemplate(approvalRule.email_template_code, replacements, requesters.map(r => r.primary_email).join(","))
          const approvals = await fetch.getTicketApprovals(ticket.id)
          const jsonApprovals = JSON.stringify(utils.formattedApprovals(approvals))
          const newVisible = processLog.sr_visible_to?.concat(';', requesters.map(r => r.id).join(";"))
          fetch.updateProcessLog(processLog.bo_display_id, approvalRule.new_state, jsonApprovals, newVisible);
        }

      }
      console.log("END", ticket.id)
    } catch (error) {
      console.log(error)
      utils.sendMail(`[${ticket.id}] - Error Update Support Order`, JSON.stringify(error), "qdatqb@gmail.com")

    }
  },
  onTicketCreateHandler: async function (args) {
    const ticket = args.data.ticket;
    try {
      if (ticket.type_name !== "Service Request") return

      const requestedItems = await fetch.getRequestedItems(ticket.id)
      if (requestedItems.service_item_name !== 'Support Order') return;

      console.log("START", ticket.id)
      const data = {
        "app_code": args.iparams.app_code,
        "process_code": args.iparams.process_code,
        "sr_requester_id": String(ticket.requester_id),
        "sr_id": "SR_" + ticket.id,
        "sr_display_id": String(ticket.id),
        "updated_date": utils.formatDate(new Date()),
        "created_date": utils.formatDate(new Date()),
        "sr_state": "0",
        "sr_title": ticket.subject
      }
      const processLog = await fetch.createProcessLog(data)
      console.log("DEBUG: Process Data Log", processLog)

      const approvalRule = await fetch.getGroupApprovalRule(processLog.sr_state)
      console.log("DEBUG: Group Approval Rule", approvalRule)

      if (!approvalRule) return;

      let requesters = [];
      if (approvalRule.is_direct_line_report_approval) {
        const currentRequester = await fetch.getRequester(ticket.requester_id);
        const directRequester = await fetch.getRequester(currentRequester.reporting_manager_id);
        requesters = [directRequester];
      } else {
        requesters = await fetch.getRequesters(approvalRule.next_approval_group.id);
      }
      console.log('DEBUG: Group Approval', requesters)
      if (requesters && requesters.length > 0) {
        await Promise.all(requesters.map(async (item) => {
          await fetch.requestApproval(ticket.id, item.id, approvalRule.approval_type, `${item.first_name} ${item.last_name}, please approve.`);
        }));
        // sendMailTemplate(approvalRule.email_template_code, replacements, requesters.map(r => r.primary_email).join(","))
        const approvals = await fetch.getTicketApprovals(ticket.id)
        const jsonApprovals = JSON.stringify(utils.formattedApprovals(approvals))
        const newVisible = processLog.sr_visible_to?.concat(';', requesters.map(r => r.id).join(";"))
        fetch.updateProcessLog(processLog.bo_display_id, approvalRule.new_state, jsonApprovals, newVisible);
      }

      console.log("END", ticket.id)
    } catch (error) {
      console.log(error)
      utils.sendMail(`[${ticket.id}] - Error Create Support Order`, JSON.stringify(error), "qdatqb@gmail.com")

    }
  }

};
