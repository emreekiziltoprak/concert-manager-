"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTicketEmail = void 0;
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
const sendTicketEmail = async (userEmail, fullName, ticketData) => {
    // Do not "simplify" this to a path relative to cwd. rootDir is "." so the
    // build emits this file to dist/src/services/ and copies the template to
    // dist/src/templates/, which keeps this ../ offset correct in both the
    // source tree and the build output.
    const templatePath = path_1.default.join(__dirname, '../templates/ticketEmail.ejs');
    const htmlContent = await ejs_1.default.renderFile(templatePath, {
        fullName: fullName,
        event: ticketData.event,
        orderItems: ticketData.orderItems
    });
    const mailOptions = {
        from: '"Concert Manager" <no-reply@concert.com>',
        to: userEmail,
        subject: `Your ticket is ready! ${ticketData.event.title}`,
        html: htmlContent
    };
    await transporter.sendMail(mailOptions);
};
exports.sendTicketEmail = sendTicketEmail;
//# sourceMappingURL=emailService.js.map