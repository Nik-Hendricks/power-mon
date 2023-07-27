const express = require('express');
const app = express();
const path = require('path');
const nedb = require('nedb');

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
        this.db = this.init_db();
    }

    init_db(){
      return {
        devices: new nedb({filename: 'devices.db', autoload: true}),
      }
    }

    register_express_events(){
        const publicPath = path.join(__dirname, 'public');
        app.use(express.static(publicPath));
        
        app.get('/', (req, res) => {
          res.sendFile(path.join(publicPath, 'index.html'));
        });

        app.get('/devices', (req, res) => {
          this.db.devices.find({}, (err, docs) => {
            if (err) {
              // Handle error here
              res.status(500).json({ error: 'An error occurred' });
            } else {
              const excludedFields = ['_id'];
              const filteredDocs = docs.map((doc) => {
              const filteredDoc = { ...doc };
                excludedFields.forEach((field) => delete filteredDoc[field]);
                return filteredDoc;
              });
          
              res.json(filteredDocs);
            }
          });
        })

        app.get('/data_query', (req, res) => {
          this.PMP.query_data(this.PMP.devices[0], (e) => {
            console.log("CALLBACK")
            res.json(e.message.split("\n")[1])
          })
        })

        app.get('/data_query_all', (req, res) => {
          
        })

        app.get('/update_device_db', (req, res) => {
          this.update_device_db();
          res.send("OK");
        })
    }

    update_device_db(){
        //this.PMP.devices.forEach((device) => {
          [
            {
              address: "192.0.0.0",
              port: 12121,
              type: "ipv4"
            },
            {
              address: "192.10.0.0",
              port: 12121,
              type: "ipv4"
            }
          ].forEach((device) => {
            this.db.devices.update({address: device.address}, device, {upsert: true})
            this.db.devices.persistence.compactDatafile();
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
//events are designated by a single bit sent at the beginning of the message
// r = register
// c = command
// d = data
// g = good

class PMP{ //Power Management Protocol
    constructor(){
        this.bind_address = '0.0.0.0';
        this.port = 12121;
        this.socket = dgram.createSocket('udp4');
        this.devices = [];
        this.listeners = [];
        this.udp_messages = [];
        this.events = {
            'r': this.register,
            'c': this.command,
            'd': this.data,
            'g': this.good,
        }

    }

    register(e){
      delete e.remote.size;
      //check if device is already registered if not add it to the list
      var device_exists = false
      this.devices.forEach((device) => {
        if(JSON.stringify(device) == JSON.stringify(e.remote)){
          device_exists = true;
        }        
      })

      if(device_exists == false){
        this.devices.push(e.remote);
      }

      this.send(`g ${e.message.split(" ")[1]}`, e.remote.address, e.remote.port);
    }

    //PMP Core
    command(e){
      console.log(e);
    }

    data(e){
      console.log(e);
    }

    good(e){
      this.remove_udp_message(e.message.split(" ")[1]); //remove message from message stack
      this.listeners.forEach((listener) => {
        listener(e);
      })
    }

    query_data(device, callback){
      // here we will send a query to the device and call the callback with the data when we receive a good message
      var tag = this.generate_tag();
      this.send(`d ${tag}`, device.address, device.port);
      this.listeners.push((e) => {
        var msg_tag = e.message.split(" ")[1].replace(/\s/g, '');
        if(msg_tag == tag){
          //this.send_once(`g ${tag}`, device.address, device.port);
          callback(e);
        }
      })
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
            }
        })

            // Handle errors
        this.socket.on('error', (err) => {
            console.error('UDP socket error:\n', err.stack);
            this.socket.close();
        });


        setInterval(() => {
            for(var i = 0; i < this.udp_messages.length; i++){
              var message = this.udp_messages[i];
              if(typeof message !== 'undefined'){
                var tag = message.tag;
                var HOST = message.HOST;
                var PORT = message.PORT;
                var message = message.message;
                this.socket.send(message, PORT, HOST, (err) => {
                  if(err){
                    console.log(err);
                  }else{
                    console.log(`Sent: ${message} to ${HOST}:${PORT}`);
                  }
                })
              }
            }
        }, 2000)
    }

    remove_udp_message(tag){
      tag = tag.replace(/\s/g, ''); //remove all spaces a newline characters
      console.log(`removing message with tag ${tag}`)
      for(var i = 0; i < this.udp_messages.length; i++){
        if(typeof this.udp_messages[i] !== 'undefined'){
          if(this.udp_messages[i].tag == tag){
            delete this.udp_messages[i];
            console.log("Message removed")
          }
        }
      }
    }

    send_once(message, HOST, PORT){
      var tag = message.split(" ")[1];
      console.log(tag)
      this.socket.send(message, PORT, HOST, (err) => {
        if(err){
          console.log(err);
        }else{
          console.log(`Sent: ${message} to ${HOST}:${PORT}`);
        }
      })
    }

    send(message, HOST, PORT){
      var tag = message.split(" ")[1];
      this.udp_messages.push({message: message, tag: tag, HOST: HOST, PORT: PORT});
    }
}

new Server().start();