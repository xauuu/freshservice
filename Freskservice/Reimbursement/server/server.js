const FormData = require('form-data');
const utils = require('./lib/utils');
const fetch = require('./lib/fetch')

const SERVICE_REQUESTS = ["Service Request", "Request"]

exports = {
  onTicketUpdateHandler: async function (args) {
    const ticket = args.data.ticket;
    const changes = args.data.ticket.changes;
    if (!SERVICE_REQUESTS.includes(ticket.type_name) || !(changes.gf_int_01 && changes.gf_int_01.length > 0)) return;
    try {
      const requestedItems = await fetch.getRequestedItems(ticket.id)
      if (requestedItems.service_item_id != args.iparams.service_item_id) return
      // console.log(requestedItems)
      const serviceCategory = await fetch.getServiceCategory(requestedItems.service_item_id)
      if (serviceCategory && (changes.gf_int_01[0] < changes.gf_int_01[1])) {
        const approvalRule = await fetch.getGroupApprovalRule(serviceCategory.app_code, serviceCategory.process_code, changes.gf_int_01[1])
        if (!Boolean(approvalRule.is_state_end)) return;
        const dataGenerate = {
          ...ticket,
          ticket,
          projects: [
            {
              "name": "ExcelJS",
              "role": "maintainer",
              "platform": "github",
              "link": "https://github.com/exceljs/exceljs",
              "stars": 5300,
              "forks": 682
            },
            {
              "name": "xlsx-import",
              "role": "owner",
              "platform": "github",
              "link": "https://github.com/siemienik/xlsx-import",
              "stars": 2,
              "forks": 0
            },
            {
              "name": "xlsx-import",
              "role": "owner",
              "platform": "npm",
              "link": "https://www.npmjs.com/package/xlsx-import",
              "stars": "n.o.",
              "forks": "n.o."
            },
            {
              "name": "xlsx-renderer",
              "role": "owner",
              "platform": "github",
              "link": "https://github.com/siemienik/xlsx-renderer",
              "stars": 1,
              "forks": 0
            },
            {
              "name": "xlsx-renderer",
              "role": "owner",
              "platform": "npm",
              "link": "https://www.npmjs.com/package/xlsx-renderer",
              "stars": "n.o.",
              "forks": "n.o."
            },
            {
              "name": "TS Package Structure",
              "role": "owner",
              "platform": "github",
              "link": "https://github.com/Siemienik/ts-package-structure",
              "stars": 2,
              "forks": 0
            }
          ]
        }
        var file = {
          filename: "",
          content: ""
        };
        if (args.iparams.template_type == "Excel") {
          file.filename = `Result_${new Date().getTime()}.xlsx`
          file.content = await utils.convertTemplateXlsx(args.iparams.template_url, dataGenerate)
        } else {
          file.filename = `Result_${new Date().getTime()}.docx`
          file.content = await utils.convertTemplateDocx(args.iparams.template_url, dataGenerate)
        }
        // console.log(approvalRule)
        if (Boolean(approvalRule.is_send_email)) {
          console.log("Send Email template")
          utils.sendMail("subject", "subject", "qdatqb@gmail.com", attachments = [file])
        }
        if (Boolean(approvalRule.is_attach_file)) {
          console.log("Attach File")
          const formData = new FormData();
          formData.append('attachments[]', file.content, file.filename);
          utils.updateTicket(args, ticket.id, formData).then(response => {
            console.log('Update Attachment Successfully:', response);
          })
            .catch(error => {
              console.error('Error Update Attachment:', error);
            });
        }
      }
    } catch (error) {
      utils.sendMail(`${ticket.id} - Error in State End`, "", "qdatqb@gmail.com")
      console.error(error)
    }
  }

};
