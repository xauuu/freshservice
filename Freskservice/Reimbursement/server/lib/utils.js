const nodemailer = require("nodemailer");
const fetch = require("node-fetch");
const base64 = require('base-64');
const { TemplateHandler } = require('easy-template-x')
const { Renderer } = require('xlsx-renderer');

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
        subject,
        html,
        attachments
    }
    transporter.sendMail(options, function (err, info) {
        if (err) {
            console.log(err);
        } else {
            console.log('Message sent: ' + info.response);
        }
    });
}

function updateTicket(args, ticket_id, body) {
    return new Promise((resolve, reject) => {
        fetch(`https://${args.iparams.domain}/api/v2/tickets/` + ticket_id, {
            method: 'PUT',
            body,
            headers: {
                "Authorization": "Basic " + base64.encode(args.iparams.apikey + ":X"),
            }
        })
            .then(response => {
                if (!response.ok) {
                    reject(`Lỗi HTTP: ${response.status}`);
                } else {
                    resolve(response);
                }
            })
            .catch(error => {
                reject(error);
            });
    });
}

async function convertTemplateDocx(url, dataForGenerate) {
    const handler = new TemplateHandler();
    try {
        const templateFile = await getFileFromURL(url);
        const result = await handler.process(templateFile, dataForGenerate);
        return result;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function convertTemplateXlsx(url, dataForGenerate) {
    const renderer = new Renderer();
    try {
        const data = await getFileFromURL(url)
        const report = await renderer.renderFromArrayBuffer(data, dataForGenerate);
        const result = await report.xlsx.writeBuffer()
        return result
    } catch (error) {
        console.error(error);
        throw error;
    }

}

async function getFileFromURL(url) {
    const response = await fetch(url);
    if (!response.ok) return
    return await response.buffer()
}

async function getSolutionArticle(id) {
    const { response } = await $request.invokeTemplate("getSolutionArticle", {
        context: { id }
    });
    return JSON.parse(response).article
}

exports = {
    sendMail,
    convertTemplateDocx,
    convertTemplateXlsx,
    updateTicket,
    getSolutionArticle
}