const nodemailer = require("nodemailer")

async function sendInvitationEmail(email, token) {
  try {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com", // ou autre
        port: 587,
        secure: false,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false, // <-- IMPORTANT pour ignorer l'erreur certificat auto-signé
        },
    })


    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;


    await transporter.sendMail({
      from: `"Forko Social" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Invitation à créer votre mot de passe",
      html: `<p>Bonjour,</p><p>Pour créer votre mot de passe, cliquez ici : <a href="${resetUrl}">${resetUrl}</a></p>`,
    })

    console.log("Mail d'invitation envoyé à", email)
  } catch (error) {
    console.error("Erreur lors de l'envoi du mail d'invitation:", error)
    throw error
  }
}

module.exports = { sendInvitationEmail }
