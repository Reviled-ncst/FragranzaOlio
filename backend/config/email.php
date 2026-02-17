<?php
/**
 * Email Configuration for Fragranza
 * 
 * Gmail Setup Instructions:
 * 1. Go to Google Account > Security > 2-Step Verification (enable it)
 * 2. Go to Google Account > Security > App passwords
 * 3. Generate a new app password for "Mail" on "Windows Computer"
 * 4. Use that 16-character password below (without spaces)
 * 
 * Alternative: Use SendGrid, Mailgun, or any other SMTP service
 */

return [
    // SMTP Host (Gmail: smtp.gmail.com, SendGrid: smtp.sendgrid.net)
    'smtp_host' => 'smtp.gmail.com',
    
    // SMTP Port (587 for TLS, 465 for SSL)
    'smtp_port' => 587,
    
    // SMTP Username (your email)
    'smtp_user' => 'fragranzaolio@gmail.com',
    
    // SMTP Password (App Password for Gmail - NOT your regular password)
    // Generate at: https://myaccount.google.com/apppasswords
    'smtp_pass' => '', // TODO: Add your Gmail App Password here
    
    // From email address
    'from_email' => 'fragranzaolio@gmail.com',
    
    // From name
    'from_name' => 'Fragranza Olio',
    
    // Debug mode (set to true to log email sending)
    'debug' => true,
    
    // Site URL for verification links
    'site_url' => 'https://fragranza-web.vercel.app',
    
    // Token expiration (in hours)
    'verification_token_expiry' => 24, // 24 hours
    'password_reset_expiry' => 1,       // 1 hour
];
