<?php
/**
 * Email Service for Fragranza
 * Uses SMTP to send verification and notification emails
 * 
 * Configuration: Create backend/config/email.php with your SMTP credentials
 */

// Skip including PHPMailer for now - we'll use a simple socket-based SMTP or PHP mail
// You can install PHPMailer via: composer require phpmailer/phpmailer

class EmailService {
    private $smtpHost;
    private $smtpPort;
    private $smtpUser;
    private $smtpPass;
    private $fromEmail;
    private $fromName;
    private $debug = false;
    
    public function __construct() {
        // Load config
        $configFile = __DIR__ . '/../config/email.php';
        if (file_exists($configFile)) {
            $config = require $configFile;
            $this->smtpHost = $config['smtp_host'] ?? 'smtp.gmail.com';
            $this->smtpPort = $config['smtp_port'] ?? 587;
            $this->smtpUser = $config['smtp_user'] ?? '';
            $this->smtpPass = $config['smtp_pass'] ?? '';
            $this->fromEmail = $config['from_email'] ?? $this->smtpUser;
            $this->fromName = $config['from_name'] ?? 'Fragranza Olio';
            $this->debug = $config['debug'] ?? false;
        }
    }
    
    /**
     * Send verification email to new user
     */
    public function sendVerificationEmail($email, $firstName, $token, $verifyUrl) {
        $subject = "Verify your Fragranza account";
        
        $html = $this->getVerificationEmailTemplate($firstName, $verifyUrl);
        
        return $this->send($email, $subject, $html);
    }
    
    /**
     * Send password reset email
     */
    public function sendPasswordResetEmail($email, $firstName, $resetUrl) {
        $subject = "Reset your Fragranza password";
        
        $html = $this->getPasswordResetTemplate($firstName, $resetUrl);
        
        return $this->send($email, $subject, $html);
    }
    
    /**
     * Send order confirmation email
     */
    public function sendOrderConfirmationEmail($email, $customerName, $orderData) {
        $subject = "Order Confirmed - #{$orderData['order_number']}";
        
        $html = $this->getOrderConfirmationTemplate($customerName, $orderData);
        
        return $this->send($email, $subject, $html);
    }
    
    /**
     * Main send function using PHP mail() with SMTP headers
     * For production, consider using PHPMailer for better reliability
     */
    public function send($to, $subject, $htmlBody, $textBody = null) {
        // Check if SMTP is configured
        if (empty($this->smtpUser) || empty($this->smtpPass)) {
            // Fallback to PHP mail() function
            return $this->sendWithPhpMail($to, $subject, $htmlBody, $textBody);
        }
        
        // Try sending with sockets (native SMTP)
        return $this->sendWithSmtp($to, $subject, $htmlBody, $textBody);
    }
    
    /**
     * Send using PHP's native mail() function
     */
    private function sendWithPhpMail($to, $subject, $htmlBody, $textBody = null) {
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            'From: ' . $this->fromName . ' <' . ($this->fromEmail ?: 'noreply@fragranza.com') . '>',
            'Reply-To: ' . ($this->fromEmail ?: 'noreply@fragranza.com'),
            'X-Mailer: PHP/' . phpversion()
        ];
        
        $success = mail($to, $subject, $htmlBody, implode("\r\n", $headers));
        
        if ($this->debug) {
            error_log("Email sent via PHP mail() to $to: " . ($success ? 'success' : 'failed'));
        }
        
        return $success;
    }
    
    /**
     * Send using SMTP sockets (for Gmail, etc.)
     */
    private function sendWithSmtp($to, $subject, $htmlBody, $textBody = null) {
        try {
            // Build email content
            $boundary = md5(time());
            
            $headers = "MIME-Version: 1.0\r\n";
            $headers .= "From: {$this->fromName} <{$this->fromEmail}>\r\n";
            $headers .= "To: <{$to}>\r\n";
            $headers .= "Subject: {$subject}\r\n";
            $headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";
            
            $body = "--{$boundary}\r\n";
            $body .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
            $body .= ($textBody ?: strip_tags($htmlBody)) . "\r\n";
            $body .= "--{$boundary}\r\n";
            $body .= "Content-Type: text/html; charset=UTF-8\r\n\r\n";
            $body .= $htmlBody . "\r\n";
            $body .= "--{$boundary}--";
            
            // Connect to SMTP server
            $socket = fsockopen(
                ($this->smtpPort == 465 ? 'ssl://' : '') . $this->smtpHost,
                $this->smtpPort,
                $errno,
                $errstr,
                30
            );
            
            if (!$socket) {
                throw new Exception("SMTP connection failed: $errstr ($errno)");
            }
            
            // Enable TLS for port 587
            if ($this->smtpPort == 587) {
                stream_set_blocking($socket, true);
                $this->smtpCommand($socket, "EHLO localhost");
                $this->smtpCommand($socket, "STARTTLS");
                stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            }
            
            $this->smtpCommand($socket, "EHLO localhost");
            $this->smtpCommand($socket, "AUTH LOGIN");
            $this->smtpCommand($socket, base64_encode($this->smtpUser));
            $this->smtpCommand($socket, base64_encode($this->smtpPass));
            $this->smtpCommand($socket, "MAIL FROM:<{$this->fromEmail}>");
            $this->smtpCommand($socket, "RCPT TO:<{$to}>");
            $this->smtpCommand($socket, "DATA");
            
            fwrite($socket, $headers . "\r\n" . $body . "\r\n.\r\n");
            fgets($socket, 512);
            
            $this->smtpCommand($socket, "QUIT");
            fclose($socket);
            
            if ($this->debug) {
                error_log("Email sent via SMTP to $to: success");
            }
            
            return true;
            
        } catch (Exception $e) {
            if ($this->debug) {
                error_log("SMTP Error: " . $e->getMessage());
            }
            return false;
        }
    }
    
    private function smtpCommand($socket, $command) {
        fwrite($socket, $command . "\r\n");
        return fgets($socket, 512);
    }
    
    /**
     * Verification email template
     */
    private function getVerificationEmailTemplate($firstName, $verifyUrl) {
        return '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0a0a0a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px; border: 1px solid rgba(212, 175, 95, 0.2); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid rgba(212, 175, 95, 0.1);">
                            <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; color: #d4af5f; letter-spacing: 2px;">FRAGRANZA</h1>
                            <p style="margin: 8px 0 0; color: #888; font-size: 12px; letter-spacing: 3px;">OLIO</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 20px;">Welcome, ' . htmlspecialchars($firstName) . '!</h2>
                            <p style="color: #b0b0b0; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                                Thank you for creating an account with Fragranza Olio. Please verify your email address to complete your registration and unlock all features.
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="' . $verifyUrl . '" style="display: inline-block; background: linear-gradient(135deg, #d4af5f 0%, #b8963f 100%); color: #000000; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
                                    Verify Email Address
                                </a>
                            </div>
                            
                            <p style="color: #888; font-size: 14px; line-height: 1.5; margin: 30px 0 0;">
                                If the button doesn\'t work, copy and paste this link into your browser:
                            </p>
                            <p style="color: #d4af5f; font-size: 12px; word-break: break-all; margin: 10px 0 0;">
                                ' . $verifyUrl . '
                            </p>
                            
                            <p style="color: #666; font-size: 13px; margin: 30px 0 0;">
                                This link expires in 24 hours. If you didn\'t create an account, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: rgba(0,0,0,0.3); border-top: 1px solid rgba(212, 175, 95, 0.1);">
                            <p style="color: #666; font-size: 12px; margin: 0; text-align: center;">
                                © 2026 Fragranza Olio. Blk 16 Lot1-A Brgy San Dionisio, Dasmariñas, Cavite
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>';
    }
    
    /**
     * Password reset email template
     */
    private function getPasswordResetTemplate($firstName, $resetUrl) {
        return '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0a0a0a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px; border: 1px solid rgba(212, 175, 95, 0.2); overflow: hidden;">
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid rgba(212, 175, 95, 0.1);">
                            <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; color: #d4af5f; letter-spacing: 2px;">FRAGRANZA</h1>
                            <p style="margin: 8px 0 0; color: #888; font-size: 12px; letter-spacing: 3px;">OLIO</p>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 20px;">Reset Your Password</h2>
                            <p style="color: #b0b0b0; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                                Hi ' . htmlspecialchars($firstName) . ', we received a request to reset your password. Click the button below to create a new password.
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="' . $resetUrl . '" style="display: inline-block; background: linear-gradient(135deg, #d4af5f 0%, #b8963f 100%); color: #000000; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
                                    Reset Password
                                </a>
                            </div>
                            
                            <p style="color: #888; font-size: 14px; line-height: 1.5; margin: 30px 0 0;">
                                If the button doesn\'t work, copy and paste this link:
                            </p>
                            <p style="color: #d4af5f; font-size: 12px; word-break: break-all; margin: 10px 0 0;">
                                ' . $resetUrl . '
                            </p>
                            
                            <p style="color: #666; font-size: 13px; margin: 30px 0 0;">
                                This link expires in 1 hour. If you didn\'t request this, please ignore this email.
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 30px 40px; background-color: rgba(0,0,0,0.3); border-top: 1px solid rgba(212, 175, 95, 0.1);">
                            <p style="color: #666; font-size: 12px; margin: 0; text-align: center;">
                                © 2026 Fragranza Olio. Blk 16 Lot1-A Brgy San Dionisio, Dasmariñas, Cavite
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>';
    }
    
    /**
     * Order confirmation email template
     */
    private function getOrderConfirmationTemplate($customerName, $orderData) {
        $itemsHtml = '';
        foreach ($orderData['items'] ?? [] as $item) {
            $itemsHtml .= '
            <tr>
                <td style="padding: 15px 0; border-bottom: 1px solid rgba(212, 175, 95, 0.1);">
                    <p style="color: #fff; margin: 0; font-size: 14px;">' . htmlspecialchars($item['product_name']) . '</p>
                    ' . (!empty($item['variation']) ? '<p style="color: #888; margin: 4px 0 0; font-size: 12px;">' . htmlspecialchars($item['variation']) . '</p>' : '') . '
                </td>
                <td style="padding: 15px 0; border-bottom: 1px solid rgba(212, 175, 95, 0.1); text-align: center; color: #888;">
                    x' . $item['quantity'] . '
                </td>
                <td style="padding: 15px 0; border-bottom: 1px solid rgba(212, 175, 95, 0.1); text-align: right; color: #d4af5f;">
                    ₱' . number_format($item['price'] * $item['quantity'], 2) . '
                </td>
            </tr>';
        }
        
        return '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0a0a0a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px; border: 1px solid rgba(212, 175, 95, 0.2); overflow: hidden;">
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid rgba(212, 175, 95, 0.1);">
                            <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; color: #d4af5f; letter-spacing: 2px;">FRAGRANZA</h1>
                            <p style="margin: 8px 0 0; color: #888; font-size: 12px; letter-spacing: 3px;">OLIO</p>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 40px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <div style="width: 60px; height: 60px; background: rgba(34, 197, 94, 0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                                    <span style="color: #22c55e; font-size: 28px;">✓</span>
                                </div>
                            </div>
                            
                            <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 10px; text-align: center;">Order Confirmed!</h2>
                            <p style="color: #888; font-size: 14px; margin: 0 0 30px; text-align: center;">
                                Order #' . htmlspecialchars($orderData['order_number']) . '
                            </p>
                            
                            <p style="color: #b0b0b0; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                                Hi ' . htmlspecialchars($customerName) . ', thank you for your order! We\'re preparing your items and will notify you when they\'re on the way.
                            </p>
                            
                            <!-- Order Items -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                                <tr>
                                    <td style="color: #888; font-size: 12px; text-transform: uppercase; padding-bottom: 10px;">Item</td>
                                    <td style="color: #888; font-size: 12px; text-transform: uppercase; padding-bottom: 10px; text-align: center;">Qty</td>
                                    <td style="color: #888; font-size: 12px; text-transform: uppercase; padding-bottom: 10px; text-align: right;">Price</td>
                                </tr>
                                ' . $itemsHtml . '
                            </table>
                            
                            <!-- Totals -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 10px 0; color: #888;">Subtotal</td>
                                    <td style="padding: 10px 0; text-align: right; color: #fff;">₱' . number_format($orderData['subtotal'] ?? 0, 2) . '</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; color: #888;">Shipping</td>
                                    <td style="padding: 10px 0; text-align: right; color: #fff;">' . ($orderData['shipping_fee'] == 0 ? 'FREE' : '₱' . number_format($orderData['shipping_fee'], 2)) . '</td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 0; color: #fff; font-weight: bold; font-size: 18px; border-top: 1px solid rgba(212, 175, 95, 0.2);">Total</td>
                                    <td style="padding: 15px 0; text-align: right; color: #d4af5f; font-weight: bold; font-size: 18px; border-top: 1px solid rgba(212, 175, 95, 0.2);">₱' . number_format($orderData['total_amount'] ?? 0, 2) . '</td>
                                </tr>
                            </table>
                            
                            <!-- QR Code & Barcode Section -->
                            <div style="margin: 30px 0; padding: 20px; background-color: rgba(212, 175, 95, 0.1); border-radius: 12px; border: 1px dashed rgba(212, 175, 95, 0.3);">
                                <p style="color: #d4af5f; font-size: 14px; font-weight: bold; text-align: center; margin: 0 0 15px;">Pickup Verification Codes</p>
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center" style="padding: 10px;">
                                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&bgcolor=1a1a1a&color=d4af5f&data=' . urlencode('FRAGRANZA|' . $orderData['order_number'] . '|' . ($orderData['invoice_number'] ?? '') . '|' . ($orderData['total_amount'] ?? 0) . '|' . $customerName) . '" alt="QR Code" style="width: 100px; height: 100px;" />
                                            <p style="color: #888; font-size: 11px; margin: 8px 0 0;">QR Code</p>
                                        </td>
                                        <td align="center" style="padding: 10px;">
                                            <img src="https://bwipjs-api.metafloor.com/?bcid=code128&text=' . urlencode($orderData['order_number']) . '&scale=2&height=12&includetext&backgroundcolor=1a1a1a&barcolor=d4af5f&textcolor=d4af5f" alt="Barcode" style="height: 50px; width: auto;" />
                                            <p style="color: #888; font-size: 11px; margin: 8px 0 0;">Barcode</p>
                                        </td>
                                    </tr>
                                </table>
                                <p style="color: #888; font-size: 12px; text-align: center; margin: 15px 0 0;">Present either code to the cashier for quick pickup verification</p>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="https://fragranza-web.vercel.app/orders" style="display: inline-block; background: linear-gradient(135deg, #d4af5f 0%, #b8963f 100%); color: #000000; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 13px; letter-spacing: 1px;">
                                    Track Order
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 30px 40px; background-color: rgba(0,0,0,0.3); border-top: 1px solid rgba(212, 175, 95, 0.1);">
                            <p style="color: #666; font-size: 12px; margin: 0; text-align: center;">
                                © 2026 Fragranza Olio. Questions? Contact us at fragranzaolio@gmail.com
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>';
    }
}

// Helper function to get email service instance
function getEmailService() {
    static $instance = null;
    if ($instance === null) {
        $instance = new EmailService();
    }
    return $instance;
}
