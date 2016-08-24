const fs = require('fs');
const Hapi = require('hapi');
const UUID = require('uuid');
const Path = require('path');
const server = new Hapi.Server();
server.connection({
  port: 8081,
  routes: { cors: true}}
);

server.route({
  method: 'POST',
  path: '/submit',
  config: {
    payload: {
      output: 'stream',
      parse: true,
      maxBytes: 26214400, //limit to 25MB
      allow: 'multipart/form-data'
    },

    handler: function (request, reply) {
      const payload = request.payload;
      console.log('---got stuff1', payload);
      console.log('---got stuff2', payload.file.hapi.headers);
      console.log('---got stuff3', request.payload.file);

      const file = request.payload.file;

      if (!file || !file.hapi || !file.hapi.filename) {
        return reply('Bad Request');
      }

      const filename = `${ UUID.v4() }${ Path.extname(file.hapi.filename).toLowerCase() }`; //generate GUID with same file extension

      console.log('---fileToCreate', filename);
      const path = `${__dirname}/uploads/${filename}`;
      const fileToCreate = fs.createWriteStream(path);

      fileToCreate.on('error', function (err) {
        console.error('error: ', err);
      });

      payload.file.on('end', function (err) {
        const response = {
          newFilename: filename,
          originalFilename: file.hapi.filename,
          uploadedAt: new Date().toISOString()
        }
        console.log('---done', response);
        reply(JSON.stringify(response));
      });

      payload.file.pipe(fileToCreate);
    }
  }
});

server.start(function () {
    console.log('info', 'Server running at: ' + server.info.uri);
});
