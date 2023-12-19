const nodemailer = require("nodemailer");
const moment = require("moment");
const { TemplateHandler } = require("easy-template-x");
const { Renderer } = require("xlsx-renderer");
const bufferFrom = require("buffer-from");

const transporter = nodemailer.createTransport({
    host: "email-smtp.ap-southeast-1.amazonaws.com",
    port: 587,
    secure: false,
    auth: {
        user: "AKIAR6X2FCDUCAUH5CF5",
        pass: "BB6+9lWVXwURGcp6qKmfNb7ZXvff8mef24zAXyFm+mB+"
    }
});

function sendMail(subject, html, to, attachments = []) {
    const options = {
        from: "Truvisor Freshservice <info@truebpm.vn>",
        to,
        cc: "qdatqb@gmail.com, lethanhtrung2020@gmail.com",
        subject,
        html,
        attachments
    };
    transporter.sendMail(options, function (err, info) {
        if (err) {
            console.log(err);
        } else {
            console.log("Message sent: ", info.response, info.envelope);
        }
    });
}
const formattedApprovals = (approvals) => {
    return approvals.map((approval) => {
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
            const regex = new RegExp(`{{${key}}}`, "g");
            modifiedHtml = modifiedHtml.replace(regex, value);
        }
    }

    return modifiedHtml;
}

function formatDate(date) {
    return moment(date).format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]");
}

async function convertTemplateDocx(base64, dataForGenerate) {
    const handler = new TemplateHandler();

    try {
        const buffer = bufferFrom(base64, "base64");
        const result = await handler.process(buffer, dataForGenerate);
        return result;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function convertTemplateXlsx(base64, dataForGenerate) {
    const renderer = new Renderer();

    try {
        const data = bufferFrom(base64, "base64");
        const report = await renderer.renderFromArrayBuffer(data, dataForGenerate);
        const result = await report.xlsx.writeBuffer();
        return result;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

function bufferToBase64(buffer) {
    return bufferFrom(buffer).toString("base64");
}

function convertData(inputData) {
    const outputData = {};
    Object.keys(inputData).forEach((key) => {
        const subObject = inputData[key];
        Object.keys(subObject).forEach((subKey) => {
            const newKey = `${key}.${subKey}`;
            outputData[newKey] = subObject[subKey];
        });
    });
    return outputData;
}

function convertLowerCase(inputString) {
    return inputString.toLowerCase().replace(/[^\w]/g, "_");
}

exports = {
    sendMail,
    formattedApprovals,
    replaceHtmlContent,
    formatDate,
    convertTemplateDocx,
    convertTemplateXlsx,
    bufferToBase64,
    convertData,
    convertLowerCase
};
