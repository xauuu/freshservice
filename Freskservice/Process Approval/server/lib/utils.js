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

async function sendMail(subject, html, to) {
    await transporter.sendMail({
        from: "Truvisor Freshservice <info@truebpm.vn>",
        to,
        subject,
        html
    });
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

function formatDate(date) {
    return moment(date).format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]')
}

exports = {
    sendMail,
    formattedApprovals,
    replaceHtmlContent,
    formatDate
}