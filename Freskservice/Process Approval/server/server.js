const Handlebars = require("handlebars");

const fetch = require("./lib/fetch");
const utils = require("./lib/utils");

const SERVICE_REQUESTS = ["Service Request", "Request"];

exports = {
    onTicketUpdateHandler: async function (args) {
        const ticket = args.data.ticket;
        const changes = args.data.ticket.changes;
        try {
            if (!SERVICE_REQUESTS.includes(ticket.type_name) || !(changes.gf_int_01 && changes.gf_int_01.length > 0)) return;
            // utils.sendMail("SR Update", JSON.stringify(ticket), "qdatqb@gmail.com")

            const requestedItems = await fetch.getRequestedItems(ticket.id);
            console.log(requestedItems);
            const serviceCategory = await fetch.getServiceCategory(requestedItems.service_item_id);
            if (!serviceCategory) return;

            console.log("START", ticket.id);
            // const processLog = await fetch.getProcessLog(serviceCategory.app_code, serviceCategory.process_code, ticket.id)
            // console.log("DEBUG: Process Data Log", processLog)

            if (changes.gf_int_01[0] < changes.gf_int_01[1] || changes.gf_int_01[1] == 0) {
                const approvalRule = await fetch.getGroupApprovalRule(serviceCategory.app_code, serviceCategory.process_code, changes.gf_int_01[1]);
                console.log("DEBUG-APPROVAL: Group Approval Rule", approvalRule);
                if (!approvalRule) return;
                await handleApproval(args, ticket, approvalRule, true, requestedItems);
            }
            if (changes.gf_int_01[0] > changes.gf_int_01[1]) {
                const approvalRule = await fetch.getGroupApprovalRule(serviceCategory.app_code, serviceCategory.process_code, changes.gf_int_01[0]);
                console.log("DEBUG-REJECT: Group Approval Rule", approvalRule);
                // if (!approvalRule) return;
                // await handleRejection(args, ticket, approvalRule);
            }
            console.log("END", ticket.id);
        } catch (error) {
            console.log(error);
            utils.sendMail(`${ticket.id} - Error Update Process Approval`, JSON.stringify(error), "qdatqb@gmail.com");
        }
    },
    onTicketCreateHandler: async function (args) {
        const ticket = args.data.ticket;
        console.log(ticket.id);
    }
};

async function handleApproval(args, ticket, approvalRule, isUpdated = false, requestedItems) {
    console.log("APPROVAL", isUpdated);
    const placeholder = { ticket, requested_item: requestedItems, requester: args.data.requester };
    console.log(placeholder);
    let requesters = [];
    let approver = "";
    if (approvalRule.approver == 1) {
        //reporting manager
        const currentRequester = await fetch.getRequester(ticket.requester_id);
        const directRequester = await fetch.getRequester(currentRequester.reporting_manager_id);
        requesters = [directRequester];
        approver = `Reporting Manager: ${directRequester?.first_name} ${directRequester?.last_name}`;
    } else if (approvalRule.approver == 2) {
        //department head
        const department = await fetch.getDepartment(ticket.department_id);
        if (department.head_user_id) {
            const requester = await fetch.getRequester(department.head_user_id);
            requesters = [requester];
            approver = `Head of ${department?.name} Department (${requester?.first_name} ${requester?.last_name})`;
        }
    } else if (approvalRule.approver == 3) {
        //selected department
        if (requestedItems.custom_fields.hasOwnProperty("department") && !!requestedItems.custom_fields.department) {
            const department = await fetch.getDepartment(requestedItems.custom_fields.department);
            if (department.head_user_id) {
                fetch.updateRequestedItem(ticket.id, requestedItems.id, {
                    custom_fields: {
                        department_head: department.head_user_id
                    }
                });
                const requester = await fetch.getRequester(department?.head_user_id);
                requesters = [requester];
                approver = `Head of ${department?.name} Department (${requester?.first_name} ${requester?.last_name})`;
            }
        }
    } else if (approvalRule.approver == 4) {
        //group
        const [list, detail, agent] = await Promise.all([
            fetch.getRequesters(approvalRule.next_approval_group),
            fetch.getRequesterGroup(approvalRule.next_approval_group),
            fetch.getAgentGroup(approvalRule.next_agent_group_approval)
        ]);
        requesters = list;
        approver = `Requester Group ${detail.name}`;
        if (agent && agent?.members?.length > 0) {
            const agentList = agent.members.map((item) => ({ id: item }));
            requesters = [...requesters, ...agentList];
            approver += ` & Agent Group ${agent.name}`;
        }
    }
    console.log("DEBUG: Group Approval", requesters);

    if (requesters && requesters.length > 0) {
        if (Boolean(approvalRule.is_not_send_approval)) {
            console.log("Is only send email");
            sendEmailTemplate(approvalRule.email_template_code, placeholder, args.data.requester.email);
            sendEmailTemplate(
                approvalRule.approval_email_template_code,
                placeholder,
                requesters
                    .map((r) => {
                        return r.primary_email || r.email;
                    })
                    .join(",")
            );
            return;
        }
        await Promise.all(
            requesters.map(async (item) => {
                const body = await getBody(approvalRule.email_template_code, placeholder);
                await fetch.requestApproval(ticket.id, item.id, approvalRule.approval_type, body);
            })
        )
            .then(function () {
                console.log("All requests were successful");
                fetch.createApprovalLog({
                    data: {
                        action_by: "System",
                        action_date: new Date().toISOString(),
                        comment: `Send request approval to ${approver}`,
                        process: "Request Approval",
                        ticket_number: Number(ticket.id),
                        ticket_id: `${getType(ticket.type_name)}-${ticket.id}`
                    }
                });
                fetch.updateTicket(ticket.id, {
                    custom_fields: {
                        ticket_status: approvalRule.name,
                        pending_approver: `Pending ${approver}`
                    }
                });
                // sendEmailTemplate(approvalRule.email_template_code, placeholder, args.data.requester.email);
                // sendEmailTemplate(
                //     approvalRule.approval_email_template_code,
                //     placeholder,
                //     requesters
                //         .map((r) => {
                //             return r.primary_email || r.email;
                //         })
                //         .join(",")
                // );
            })
            .catch(function (err) {
                console.error("An error occurred:", err);
            });
    }
}

async function handleRejection(args, ticket, approvalRule) {
    console.log("REJECT");
    const requesters = await fetch.getRequesters(approvalRule.reject_next_approval_group);
    console.log("DEBUG: Group Approval", requesters);

    if (requesters && requesters.length > 0) {
        await Promise.all(
            requesters.map((item) => {
                fetch.requestApproval(ticket.id, item.id, approvalRule.approval_type, `${item.first_name} ${item.last_name}, please approve.`);
            })
        );
        sendEmailTemplate(approvalRule.reject_email_template_code, args.data, args.data.requester.email);
        // const approvals = await fetch.getTicketApprovals(ticket.id)
        // const jsonApprovals = JSON.stringify(utils.formattedApprovals(approvals))
        // const newVisible = processLog.sr_visible_to?.concat(';', requesters.map(r => r.id).join(";"))
        // fetch.updateProcessLog(processLog.bo_display_id, approvalRule.reject_new_state, jsonApprovals, newVisible);
    }
}

async function sendEmailTemplate(template_code, data, to_list) {
    try {
        if (!template_code) return;
        const emailTemplate = await fetch.getEmailTemplate(template_code);
        if (!emailTemplate) return;
        const templateBody = Handlebars.compile(emailTemplate.body);
        const templateSubject = Handlebars.compile(emailTemplate.subject);
        const body = templateBody(data);
        const subject = templateSubject(data);
        utils.sendMail(subject, body, to_list);
    } catch (error) {
        console.log("Error Send email template", error);
    }
}

async function getBody(template_code, data) {
    try {
        if (!template_code) return;
        const emailTemplate = await fetch.getEmailTemplate(template_code);
        if (!emailTemplate) return "Please Approval";
        const templateBody = Handlebars.compile(emailTemplate.body);
        const body = templateBody(data);
        return body;
    } catch (error) {
        console.log("Error Send email template", error);
    }
}

function getType(type) {
    switch (type) {
        case "Request":
            return "REQ";
        case "Service Request":
            return "SR";
        default:
            return "Ticket";
    }
}
