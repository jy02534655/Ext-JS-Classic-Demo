var http = require('http'),
    qs = require('querystring'),
    fs = require('fs'),
    MAX_FILE_SIZE = 5 * 1024 * 1024,
    port  = process.env.PORT || 8080,
    server;

function respond(response, code, data, headers, encoding) {
    response.writeHead(code, headers);
    response.end(data, encoding);
}

server = http.createServer(function (request, response) {
    var rawBody = '';

    if (request.method === 'POST') {
        request.on('data', function (data) {
            if (rawBody.length <= MAX_FILE_SIZE) {
                rawBody += data;
            } else {
                respond(response, 413, 'Request entity too large.');
            }
        });

        request.on('end', function () {
            var body, content, charset;

            try {
                body = qs.parse(rawBody);
            } catch (e) {
                console.error('Parsing request data failed.', e);
            }

            if ( !body || !body.content || !body.filename || !/^[-\w]+\/[-\w\+\.]+$/.test(body.mime) || !/^[-\.\w]+[\.]?[-\w]+$/.test(body.filename) ) {
                respond(response, 400, 'Bad request.');
                return;
            }

            content = new Buffer(body.content, 'base64');
            charset = body.charset || 'UTF-8';

            respond(response, 200, content.toString('utf8'), {
                'Content-Type': body.mime || 'application/octet-stream',
                'Content-Disposition': 'attachment; filename="' + body.filename + '"',
                'Content-Transfer-Encoding': 'binary',
                'Cache-Control': 'public',
                'Expires': 0
            }, charset);

        });
    }
    else if(request.method === 'GET') {
      respond(response, 200, 'server running...');
    }
    else {
      respond(response, 400, "Bad request.");
    }
}).listen(port, function(){
    console.log('Listening on port %d', server.address().port);
});
