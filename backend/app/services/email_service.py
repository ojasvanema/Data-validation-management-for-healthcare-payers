import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Dict, Any

def generate_email_html(provider_data: Dict[str, Any]) -> str:
    """
    Generates a professional, structured HTML email report for the provider.
    """
    name = provider_data.get('name', 'Provider')
    npi = provider_data.get('npi', 'N/A')
    status = provider_data.get('status', 'Review')
    conflicts = provider_data.get('conflicts', [])
    
    conflict_items = "".join([f"<li>{conflict}</li>" for conflict in conflicts])
    if not conflict_items:
         conflict_items = "<li>No specific conflicts listed. Routine verification required.</li>"

    html_content = f"""
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; background-color: #f9f9f9; }}
            .container {{ max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-top: 5px solid #10b981; }}
            .header {{ text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; margin-bottom: 20px; }}
            .header h1 {{ color: #064e3b; margin: 0; font-size: 24px; }}
            .section-title {{ color: #047857; font-size: 18px; border-bottom: 2px solid #ecfdf5; padding-bottom: 5px; margin-top: 25px; }}
            .details {{ background-color: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 15px 0; }}
            .details p {{ margin: 5px 0; }}
            .alert-box {{ background-color: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 6px; margin: 15px 0; }}
            .alert-box h3 {{ color: #b91c1c; margin-top: 0; font-size: 16px; }}
            .alert-box ul {{ margin: 10px 0 0 0; padding-left: 20px; color: #991b1b; }}
            .action-steps {{ background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; border-radius: 6px; margin: 15px 0; }}
            .action-steps h3 {{ color: #1d4ed8; margin-top: 0; font-size: 16px; }}
            .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #64748b; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>VERA: Validation & Compliance Notice</h1>
            </div>
            
            <p>Dear {name},</p>
            
            <p>Our VERA (Validation, Evidence, Risk, Analysis) system has recently performed a routine verification of your provider credentialing data on file.</p>
            
            <p>During this automated review, the system identified some discrepancies or missing information that require your immediate attention.</p>
            
            <div class="details">
                <strong>Provider Details on File:</strong>
                <p>Name: {name}</p>
                <p>NPI: {npi}</p>
                <p>Current Status: <strong style="color: {'#b91c1c' if status == 'Flagged' else '#d97706'};">{status}</strong></p>
                <p>Review Date: {datetime.now().strftime('%Y-%m-%d')}</p>
            </div>
            
            <div class="alert-box">
                <h3>Specific Findings & Discrepancies</h3>
                <ul>
                    {conflict_items}
                </ul>
            </div>
            
            <div class="action-steps">
                <h3>Required Action Steps</h3>
                <p>To resolve these issues and maintain your active network status, please follow these steps:</p>
                <ol>
                    <li>Review the specific findings listed above.</li>
                    <li>Gather the necessary documentation to correct or verify the information.</li>
                    <li>Contact our Provider Compliance team or your network representative immediately.</li>
                    <li>Submit updated credentials through the VERA portal if applicable.</li>
                </ol>
            </div>
            
            <p>Failure to address these discrepancies may result in temporary suspension of processing for future claims.</p>
            
            <p>Thank you for your prompt attention to this matter.</p>
            
            <div class="footer">
                <p>This is an automated message from the VERA Compliance System.</p>
                <p>Please do not reply directly to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return html_content

def send_provider_email(provider_data: Dict[str, Any], to_email: str = "provider@example.com") -> bool:
    """
    Sends the generated email report.
    Uses SMTP credentials from the environment if available.
    Otherwise, writes the email to a local file for mock/testing purposes.
    """
    html_content = generate_email_html(provider_data)
    
    smtp_server = os.environ.get("SMTP_SERVER")
    smtp_port = os.environ.get("SMTP_PORT", 587)
    smtp_user = os.environ.get("SMTP_USER")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    
    if smtp_server and smtp_user and smtp_password:
        try:
            msg = MIMEMultipart("alternative")
            msg['Subject'] = f"URGENT: VERA Credential Validation Notice - {provider_data.get('name', 'Provider')}"
            msg['From'] = smtp_user
            msg['To'] = to_email
            
            part = MIMEText(html_content, 'html')
            msg.attach(part)
            
            with smtplib.SMTP(smtp_server, int(smtp_port)) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_user, to_email, msg.as_string())
            print(f"Email successfully sent via SMTP to {to_email}")
            return True
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Failed to send email via SMTP: {e}")
            # Fallback to local file if SMTP fails
            
    # Mock / Local generation fallback
    filename = f"email_preview_{provider_data.get('id', 'unknown')}.html"
    filepath = os.path.join(os.getcwd(), filename)
    with open(filepath, "w") as f:
        f.write(html_content)
    
    print(f"Email mock generated and saved to {filepath}")
    return True

