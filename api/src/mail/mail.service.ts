import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../app-config/app-config.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(private readonly configService: AppConfigService) { }

    private async getTransporter(): Promise<nodemailer.Transporter | null> {
        const config = await this.configService.getConfig();

        if (!config.smtpHost || !config.smtpUser || !config.mailFrom) {
            this.logger.warn('SMTP not configured');
            return null;
        }

        return nodemailer.createTransport({
            host: config.smtpHost,
            port: config.smtpPort || 587,
            secure: config.smtpSecure || false,
            auth: {
                user: config.smtpUser,
                pass: config.smtpPassword || '',
            },
        });
    }

    async sendVerificationEmail(email: string, username: string, token: string, frontendUrl: string): Promise<boolean> {
        try {
            const transporter = await this.getTransporter();
            if (!transporter) return false;

            const config = await this.configService.getConfig();
            const verifyUrl = `${frontendUrl}/auth/verify-email?token=${token}`;

            await transporter.sendMail({
                from: config.mailFrom!,
                to: email,
                subject: 'Vérifiez votre adresse email - Cloudy',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #6366f1;">Bienvenue sur Cloudy, ${username} !</h2>
                        <p>Merci de vous être inscrit. Veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse email :</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verifyUrl}" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                Vérifier mon email
                            </a>
                        </div>
                        <p style="color: #666; font-size: 14px;">Ce lien expire dans 24 heures.</p>
                        <p style="color: #666; font-size: 12px;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
                    </div>
                `,
            });

            this.logger.log(`Verification email sent to ${email}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send verification email: ${error}`);
            return false;
        }
    }

    async sendPasswordResetEmail(email: string, username: string, token: string, frontendUrl: string): Promise<boolean> {
        try {
            const transporter = await this.getTransporter();
            if (!transporter) return false;

            const config = await this.configService.getConfig();
            const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

            await transporter.sendMail({
                from: config.mailFrom!,
                to: email,
                subject: 'Réinitialisation de mot de passe - Cloudy',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #6366f1;">Réinitialisation de mot de passe</h2>
                        <p>Bonjour ${username},</p>
                        <p>Vous avez demandé une réinitialisation de mot de passe. Cliquez sur le bouton ci-dessous :</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                Réinitialiser mon mot de passe
                            </a>
                        </div>
                        <p style="color: #666; font-size: 14px;">Ce lien expire dans 1 heure.</p>
                        <p style="color: #666; font-size: 12px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
                    </div>
                `,
            });

            this.logger.log(`Password reset email sent to ${email}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send password reset email: ${error}`);
            return false;
        }
    }

    async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            const config = await this.configService.getConfig();

            if (!config.smtpHost || !config.smtpUser || !config.mailFrom) {
                return {
                    success: false,
                    message: 'Configuration SMTP incomplète. Vérifiez le serveur, l\'utilisateur et l\'adresse d\'envoi.'
                };
            }

            const transporter = await this.getTransporter();
            if (!transporter) {
                return { success: false, message: 'Impossible de créer le transporteur mail' };
            }

            // Verify connection
            await transporter.verify();
            this.logger.log('SMTP connection verified successfully');
            return { success: true, message: 'Connexion SMTP réussie !' };
        } catch (error) {
            this.logger.error(`SMTP connection test failed: ${error.message}`);
            return { success: false, message: `Échec de connexion: ${error.message}` };
        }
    }

    async sendTestEmail(toEmail: string): Promise<{ success: boolean; message: string }> {
        try {
            const transporter = await this.getTransporter();
            if (!transporter) {
                return { success: false, message: 'SMTP non configuré' };
            }

            const config = await this.configService.getConfig();

            await transporter.sendMail({
                from: config.mailFrom!,
                to: toEmail,
                subject: '✅ Test Email - Cloudy',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #06b6d4;">🎉 Configuration Email Réussie !</h2>
                        <p>Cet email confirme que votre configuration SMTP fonctionne correctement.</p>
                        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; color: #475569;"><strong>Serveur:</strong> ${config.smtpHost}</p>
                            <p style="margin: 5px 0 0 0; color: #475569;"><strong>Port:</strong> ${config.smtpPort}</p>
                        </div>
                        <p style="color: #666; font-size: 12px;">Envoyé depuis Cloudy Admin Panel</p>
                    </div>
                `,
            });

            this.logger.log(`Test email sent to ${toEmail}`);
            return { success: true, message: `Email de test envoyé à ${toEmail}` };
        } catch (error) {
            this.logger.error(`Failed to send test email: ${error.message}`);
            return { success: false, message: `Échec d'envoi: ${error.message}` };
        }
    }
}
