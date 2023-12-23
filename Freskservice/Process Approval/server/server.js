const Handlebars = require("handlebars");
const FormData = require("form-data");

const fetch = require("./lib/fetch");
const utils = require("./lib/utils");

const SERVICE_REQUESTS = ["Service Request", "Request"];

exports = {
    onTicketUpdateHandler: async function (args) {
        const ticket = args.data.ticket;
        const changes = args.data.ticket.changes;
        if (args.iparams.is_send_email) utils.sendMail(`${ticket.id} - Ticket Update`, JSON.stringify(args), "qdatqb@gmail.com");
        try {
            if (!SERVICE_REQUESTS.includes(ticket.type_name) || !(changes.gf_int_01 && changes.gf_int_01.length > 0)) return;

            const requestedItems = await fetch.getRequestedItems(ticket.id);
            const serviceCategory = await fetch.getServiceCategory(requestedItems.service_item_id);
            // console.log(serviceCategory);
            if (!serviceCategory) return;
            console.log("START", ticket.id);
            if (changes.gf_int_01[0] < changes.gf_int_01[1] || changes.gf_int_01[1] == 0) {
                const approvalRule = await fetch.getGroupApprovalRule(serviceCategory.app_code, serviceCategory.process_code, changes.gf_int_01[1]);
                // console.log("DEBUG-APPROVAL: Group Approval Rule", approvalRule);
                console.log(approvalRule);
                if (!approvalRule) return;
                if (approvalRule.configuration_type == "approval") {
                    const approval = await fetch.getProcessApproval(approvalRule.bo_display_id);
                    await handleApproval(args, ticket, approval, true, requestedItems);
                    return;
                }
                if (approvalRule.configuration_type == "condition") {
                    const condition = await fetch.getProcessCondition(approvalRule.bo_display_id);
                    handleCondition(ticket, requestedItems.custom_fields, condition);
                    return;
                }
                if (approvalRule.configuration_type == "file") {
                    const file = await fetch.getProcessFileGeneration(approvalRule.bo_display_id);
                    handleFileGeneration(file, args, ticket, requestedItems.custom_fields);
                    return;
                }
            }
            // if (changes.gf_int_01[0] > changes.gf_int_01[1]) {
            //     const approvalRule = await fetch.getGroupApprovalRule(serviceCategory.app_code, serviceCategory.process_code, changes.gf_int_01[0]);
            //     console.log("DEBUG-REJECT: Group Approval Rule", approvalRule);
            //     if (!approvalRule) return;
            //     await handleRejection(args, ticket, approvalRule);
            // }
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
        // if (Boolean(approvalRule.is_not_send_approval)) {
        //     console.log("Is only send email");
        //     sendEmailTemplate(approvalRule.email_template_code, placeholder, args.data.requester.email);
        //     sendEmailTemplate(
        //         approvalRule.approval_email_template_code,
        //         placeholder,
        //         requesters
        //             .map((r) => {
        //                 return r.primary_email || r.email;
        //             })
        //             .join(",")
        //     );
        //     return;
        // }
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
                // fetch.updateTicket(ticket.id, {
                //     custom_fields: {
                //         ticket_status: approvalRule.name,
                //         pending_approver: `Pending ${approver}`
                //     }
                // });
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

async function sendEmailTemplate(template_code, data, to_list, attachments = []) {
    try {
        if (!template_code) return;
        const emailTemplate = await fetch.getEmailTemplate(template_code);
        if (!emailTemplate) return;
        const templateBody = Handlebars.compile(emailTemplate.body);
        const templateSubject = Handlebars.compile(emailTemplate.subject);
        const body = templateBody(data);
        const subject = templateSubject(data);
        utils.sendMail(subject, body, to_list, attachments);
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

async function handleCondition(ticket, serviceReq, con) {
    if (!con.condition_field && !isValidJSONString(values)) return;
    const conditions = JSON.parse(con.condition_values);
    let data;
    if (con.object_type === "ticket") {
        data = ticket;
    }
    if (con.object_type === "service_request") {
        data = serviceReq;
    }
    if (con.object_type === "custom_object") {
        const res = await fetch.getCustomObject(con.custom_object_id, `ticket_id : '${ticket.id}'`);
        data = res[0];
    }
    for (const condition of conditions) {
        const check = await checkOperation(ticket, data, con.condition_field, condition);
        if (check) break;
    }
}

async function checkOperation(ticket, fields, field, condition) {
    switch (condition.operator) {
        case "condition":
            return false;
        case "equals":
            if (fields[field] == condition.value) {
                updateState(ticket, Number(condition.state));
                return true;
            }
            return false;
        case "contains":
            if (fields[field]?.includes(condition.value)) {
                updateState(ticket, Number(condition.state));
                return true;
            }
            return false;
        // case "include_any":
        //     if (condition.value?.includes(fields[field])) {
        //         updateState(ticket, Number(condition.state));
        //         return true;
        //     }
        //     return false;
        case "between":
            return false;
        case "greater_than":
            return false;
        case "greater_than_or_equal":
            return false;
        case "less_than":
            return false;
        case "less_than_or_equal":
            return false;
        default:
            return false;
    }
}

async function handleFileGeneration(fileConfig, args, ticket, service_request) {
    try {
        const template = await fetch.getDocumentTemplate(fileConfig.document_template_code);
        if (!template) return;
        const dataCO = await getRecordCustomObject(fileConfig.custom_object_id?.split(";"), ticket);
        const dataGenerate = { ticket, requester: args.data.requester, service_request, ...dataCO.data };
        console.log(JSON.stringify(dataGenerate));
        const fileGen =
            template.type === "docx"
                ? await utils.convertTemplateDocx(template.template_base64, { ...utils.convertData(dataGenerate), ...dataCO.list })
                : await utils.convertTemplateXlsx(template.template_base64, { ...dataGenerate, ...dataCO.list });

        const fileName = new Date().getTime() + "_" + template.file_name;

        if (Boolean(fileConfig.attach_to_ticket)) {
            const formData = new FormData();
            formData.append("attachments[]", fileGen, fileName);
            fetch
                .updateTicketAttachment(args, ticket.id, formData)
                .then((response) => {
                    console.log("Phản hồi:", response);
                })
                .catch((error) => {
                    console.log("Lỗi:", error);
                });
        }
        if (Boolean(fileConfig.create_attachment)) {
            fetch
                .createCustomObject(args, fileConfig.attachment_object_id, {
                    file_id: String(ticket.id),
                    file_name: fileName,
                    file_base64: utils.bufferToBase64(fileGen)
                })
                .then((response) => {
                    console.log("Phản hồi:", response);
                })
                .catch((error) => {
                    console.log("Lỗi:", error);
                });
        }
        if (Boolean(fileConfig.send_email_attachment)) {
            const [membersRequester, membersAgent] = await Promise.all([
                getRequesterGroupMembers(fileConfig.requester_groups_id.split(";")),
                getAgentGroupMembers(fileConfig.agent_groups_id)
            ]);
            const to = fileConfig.to_list + ";" + [...membersRequester, ...membersAgent]?.map((item) => item.email).join(";");
            sendEmailTemplate(fileConfig.email_template_code, dataGenerate, to, [
                {
                    filename: fileName,
                    content: fileGen
                }
            ]);
            // utils.sendMail("subject", "body", to, [
            //     {
            //         filename: fileName,
            //         content: fileGen
            //     }
            // ]);
        }
        if (fileConfig.new_state) {
            updateState(ticket, Number(fileConfig.new_state));
        }
    } catch (error) {
        console.log("ERROR File Generation", error);
    }
}

function isValidJSONString(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (error) {
        return false;
    }
}

function updateState(ticket, ticket_state) {
    fetch
        .updateTicket(ticket.id, {
            custom_fields: { ticket_state }
        })
        .then((data) => console.log("Update State", data))
        .catch((error) => console.log("Error updating state:", error));
}

async function getRequesterGroupMembers(groups) {
    const members = [];
    await Promise.all(
        groups.map(async (item) => {
            const res = await fetch.getRequesters(item);
            members.push(...res);
        })
    );
    return members;
}

async function getAgentGroupMembers(agent_group_id) {
    const members = [];
    const agentGroup = await fetch.getAgentGroup(agent_group_id);
    if (!agentGroup) return members;
    await Promise.all(
        agentGroup.members.map(async (item) => {
            const res = await fetch.getAnAgent(item);
            members.push(res);
        })
    );
    return members;
}

async function getRecordCustomObject(custom_objects, ticket) {
    var data = {};
    var list = {};
    await Promise.all(
        custom_objects.map(async (item) => {
            const [customObject, records] = await Promise.all([fetch.showCustomObject(item), fetch.getCustomObject(item, `ticket_id : '${ticket.id}'`)]);
            const lowerCaseTitle = utils.convertLowerCase(customObject.title);

            data[lowerCaseTitle] = { ...records[0] };
            list[lowerCaseTitle] = records;
        })
    );
    return { data, list };
}
