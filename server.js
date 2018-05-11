//  OpenShift sample Node application
var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
  ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
var serviceSocket = null;
var p2s = {};
var s2p = {};
var net = require('net');
function clear(peerSocket) {
  p2s[s2p[peerSocket]] = undefined;
  s2p[peerSocket] = undefined;
}
var server = net.createServer(function (peerSocket) {
  peerSocket.on('close', function (message) {
    if (peerSocket == serviceSocket)
      serviceSocket = undefined;
    else if (serviceSocket && s2p[peerSocket] ) {
      serviceSocket.write(s2p[peerSocket] + 'close');
      clear(peerSocket);
    }
  });
  peerSocket.on('end', function (message) {
    if (peerSocket == serviceSocket)
      serviceSocket = undefined;
    else if (serviceSocket &&s2p[peerSocket]) {
      serviceSocket.write(s2p[peerSocket] + 'end');
      clear(peerSocket);
    }
  });
  peerSocket.on('error', function (message) {
    clear(peerSocket);
  });
  peerSocket.on('data', function (message) {
    console.log(message.toString());
    if (!serviceSocket && message.indexOf("POST /") >= 0) {
      serviceSocket = peerSocket;
      serviceSocket.write(
'HTTP/1.0 200 OK\r\n\
Content-Type: text/html; charset=UTF-8\r\n\
Connection: keep-alive\r\n\
Content-Length: 0\r\n\r\n');
      serviceSocket.on('data', function (data) {
        if (data.toString().substring(2) == "end") {
          p2s[data.toString().substring(0, 2)].end();
          clear(p2s[data.toString().substring(0, 2)]);
        } else if (data.toString().substring(2) == "close") {
          p2s[data.toString().substring(0, 2)].close();
          clear(p2s[data.toString().substring(0, 2)]);
        } else {
          p2s[data.toString().substring(0, 2)].write(data.toString().substring(2));
        }
      });
    } else if (serviceSocket != peerSocket && serviceSocket) {
      var port = String.fromCharCode(((peerSocket.remotePort >> 8) & 255)) + String.fromCharCode(((peerSocket.remotePort) & 255));
      p2s[port] = peerSocket;
      s2p[peerSocket] = port;
      serviceSocket.write(port + message);
    }
  });
});
server.listen(port, ip);
console.log('Server accepting connection on port: ' +ip+':'+port);
