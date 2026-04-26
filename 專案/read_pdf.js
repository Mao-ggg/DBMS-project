const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('自動化排班系統_PRD_TA討論用.docx.pdf');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('prd.txt', data.text);
    console.log('PDF parsed and saved to prd.txt');
}).catch(function(err) {
    console.error('Error parsing PDF:', err);
});
