const dotenv = require('dotenv');
dotenv.config();

const sendEmail =(userEmail, name, confirmationCode)=>{
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: email,
            pass: password,
        },
    });

    const mailOptions = {
        from: email,
        to: userEmail,
        subject: 'Confirmation code',
        text: `tu codigo es ${confirmationCode}, gracias por confiar en nosotros ${name}!`
    }

    transporter.sendMail(mailOptions, function (error, info){
    if(error){
        console.log(error);
        return false
    }else{
        console.log('Email sent: ' + info.response)
        return true
    }
})

}

module.exports = sendEmail;