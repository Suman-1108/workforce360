import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings


def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> bool:
    """Send transactional email via Gmail SMTP (SSL Port 465)."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"[EMAIL DEV MODE] To: {to_email} | Subject: {subject}")
        return True

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = to_email

    if text_content:
        msg.attach(MIMEText(text_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        print(f"[EMAIL SUCCESS] Sent to {to_email}: {subject}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email to {to_email}: {e}")
        return False


def send_otp_email(to_email: str, otp: str, purpose: str = "Verification") -> bool:
    """Send 6-digit OTP verification email."""
    subject = f"WorkForce 360 - Your {purpose.capitalize()} OTP Code"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F5F7F1; padding: 30px; border-radius: 16px;">
        <div style="background-color: #FFFFFF; padding: 30px; border-radius: 12px; border: 1px solid #E5EAE4;">
            <h2 style="color: #075E54; margin-top: 0;">WorkForce 360</h2>
            <p style="color: #183B36; font-size: 16px;">Hello,</p>
            <p style="color: #78847F; font-size: 14px;">Your one-time security verification code for <strong>{purpose}</strong> is:</p>
            <div style="background-color: #F5F7F1; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #FF8B45;">{otp}</span>
            </div>
            <p style="color: #78847F; font-size: 13px;">This code is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #E5EAE4; margin: 20px 0;">
            <p style="color: #A0ABA6; font-size: 12px; text-align: center;">WorkForce 360 Enterprise Management</p>
        </div>
    </div>
    """
    return send_email(to_email, subject, html_content, f"Your WorkForce 360 OTP is: {otp}")


def send_employee_welcome_email(
    to_email: str,
    employee_name: str,
    organization_name: str,
    employee_id_number: str,
    designation: str,
    password: str,
) -> bool:
    """Send welcome onboarding email containing organization details, login email, and password."""
    subject = f"Welcome to {organization_name} — Your WorkForce 360 Employee Credentials"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F5F7F1; padding: 30px; border-radius: 16px;">
        <div style="background-color: #FFFFFF; padding: 30px; border-radius: 14px; border: 1px solid #E5EAE4;">
            <div style="margin-bottom: 18px;">
                <span style="font-size: 22px; font-weight: 900; color: #183B36;">WorkForce<span style="color: #FF8B45;">360</span></span>
            </div>
            <h2 style="color: #075E54; margin-top: 0; margin-bottom: 8px;">Welcome to {organization_name}!</h2>
            <p style="color: #183B36; font-size: 15px;">Hello <strong>{employee_name}</strong>,</p>
            <p style="color: #5A6B65; font-size: 14px; line-height: 1.6;">
                Your employee account has been created under <strong>{organization_name}</strong>
                as <strong>{designation}</strong> (Employee ID: <strong>{employee_id_number}</strong>).
            </p>
            <div style="background-color: #F5F7F1; border: 1px solid #CBD5C8; border-radius: 12px; padding: 18px 20px; margin: 22px 0;">
                <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #075E54;">
                    Your Employee Portal Login Credentials
                </p>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                        <td style="padding: 6px 0; color: #78847F; width: 140px;">Organization:</td>
                        <td style="padding: 6px 0; color: #183B36; font-weight: bold;">{organization_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #78847F;">Employee ID:</td>
                        <td style="padding: 6px 0; color: #183B36; font-weight: bold;">{employee_id_number}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #78847F;">Login Email:</td>
                        <td style="padding: 6px 0; color: #075E54; font-weight: bold;">{to_email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #78847F;">Password:</td>
                        <td style="padding: 6px 0; color: #EA580C; font-weight: bold; font-family: monospace; font-size: 16px;">{password}</td>
                    </tr>
                </table>
            </div>
            <p style="color: #5A6B65; font-size: 13px; line-height: 1.5;">
                Sign in via the <strong>Employee Portal</strong> using the email and password above to punch in,
                view your shifts, apply for leave, submit daily work updates, and access your salary vault.
                For security, please change your password after your first login.
            </p>
            <hr style="border: none; border-top: 1px solid #E5EAE4; margin: 22px 0;">
            <p style="color: #A0ABA6; font-size: 12px; text-align: center; margin: 0;">
                Sent by {organization_name} via WorkForce 360 Enterprise Management
            </p>
        </div>
    </div>
    """
    text_content = (
        f"Welcome to {organization_name}!\n\n"
        f"Hello {employee_name},\n"
        f"Your WorkForce 360 Employee Portal account has been created.\n\n"
        f"Organization: {organization_name}\n"
        f"Employee ID: {employee_id_number}\n"
        f"Designation: {designation}\n"
        f"Login Email: {to_email}\n"
        f"Password: {password}\n\n"
        f"Please log in to the Employee Portal and update your password after first login."
    )
    return send_email(to_email, subject, html_content, text_content)
