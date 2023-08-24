const nodemailer = require("nodemailer");

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
  onTicketCreateHandler: async function () {
    try {
      const data = await $request.invokeTemplate("getAllContact");
      const info = await transporter.sendMail({
        from: "Meet Your Mentor <no-reply@meetyourmentor.vn>",
        to: "qdatqb@gmail.com, lethanhtrung2021@gmail.com",
        subject: "List all Contact",
        text: data.response
      });
      console.log(info);
    } catch (error) {
      console.log(error);
    }
  }
};
