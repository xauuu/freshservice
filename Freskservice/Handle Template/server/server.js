const nodemailer = require("nodemailer");
const { TemplateHandler } = require("easy-template-x");
const fetch = require("node-fetch");
const { Renderer } = require("xlsx-renderer");
const base64 = require("base-64");
const FormData = require("form-data");
const { XLSXPopulateTemplate } = require("@tormozz48/xlsx-template");

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
    onTicketUpdateHandler: function (args) {
        const ticket = args.data.ticket;
        // sendMail("subject", JSON.stringify(args), "qdatqb@gmail.com")
        // if (!ticket.changes || !ticket.changes.custom_fields) return;
        console.log("Handle Template", ticket.id);
        const current = new Date();
        const data = {
            ticket,
            data: {
                strVal: "Some String value",
                numberVal: 3.14159,
                dateVal: new Date(2020, 0, 6),
                linkVal: { text: "some link", ref: "http://github.com" }
            },
            list: [
                {
                    strVal: "Github",
                    numberVal: 134.1222,
                    dateVal: new Date(2020, 1, 1),
                    linkVal: { text: "github", ref: "https://github.com" }
                },
                {
                    strVal: "Facebook",
                    numberVal: 4352.232,
                    dateVal: new Date(2020, 2, 23),
                    linkVal: { text: "facebook", ref: "https://facebook.com" }
                },
                {
                    strVal: "Google",
                    numberVal: 733.2122321,
                    dateVal: new Date(2020, 3, 7),
                    linkVal: { text: "google", ref: "https://google.com" }
                }
            ],
            projects: [
                {
                    name: "ExcelJS",
                    role: "maintainer",
                    platform: "github",
                    link: "https://github.com/exceljs/exceljs",
                    stars: 5300,
                    forks: 682
                },
                {
                    name: "xlsx-import",
                    role: "owner",
                    platform: "github",
                    link: "https://github.com/siemienik/xlsx-import",
                    stars: 2,
                    forks: 0
                },
                {
                    name: "xlsx-import",
                    role: "owner",
                    platform: "npm",
                    link: "https://www.npmjs.com/package/xlsx-import",
                    stars: "n.o.",
                    forks: "n.o."
                },
                {
                    name: "xlsx-renderer",
                    role: "owner",
                    platform: "github",
                    link: "https://github.com/siemienik/xlsx-renderer",
                    stars: 1,
                    forks: 0
                },
                {
                    name: "xlsx-renderer",
                    role: "owner",
                    platform: "npm",
                    link: "https://www.npmjs.com/package/xlsx-renderer",
                    stars: "n.o.",
                    forks: "n.o."
                },
                {
                    name: "TS Package Structure",
                    role: "owner",
                    platform: "github",
                    link: "https://github.com/Siemienik/ts-package-structure",
                    stars: 2,
                    forks: 0
                }
            ]
        };
        var to = "qdatqb@gmail.com";
        if (ticket.responder_email) to += "," + ticket.responder_email;
        try {
            if (current.getMinutes() % 2 == 0) {
                Promise.all([convertTemplate(data)])
                    .then(([docx]) => {
                        console.log("Đã chuyển đổi thành công docx:", docx);
                        sendMail("subject", "body", to, [
                            {
                                filename: "template.docx",
                                content: docx
                            }
                        ]);
                        const formData = new FormData();
                        formData.append("attachments[]", docx, "template.docx");
                        updateTicket(args, ticket.id, formData)
                            .then((response) => {
                                console.log("Phản hồi:", response);
                            })
                            .catch((error) => {
                                console.error("Lỗi:", error);
                            });
                    })
                    .catch((error) => {
                        console.error("Lỗi khi chuyển đổi Template hoặc Template Xlsx:", error);
                    });
            } else {
                Promise.all([convertTemplateXlsx(data)])
                    .then(([xlsx]) => {
                        console.log("Đã chuyển đổi thành công xlsx:", xlsx);
                        sendMail("subject", "body", to, [
                            {
                                filename: "template.xlsx",
                                content: xlsx
                            }
                        ]);
                        const formData = new FormData();
                        formData.append("attachments[]", xlsx, "template.xlsx");
                        updateTicket(args, ticket.id, formData)
                            .then((response) => {
                                console.log("Phản hồi:", response);
                            })
                            .catch((error) => {
                                console.error("Lỗi:", error);
                            });
                    })
                    .catch((error) => {
                        console.error("Lỗi khi chuyển đổi Template hoặc Template Xlsx:", error);
                    });
            }
        } catch (error) {
            console.log("Error send attachments", error);
        }
    }
};

function sendMail(subject, html, to, attachments = []) {
    const options = {
        from: "Truvisor Freshservice <info@truebpm.vn>",
        to,
        subject,
        html,
        attachments
    };
    transporter.sendMail(options, function (err, info) {
        if (err) {
            console.log(err);
        } else {
            console.log("Message sent: " + info.response);
        }
    });
}

function updateTicket(args, ticket_id, body) {
    return new Promise((resolve, reject) => {
        fetch(`https://${args.iparams.domain}/api/v2/tickets/` + ticket_id, {
            method: "PUT",
            body,
            headers: {
                Authorization: "Basic " + base64.encode(args.iparams.apikey + ":X")
            }
        })
            .then((response) => {
                if (!response.ok) {
                    reject(`Lỗi HTTP: ${response.status}`);
                } else {
                    resolve(response);
                }
            })
            .catch((error) => {
                reject(error);
            });
    });
}

async function convertTemplate(dataForGenerate) {
    const handler = new TemplateHandler();

    try {
        const templateFile = await getFileFromURL("https://github.com/xauuu/upload/raw/main/template.docx");
        const result = await handler.process(templateFile, dataForGenerate);
        return result;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function convertTemplateXlsx(dataForGenerate) {
    const renderer = new Renderer();
    // const xlsxPopulateTemplate = new XLSXPopulateTemplate();

    try {
        // const data = await getFileFromURL("https://github.com/xauuu/upload/raw/main/template-simple.xlsx")
        const data = await getFileFromURL("https://github.com/xauuu/upload/raw/main/template.xlsx");
        // await xlsxPopulateTemplate.loadTemplate(data);
        // xlsxPopulateTemplate.applyData(dataForGenerate)
        // const buffer = await xlsxPopulateTemplate.toBuffer();
        // return buffer
        const report = await renderer.renderFromArrayBuffer(data, dataForGenerate);
        const result = await report.xlsx.writeBuffer();
        return result;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function getFileFromURL(url) {
    const response = await fetch(url);
    if (!response.ok) return;
    return await response.buffer();
}
