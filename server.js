const express = require('express');
const app = express();
const path = require('path');

const dgram = require('dgram');

// Create a UDP socket
const udpSocket = dgram.createSocket('udp4');

const HTTP_PORT = 3000;
const UDP_PORT = 12121;
const UDP_BIND_ADDRESS = '0.0.0.0';

class Server{
    constructor(){
        this.PMP = new PMP();
        this.register_express_events();
        
    }

    register_express_events(){
        const publicPath = path.join(__dirname, 'public');
        app.use(express.static(publicPath));
        
        app.get('/', (req, res) => {
          res.sendFile(path.join(publicPath, 'index.html'));
        });

        app.get('/devices', (req, res) => {

        })
    }

    start(){
        app.listen(HTTP_PORT, () => {
            console.log(`Server started on http://localhost:${HTTP_PORT}`);
        });

        this.PMP.start();
    }
}

//Power Management Protocol
//events are designated by a single byte sent at the beginning of the message
// p = ping
// s = status
// c = command
// d = data

class PMP{ //Power Management Protocol
    constructor(){
        this.bind_address = '0.0.0.0';
        this.port = 12121;
        this.socket = dgram.createSocket('udp4');
        this.devices = []
        this.events = {
            'r': this.register,
            'p': this.ping,
            's': this.status,
            'c': this.command,
            'd': this.data,
        }

    }

    register(e){
      //this.devices.push(e);
      //this.send(`r ${this.generate_tag()}`, e.remote.address, e.remote.port);
      console.log(e)
    }

    ping(e){
      console.log(e)
    }

    status(e){
      console.log(e)
      //
    }

    command(e){
      console.log(e)
    }

    data(e){
      console.log(e)
    }

    generate_tag(){
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    start(){
        this.socket.bind(this.port, this.bind_address, () => {
            console.log(`UDP server listening on ${this.bind_address}:${this.port}`);
        });

        // Listen for incoming messages
        this.socket.on('message', (message, remote) => {
            message = message.toString();
            var event = message.split(' ')[0];
            if(this.events.hasOwnProperty(event)){
              this.events[event].bind(this, { message, remote })()
            }else{
              console.log("Not a valid PMP event");
              console.log(event)
            }
        })

            // Handle errors
        this.socket.on('error', (err) => {
            console.error('UDP socket error:\n', err.stack);
            this.socket.close();
        });
    }

    send(message, HOST, PORT){
        this.socket.send(message, 0, message.length, PORT, HOST, (err) => {
            if (err) {
                console.error(err);
            }
        });
    }
}

new Server().start();