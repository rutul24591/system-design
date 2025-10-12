// This file uses y-websocket's setup utility to create a websocket server.
const WebSocket = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');
const Y = require('yjs');
const url = require('url');

const persistence = require('./services/persistence');

function setupWebsocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (conn, req) => {
    // Optional: validate auth here (cookie header/jwt)
    // Load saved document state from persistence if needed

    setupWSConnection(conn, req, {
      // optional gc: false, or provide a docMap
      persist: {
        bindState: async (docName, ydoc) => {
          // load snapshot from Mongo if available
          const snapshot = await persistence.loadSnapshot(docName);

          if (snapshot) {
            const uint8 = Buffer.from(snapshot, 'base64');
            Y.applyUpdate(ydoc, uint8);
          }
        },
        writeState: async (docName, ydoc) => {

        }
      }
    })
  })
}

module.exports = { setupWebsocket };