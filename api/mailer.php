<?php
/**
 * Mailer Utility — Hao Blog
 * Sends emails using PHP mail() function (works natively on cPanel)
 */

// Mail config from .env (config.php must be loaded by caller via db.php)
if (!defined('MAIL_FROM')) {
    define('MAIL_FROM', $_ENV['MAIL_FROM'] ?? 'contact@nguyenvanhao.name.vn');
}
if (!defined('MAIL_FROM_NAME')) {
    define('MAIL_FROM_NAME', $_ENV['MAIL_FROM_NAME'] ?? 'Nguyễn Văn Hảo Blog');
}

class Mailer {
    
    /**
     * Send a single HTML email
     */
    static function send($to, $subject, $body, $replyTo = null) {
        $fromEmail = MAIL_FROM;
        $fromName = MAIL_FROM_NAME;
        
        $headers = [];
        $headers[] = "MIME-Version: 1.0";
        $headers[] = "Content-Type: text/html; charset=UTF-8";
        $headers[] = "From: {$fromName} <{$fromEmail}>";
        $headers[] = "Return-Path: {$fromEmail}";
        $headers[] = "X-Mailer: HaoBlog/1.0";
        
        if ($replyTo) {
            $headers[] = "Reply-To: {$replyTo}";
        }
        
        $htmlBody = self::wrapTemplate($subject, $body);
        
        $result = mail($to, "=?UTF-8?B?" . base64_encode($subject) . "?=", $htmlBody, implode("\r\n", $headers), "-f{$fromEmail}");
        
        return $result;
    }
    
    /**
     * Send email to multiple recipients (newsletter)
     * Returns array of results
     */
    static function sendBulk($recipients, $subject, $body) {
        $results = ['sent' => 0, 'failed' => 0, 'errors' => []];
        
        foreach ($recipients as $email) {
            $success = self::send($email, $subject, $body);
            if ($success) {
                $results['sent']++;
            } else {
                $results['failed']++;
                $results['errors'][] = $email;
            }
            // Small delay to avoid rate limiting
            usleep(100000); // 100ms
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
            <div style='text-align:center;margin-top:24px;'>
                <a href='https://nguyenvanhao.name.vn/admin/newsletter.html' style='display:inline-block;padding:12px 24px;background:#22C55E;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;'>
                    📧 Xem trong Admin Panel
                </a>
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
                    <!-- Header -->
                    <tr>
                        <td style='text-align:center;padding:24px 0;'>
                            <span style='display:inline-block;width:40px;height:40px;background:#22C55E;color:#fff;font-weight:bold;font-size:20px;line-height:40px;border-radius:10px;'>H</span>
                            <span style='font-size:18px;font-weight:700;color:#0f172a;margin-left:8px;vertical-align:middle;'>Nguyễn Văn Hảo</span>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style='background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);'>
                            {$content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style='text-align:center;padding:24px 0;color:#94a3b8;font-size:13px;'>
                            <p style='margin:0 0 8px;'>© 2026 nguyenvanhao.name.vn</p>
                            <p style='margin:0;'>Email này được gửi từ <a href='https://nguyenvanhao.name.vn' style='color:#22C55E;text-decoration:none;'>nguyenvanhao.name.vn</a></p>
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
