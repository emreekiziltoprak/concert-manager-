
import path from 'path';
import ejs from 'ejs';

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export interface TicketEmailData {
    event: {
        title: string;
        startDate: Date | string;
        latitude: unknown;
        longitude: unknown;
    };
    orderItems: Array<{
        ticketType: { name: string };
        tickets: Array<{ id: string }>;
    }>;
}

const sendTicketEmail = async (
    userEmail: string,
    fullName: string,
    ticketData: TicketEmailData
): Promise<void> => {

    // Do not "simplify" this to a path relative to cwd. rootDir is "." so the
    // build emits this file to dist/src/services/ and copies the template to
    // dist/src/templates/, which keeps this ../ offset correct in both the
    // source tree and the build output.
    const templatePath = path.join(__dirname,
        '../templates/ticketEmail.ejs'
    );

    const htmlContent = await ejs.renderFile(templatePath, {
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

export { sendTicketEmail };
