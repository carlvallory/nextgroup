const qrcode = require('qrcode-terminal');
const axios = require('axios');
const http = require('http');
const url = require('url');
const { Client, NoAuth } = require('whatsapp-web.js');
const querystring = require('querystring');
const FormData = require('form-data');


const API_KEY = process.env.API_KEY || "";
const RECEIVER_URL = process.env.WA_RECEIVER_URL;
const RECEIVER_PATH = process.env.WA_RECEIVER_PATH;
const HOSTNAME = process.env.HTTP_HOSTNAME;
const PORT = process.env.HTTP_PORT || 3097;

const laramsgURL = "http://phplaravel-1040427-3658816.cloudwaysapps.com/msg";

const client = new Client(
    {
        authStrategy: new NoAuth(),
        puppeteer: {
            args: ['--no-sandbox'],
        }
    }
);

let msgObj = { 
    updated: false,
    msg: {
        id: null,
        body: {
            text: "",
            image: null
        },
        image: null,
        to: {
            id: null,
            name: null,
            user: null
        },
        from: {
            id: null,
            name: null,
            user: null,
            image: null
        },
        profile: {
            picture: null
        },
        author: null,
        participant: false
    },
    data: null,
    params: null
};

let bodyObj = { 
    object: {
        id: null,
        fechaOperacion: "",
        horaSalida: "",
        observacion: null,
        detalleCobertura: {
            ciudad: null,
            destino: null,
            seccion: null,
            medio: null,
            motivo: null,
            horaCobertura: ''
        },
        detalleFoto: {
            nombre: null,
            monto: ''
            
        },
        ordenViaticos: {
            monto: ''
        },
        ordenTransportes: {
            movil: null,
            conductor: null,
            monto: ''
        },
        autorizacionCoberturas: {
            usuario: null
        },
        mensajeHtml: null,
        mensajeWhatsapp: null
    },
    updated: false
};

client.on('qr', async (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, {small: true});
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', async () => {
    msgObj.msg.to.id    = client.info.wid.user;
    msgObj.msg.to.user  = client.info.wid.user;
    msgObj.msg.to.name  = client.info.wid.name;

    console.log(client.info.wid.user);
    console.log('Client is Ready');
});

client.on('message', async msg => {
    const isBroadcast = msg.broadcast || msg.isStatus;

    if(msg.type != "sticker" && msg.type != "image" && msg.type != "video"){
        if(msg.hasMedia == false){
            //type chat
            if(msg.type == "chat"){
                const contact = await msg.getContact();
                const profilePicture = await contact.getProfilePicUrl();

                msgObj.msg.id           = msg.id.id;
                msgObj.msg.body.text    = msg.body;
                msgObj.msg.to.id        = msg.to;
                msgObj.msg.from.id      = msg.from;
                msgObj.data             = null;

                if(msg._data.notifyName !== undefined) { 
                    msgObj.msg.from.name = msg._data.notifyName;
                } else {
                    msgObj.msg.from.name = msg.from;
                }

                if(profilePicture !== undefined) { 
                    msgObj.msg.profile.picture = profilePicture;
                } else {
                    msgObj.msg.profile.picture = null;
                }

                msgObj.msg.author       = msg.author;
                msgObj.msg.participant  = msg.id.participant;
                msgObj.updated = true;
                
                console.log('ID: ', msg.id.id);
                //console.log(msg);

                if(isBroadcast == false) {
                    let getMsg = await getSendMsg(msg.id.id, msgObj.msg.body.text, msgObj);
                    console.log(getMsg);
                }
            }
        }

    }
});

client.on('disconnected', (reason) => {
    console.log('Client is disconected: ', reason);
    client.initialize();
});

client.initialize();

(async() => {
    msgObj.msg.id               = 1;
    msgObj.msg.body.text        = "Muy Buenos Días!!!";
    msgObj.msg.to.id            = 10;
    msgObj.msg.from.id          = 11;
    msgObj.msg.from.user        = "595971374403@c.us";
    msgObj.msg.from.name        = "name";
    msgObj.msg.author           = "";
    msgObj.msg.participant      = false;
    msgObj.msg.profile.picture  = null;

    let getMsg = await getSendMsg(msgObj.msg.id, msgObj.msg.body.text, msgObj);
    
    console.log(getMsg);
  })()


async function getSendMsg(id, body, msgObj) {
    let author = null;
    let name = null;
    let profilePicture = null;
    
    if(msgObj.msg.from.id !== null && msgObj.msg.from.id !== undefined) {
        
    }

    if(msgObj.msg.to.id !== null && msgObj.msg.to.id !== undefined) {
        
    }

    if(msgObj.msg.from.name !== null && msgObj.msg.from.name !== undefined) {
        name = msgObj.msg.from.name;
    }

    if(msgObj.msg.profile.picture !== null && msgObj.msg.profile.picture !== undefined) {
        profilePicture = msgObj.msg.profile.profilePicture;
    }

    if(msgObj.msg.author !== null && msgObj.msg.author !== undefined) {
        author = msgObj.msg.author;        
    }

    client.sendMessage(msgObj.msg.from.user, body);

    return true;

}


process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection:', error);
});

const server = http.createServer((req, res) => {
    const baseURL =  req.protocol + '://' + req.headers.host + '/';
    const reqUrl = new URL(req.url,baseURL);

    if(reqUrl.pathname == "/msg") {
        client.getState().then((result) => {
            if(result.match("CONNECTED")){
                var q = url.parse(req.url, true).query;
                //var user = q.user;
                
                res.end(JSON.stringify({ status: 200, message: 'Log Out Success'}));
            } else {
                console.error("Whatsapp Client not connected");

                res.end(JSON.stringify({ status: 500, message: 'Client State Null'}));
            }
        });
    }
    
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end();
}).listen(PORT); 