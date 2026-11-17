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
