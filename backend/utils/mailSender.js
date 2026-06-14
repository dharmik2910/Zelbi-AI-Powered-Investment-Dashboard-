import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();


const mailSender = async (email, title, body) => {
    try{
            let transporter = nodemailer.createTransport({
                host:process.env.MAIL_HOST,
                auth:{
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS,
                }
            })


            let info = await transporter.sendMail({
                from: 'NIGGA || By Kuldeep',
                to:`${email}`,
                subject: `${title}`,
                html: `${body}`,
            })
            console.log(info);
            return info;
    }
catch(error) {
    console.log("Mail Error:", error);
    throw error;
}
}


export default mailSender;
