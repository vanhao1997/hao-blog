const fs = require('fs');
const path = require('path');

const directoryPath = __dirname;
const walk = function (dir, done) {
    let results = [];
    fs.readdir(dir, function (err, list) {
        if (err) return done(err);
        let i = 0;
        (function next() {
            let file = list[i++];
            if (!file) return done(null, results);
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (err, res) {
                        results = results.concat(res);
                        next();
                    });
                } else {
                    if (file.endsWith('.html')) {
                        results.push(file);
                    }
                    next();
                }
            });
        })();
    });
};

walk(directoryPath, function (err, results) {
    if (err) throw err;
    results.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let changed = false;

        // Public pages: Add menu link after "Công cụ"
        const publicMatch = /(<li><a\s+href="[^"]*toolkit\/?(?:index\.html)?"[^>]*>Công cụ<\/a><\/li>)/g;
        if (publicMatch.test(content) && !content.includes('showcase.html')) {
            content = content.replace(publicMatch, "$1\n                    <li><a href=\"/showcase.html\" class=\"nav-link\">Dự án</a></li>");
            changed = true;
        }

        // Public pages: Add menu link after "Liên hệ" in Footer (the ul.footer-links without nav-link class)
        const footerMatch = /(<li><a\s+href="[^"]*lien-he[^"]*">Liên hệ<\/a><\/li>)/g;
        // Check if the current file has footer-links structure
        if (footerMatch.test(content) && !content.includes('href="/showcase.html">Dự án')) {
            content = content.replace(footerMatch, "$1\n                        <li><a href=\"/showcase.html\">Dự án</a></li>");
            changed = true;
        }

        // Admin pages: Add menu link after "/admin/categories.html"
        const adminMatch = /(<a\s+href="\/admin\/categories\.html"[^>]*>.*?<\/a>)/g;
        // We completely skip the admin/projects.html file just in case
        if (file.includes('admin') && !file.includes('projects.html') && adminMatch.test(content)) {
            // remove existing corrupt ones and reset to clean state (we did git restore, so it should be clean, but just in case)
            if (!content.includes('/admin/projects.html')) {
                content = content.replace(adminMatch, "$1\n                <a href=\"/admin/projects.html\" class=\"nav-item\">🚀 Dự án (Showcase)</a>");
                changed = true;
            }
        }

        if (changed) {
            fs.writeFileSync(file, content, 'utf8');
            console.log("Updated: " + file);
        }
    });
});
