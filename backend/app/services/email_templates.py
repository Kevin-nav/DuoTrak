"""Email templates for the application."""

def get_partner_invitation_email(
    sender_name: str,
    receiver_name: str,
    accept_url: str,
    custom_message: str = None,
    expires_in_days: int = 7,
) -> tuple[str, str]:
    """
    Generate the subject and HTML content for a partner invitation email.
    """
    subject = f"You're invited to team up with {sender_name} on DuoTrak!"

    custom_message_html = f'''
    <p><strong>A message from {sender_name}:</strong></p>
    <blockquote style="border-left: 4px solid #ccc; padding-left: 1em; margin-left: 1em;">
        {custom_message}
    </blockquote>
    <hr style="margin: 20px 0;">
    ''' if custom_message else ''

    html_content = f'''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{subject}</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif;
                background-color: #f0f2f5;
                color: #333;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }}
            .content {{
                padding: 30px 40px;
                line-height: 1.7;
                color: #555;
            }}
            .content p {{
                margin: 0 0 15px;
            }}
            .button-container {{
                text-align: center;
                margin: 30px 0;
            }}
            .button {{
                display: inline-block;
                padding: 15px 30px;
                background-color: #5850ec;
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 50px;
                font-weight: 600;
                transition: background-color 0.3s ease;
            }}
            .button:hover {{
                background-color: #473ddb;
            }}
            .footer {{
                text-align: center;
                padding: 20px;
                font-size: 12px;
                color: #999;
            }}
            .logo {{
                height: 40px;
                margin-bottom: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://app.duotrak.com/mascot/Invitation_Sent_Mascot.png" alt="DuoTrak Mascot" style="width: 150px; height: auto; margin-bottom: 20px;">
                <h1>A partnership awaits!</h1>
            </div>
            <div class="content">
                <p>Hi {receiver_name},</p>
                {custom_message_html}
                <p>You've been invited to team up on DuoTrak!</p>
                <p>DuoTrak is a revolutionary new app designed to help partners like you achieve their goals together. It's all about teamwork, motivation, and celebrating your wins, big and small.</p>
                <p>Ready to join forces and make amazing things happen? We can't wait to see what you'll accomplish together.</p>
                <div class="button-container">
                    <a href="{accept_url}" class="button">Accept Invitation</a>
                </div>
                <p style="text-align:center; font-size: 14px; color: #777;">This invitation is valid for {expires_in_days} days.</p>
                <p>If you weren't expecting this, you can safely ignore this email.</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 DuoTrak. Let's achieve more, together.</p>
            </div>
        </div>
    </body>
    </html>
    '''
    
    return subject, html_content


def get_invitation_accepted_email(
    receiver_name: str,
    partner_name: str,
    dashboard_url: str,
) -> tuple[str, str]:
    """
    Generate the subject and HTML content for an invitation accepted email.
    """
    subject = f"You and {partner_name} are now partners on DuoTrak!"
    
    html_content = f'''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{subject}</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif;
                background-color: #f0f2f5;
                color: #333;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
            }}
            .header {{
                background: linear-gradient(135deg, #22c55e 0%, #15803d 100%);
                color: white;
                padding: 40px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }}
            .content {{
                padding: 30px 40px;
                line-height: 1.7;
                color: #555;
            }}
            .content p {{
                margin: 0 0 15px;
            }}
            .button-container {{
                text-align: center;
                margin: 30px 0;
            }}
            .button {{
                display: inline-block;
                padding: 15px 30px;
                background-color: #22c55e;
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 50px;
                font-weight: 600;
                transition: background-color 0.3s ease;
            }}
            .button:hover {{
                background-color: #16a34a;
            }}
            .footer {{
                text-align: center;
                padding: 20px;
                font-size: 12px;
                color: #999;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://duotrak.org/mascot/Invitation_Accepted_Mascot.png" alt="DuoTrak Mascot" style="width: 150px; height: auto; margin-bottom: 20px;">
                <h1>It's Official!</h1>
            </div>
            <div class="content">
                <p>Hi {receiver_name},</p>
                <p>Fantastic news! <strong>{partner_name}</strong> has accepted your invitation. You are now officially partners on DuoTrak.</p>
                <p>It's time to start this journey together. Head to your shared dashboard to set up your first goal.</p>
                <div class="button-container">
                    <a href="{dashboard_url}" class="button">Go to Your Dashboard</a>
                </div>
                <p>Here's to achieving great things together!</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 DuoTrak. Let's achieve more, together.</p>
            </div>
        </div>
    </body>
    </html>
    '''
    
    return subject, html_content


def get_invitation_rejected_email(
    sender_name: str,
    rejected_by_name: str,
) -> tuple[str, str]:
    """
    Generate the subject and HTML content for an invitation rejected email.
    """
    subject = f"An update on your DuoTrak invitation"
    
    html_content = f'''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{subject}</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif;
                background-color: #f0f2f5;
                color: #333;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
            }}
            .header {{
                background: linear-gradient(135deg, #f9a8d4 0%, #ef4444 100%);
                color: white;
                padding: 40px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }}
            .content {{
                padding: 30px 40px;
                line-height: 1.7;
                color: #555;
            }}
            .content p {{
                margin: 0 0 15px;
            }}
            .footer {{
                text-align: center;
                padding: 20px;
                font-size: 12px;
                color: #999;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://duotrak.org/mascot/Invitation_Declined_or_Re-invite_Mascot.png" alt="DuoTrak Mascot" style="width: 150px; height: auto; margin-bottom: 20px;">
                <h1>Partnership Update</h1>
            </div>
            <div class="content">
                <p>Hi {sender_name},</p>
                <p>Just a quick update: <strong>{rejected_by_name}</strong> has declined the invitation to partner on DuoTrak for now.</p>
                <p>No worries! The right partner is out there. You can always send a new invitation to someone else from your dashboard.</p>
                <p>Keep moving forward!</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 DuoTrak. Let's achieve more, together.</p>
            </div>
        </div>
    </body>
    </html>
    '''
    
    return subject, html_content


def get_nudge_email(
    sender_name: str,
    receiver_name: str,
    accept_url: str,
) -> tuple[str, str]:
    """
    Generate the subject and HTML content for a nudge email.
    """
    subject = f"A friendly reminder from {sender_name}!"
    
    html_content = f'''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{subject}</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif;
                background-color: #f0f2f5;
                color: #333;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
            }}
            .header {{
                background: linear-gradient(135deg, #facc15 0%, #fb923c 100%);
                color: #422006;
                padding: 40px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }}
            .content {{
                padding: 30px 40px;
                line-height: 1.7;
                color: #555;
            }}
            .content p {{
                margin: 0 0 15px;
            }}
            .button-container {{
                text-align: center;
                margin: 30px 0;
            }}
            .button {{
                display: inline-block;
                padding: 15px 30px;
                background-color: #5850ec;
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 50px;
                font-weight: 600;
                transition: background-color 0.3s ease;
            }}
            .button:hover {{
                background-color: #473ddb;
            }}
            .footer {{
                text-align: center;
                padding: 20px;
                font-size: 12px;
                color: #999;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Just a Friendly Nudge!</h1>
            </div>
            <div class="content">
                <p>Hi {receiver_name},</p>
                <p>Just a friendly reminder that <strong>{sender_name}</strong> is excited to start a partnership with you on DuoTrak.</p>
                <p>Your invitation is still waiting. Join them to start tracking goals and achieving more together!</p>
                <div class="button-container">
                    <a href="{accept_url}" class="button">View Invitation</a>
                </div>
            </div>
            <div class="footer">
                <p>&copy; 2025 DuoTrak. Let's achieve more, together.</p>
            </div>
        </div>
    </body>
    </html>
    '''
    
    return subject, html_content

