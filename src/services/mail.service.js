import nodemailer from 'nodemailer';
import config from '../config/index.js';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  auth: {
    user: config.email.user,
    pass: config.email.pass
  }
});

const sendMail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: config.email.from,
    to,
    subject,
    html
  });
};

export const sendVerificationEmail = (user) =>
  sendMail({
    to: user.email,
    subject: 'Verifica tu cuenta en BildyApp',
    html: `
      <h2>Bienvenido a BildyApp</h2>
      <p>Tu código de verificación es:</p>
      <h1 style="letter-spacing:8px">${user.verificationCode}</h1>
      <p>Este código expira en 24 horas.</p>
    `
  });

export const sendInvitationEmail = (invitedUser, tempPassword) =>
  sendMail({
    to: invitedUser.email,
    subject: 'Te han invitado a BildyApp',
    html: `
      <h2>Has sido invitado a BildyApp</h2>
      <p>Accede con estas credenciales temporales:</p>
      <ul>
        <li><strong>Email:</strong> ${invitedUser.email}</li>
        <li><strong>Contraseña temporal:</strong> ${tempPassword}</li>
      </ul>
      <p>Tu código de verificación es: <strong>${invitedUser.verificationCode}</strong></p>
      <p>Cambia tu contraseña tras el primer acceso.</p>
    `
  });
