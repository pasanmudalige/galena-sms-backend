class EmailTemplateDTO {
    constructor(toEmail, subject, template, data) {
      this.toEmail = toEmail,
      this.subject = subject;
      this.template = template;
      this.data = data;
    }
  }
  module.exports = EmailTemplateDTO;