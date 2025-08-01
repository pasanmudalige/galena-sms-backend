// email configuration
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');
const handlebarOptions = {
    viewEngine: {
      extName: ".handlebars",
      partialsDir: path.resolve(__dirname, '..', 'controllers', 'views'),
      defaultLayout: false,
    },
    viewPath: path.resolve(__dirname, '..', 'controllers', 'views'),
    extName: ".handlebars",
  }

exports.sendEmail = async (emailTemplateDTO) => {

    try {
   
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
            }
          });
          transporter.use('compile', hbs(handlebarOptions));
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emailTemplateDTO.toEmail,
            subject: emailTemplateDTO.subject,
            template: emailTemplateDTO.template,
            context: emailTemplateDTO.data
          };
        
          // send email
          transporter.sendMail(mailOptions).then(() => {
          }).catch((error) => {
            console.log(error)
            throw new Error('Email send failed.');
        
          });
    } catch (error) {
        console.log("error:", error);
        throw new Error('Email send failed.');
    }
}