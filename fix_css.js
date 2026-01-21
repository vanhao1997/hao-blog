const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'css', 'style.css');
const sliderPath = path.join(__dirname, 'css', 'slider_clean.css');

try {
    let cssContent = fs.readFileSync(cssPath, 'utf8');
    const sliderContent = fs.readFileSync(sliderPath, 'utf8');

    // Find the corruption point
    const splitKey = 'box-shadow: 3px 3px 0px var(--color-gray);';
    const parts = cssContent.split(splitKey);

    if (parts.length >= 2) {
        // Keep the first part and the split key
        let newContent = parts[0] + splitKey + '\n}\n\n' + sliderContent;
        fs.writeFileSync(cssPath, newContent, 'utf8');
        console.log('CSS fixed successfully.');
    } else {
        console.log('Could not find split key, checking line count');
        // Fallback: Line based
        const lines = cssContent.split('\n');
        if (lines.length > 1814) {
            const truncated = lines.slice(0, 1814).join('\n');
            const finalContent = truncated + '\n}\n\n' + sliderContent;
            fs.writeFileSync(cssPath, finalContent, 'utf8');
            console.log('CSS fixed via truncation.');
        } else {
            console.error('File too short or unexpected format.');
        }
    }
} catch (e) {
    console.error('Error fixing CSS:', e);
}
