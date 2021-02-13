import express from 'express'
import WebSocket, { Server } from 'ws'
import {v4 as uuid} from 'uuid';

const PORT = process.env.PORT || 3000
const INDEX = '/index.html'

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`))

const wss = new Server({ server })

interface Entry {
  charName: string;
  accountName: string;
  spec: number;
  race: number;
  player: {
    x: number;
    y: number;
  }
}

const mappedCharacters: {[k: string]: Entry} = {};

wss.on('connection', (ws: WebSocket & {id: string}) => {
  ws.id = uuid();
  ws.on('message', (message) => {
    try {
      const data = message.toString();
      const json = JSON.parse(data);
      if (json.source === 'dessa' && json.type === 'character') {
        mappedCharacters[ws.id] = json.data;
      }
    } catch {
      // Ignore malformed data
    }
  });
  ws.on('close', () => {
    delete mappedCharacters[ws.id];
  })
})

setInterval(() => {
  wss.clients.forEach((client) => {
    client.send(JSON.stringify(mappedCharacters))
  })
}, 1000)
