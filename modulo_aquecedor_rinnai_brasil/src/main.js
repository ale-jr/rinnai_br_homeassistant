const fs = require("fs");
const rawOptions = fs.readFileSync('/data/options.json', 'utf8');

const requestListener = function (req, res) {
    res.writeHead(200);
    const data = fs.readFileSync('/data/options.json', 'utf8');
    res.end(data);
}

const server = http.createServer(requestListener);
server.listen(8000).then(()=>);