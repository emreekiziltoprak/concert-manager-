const path = require('path'); // <--- İŞTE EKSİK OLAN SATIR BU!
const ejs = require('ejs');

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
    }
});

const sendTicketEmail = async (userEmail, fullName, ticketData) => {
    
    const templatePath = path.join(__dirname,
        '../templates/ticketEmail.ejs'
    );

    const htmlContent = await ejs.renderFile(templatePath, {
        fullName: fullName,
        event: ticketData.event,
        orderItems: ticketData.orderItem
    });

    const mailOptions = {
        from: '"Concert Manager" <no-reply@concert.com>',
        to: userEmail,
        subject: `Your ticket is ready! ${ticketData.event.title}`,
        html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
};

module.exports = { sendTicketEmail };