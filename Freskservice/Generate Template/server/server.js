const FormData = require('form-data');
const utils = require('./lib/utils');

exports = {
  generateTicket: async function (request) {
    try {
      console.log(request)
      const article = await utils.getSolutionArticle(27000055942)
      const docx = await utils.convertTemplateDocx(article.attachments[0].attachment_url, {})
      utils.sendMail("subject", "subject", "qdatqb@gmail.com", attachments = [
        {
          filename: "test.docx",
          content: docx
        }
      ])
    } catch (error) {
      console.error(error)
    }
  }

};
