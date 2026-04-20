<?php
/**
 * Mailer Utility — Hao Blog
 * Sends emails using PHPMailer (SMTP configuration)
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Load PHPMailer files
require_once __DIR__ . '/PHPMailer/src/Exception.php';
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';

// Mail config from .env (config.php must be loaded by caller via db.php)
if (!defined('MAIL_FROM')) {
    define('MAIL_FROM', $_ENV['SMTP_USER'] ?? 'contact@nguyenvanhao.name.vn');
}
if (!defined('MAIL_FROM_NAME')) {
    define('MAIL_FROM_NAME', $_ENV['MAIL_FROM_NAME'] ?? 'Nguyễn Văn Hảo Blog');
}

class Mailer {
    
    /**
     * Get a configured PHPMailer instance
     */
    private static function getMailer() {
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = $_ENV['SMTP_HOST'] ?? 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = $_ENV['SMTP_USER'] ?? '';
            $mail->Password   = $_ENV['SMTP_PASS'] ?? '';
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            $mail->Port       = $_ENV['SMTP_PORT'] ?? 465;
            $mail->CharSet    = 'UTF-8';
            
            // Bypass self-signed cert issues on localhost/shared hosting
            $mail->SMTPOptions = array(
                'ssl' => array(
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                )
            );
            
            $mail->setFrom($mail->Username ?: MAIL_FROM, MAIL_FROM_NAME);
            return $mail;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Send a single HTML email
     */
    static function send($to, $subject, $body, $replyTo = null) {
        $mail = self::getMailer();
        if (!$mail) return false;
        
        try {
            if ($replyTo) {
                $mail->addReplyTo($replyTo);
            }
            $mail->addAddress($to);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = self::wrapTemplate($subject, $body);
            $mail->AltBody = strip_tags($body);
            
            return $mail->send();
        } catch (Exception $e) {
            error_log("Email error: {$mail->ErrorInfo}");
            return false;
        }
    }
    
    /**
     * Send email to multiple recipients (newsletter)
     * Returns array of results
     */
    static function dispatchMultiple($recipients, $subject, $body) {
        $results = ['sent' => 0, 'failed' => 0, 'errors' => []];
        $mail = self::getMailer();
        if (!$mail) return $results;
        
        try {
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = self::wrapTemplate($subject, $body);
            $mail->AltBody = strip_tags($body);
            
            // Keep connection alive for bulk sending
            $mail->SMTPKeepAlive = true;
            
            foreach ($recipients as $email) {
                try {
                    $mail->addAddress($email);
                    if ($mail->send()) {
                        $results['sent']++;
                    } else {
                        $results['failed']++;
                        $results['errors'][] = $email;
                    }
                    $mail->clearAddresses(); // clear for next iteration
                    usleep(500000); // 500ms delay to prevent rate limit
                } catch (Exception $e) {
                    $results['failed']++;
                    $results['errors'][] = $email;
                    $mail->clearAddresses();
                }
            }
            $mail->smtpClose();
        } catch (Exception $e) {
            error_log("Bulk mail error: " . $e->getMessage());
        }
        
        return $results;
    }
    
    /**
     * Send notification to admin about new contact submission
     */
    static function notifyNewContact($name, $email, $subject, $message) {
        $adminEmail = MAIL_FROM;
        $mailSubject = "📬 Tin nhắn mới từ {$name}";
        
        $body = "
            <div style='margin-bottom:20px;'>
                <strong style='color:#64748b;font-size:12px;text-transform:uppercase;'>Từ</strong><br>
                <span style='font-size:16px;'>{$name} ({$email})</span>
            </div>
            <div style='margin-bottom:20px;'>
                <strong style='color:#64748b;font-size:12px;text-transform:uppercase;'>Chủ đề</strong><br>
                <span style='font-size:16px;'>" . ($subject ?: '(Không có chủ đề)') . "</span>
            </div>
            <div style='margin-bottom:20px;'>
                <strong style='color:#64748b;font-size:12px;text-transform:uppercase;'>Tin nhắn</strong><br>
                <div style='background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin-top:8px;white-space:pre-wrap;line-height:1.6;'>
                    " . nl2br(htmlspecialchars($message)) . "
                </div>
            </div>
        ";
        
        return self::send($adminEmail, $mailSubject, $body, $email);
    }
    
    /**
     * Wrap email content in a responsive HTML template
     */
    static function wrapTemplate($title, $content) {
        return "
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>{$title}</title>
</head>
<body style='margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;'>
    <table width='100%' cellpadding='0' cellspacing='0' style='background:#f1f5f9;padding:32px 16px;'>
        <tr>
            <td align='center'>
                <table width='600' cellpadding='0' cellspacing='0' style='max-width:600px;width:100%;'>
                    <tr>
                        <td style='text-align:center;padding:24px 0;'>
                            <span style='display:inline-block;width:40px;height:40px;background:#22C55E;color:#fff;font-weight:bold;font-size:20px;line-height:40px;border-radius:10px;'>H</span>
                            <span style='font-size:18px;font-weight:700;color:#0f172a;margin-left:8px;vertical-align:middle;'>Nguyễn Văn Hảo</span>
                        </td>
                    </tr>
                    <tr>
                        <td style='background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);'>
                            {$content}
                        </td>
                    </tr>
                    <tr>
                        <td style='text-align:center;padding:24px 0;color:#94a3b8;font-size:13px;'>
                            <p style='margin:0 0 8px;'>© " . date('Y') . " nguyenvanhao.name.vn</p>
                            <p style='margin:0;'>Email này được gửi qua SMTP Server</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
    }
}
?>
