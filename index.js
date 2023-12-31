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
    group: {
        chat: {
            id: null,
            name: null
        }
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
    group: {
        chat: {
            id: null
        }
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
                    try{
                        // let getMsg = await getSendMsg(msg.id.id, msgObj.msg.body.text, msgObj);
                        // console.log(getMsg);
                        console.log("No Reply");
                    } catch(e) {
                        console.log("Error Occurred: ", e);
                    }
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

async function getSendMsg(id, body, msgObj) {
    try{
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

        let objResponse = await objectMsg2json(msgObj);
        let sendMessageData = false;
        let chatId = await getChatId("Pruebas");
            
        if(objResponse == false) {
            console.log(chatId);
            console.log(body);
            sendMessageData = await client.sendMessage(chatId, body);
        } else {
            console.log(chatId);
            if(objResponse.hasOwnProperty('object')) {
                if(objResponse.object.hasOwnProperty('mensajeWhatsapp')) {
                    console.log(objResponse.object.mensajeWhatsapp);
                    sendMessageData = await client.sendMessage(chatId, objResponse.object.mensajeWhatsapp);
                }
            }
        }

        return sendMessageData;
    } catch(e){
        console.log("Error Occurred: ", e);
    }
}

async function getSendMsgByPost(obj) {
    try { 
        let objResponse = await objectPost2json(obj);
        let sendMessageData = false;
        let chatId = await getChatId("Pruebas");

        if(objResponse == false) {
            console.log(chatId);
            console.log(objResponse.object.mensajeWhatsapp);
            sendMessageData = await client.sendMessage(chatId, objResponse.object.mensajeWhatsapp);
        } else {
            console.log(chatId);
            if(objResponse.hasOwnProperty('object')) {
                if(objResponse.object.hasOwnProperty('mensajeWhatsapp')) {
                    console.log(objResponse.object.mensajeWhatsapp);
                    sendMessageData = await client.sendMessage(chatId, objResponse.object.mensajeWhatsapp);
                    if(!sendMessageData != true) {
                        bodyObj.updated = false;
                    }
                }
            }
        }

        return sendMessageData;
    } catch(e){
        console.log("Error Occurred: ", e);
        console.log("l: 256");
        return false;
    }
}

async function getChatId(chatName) {
    const groupName = chatName;
    const chats = await client.getChats()
    const chatId = chats
        .filter(chat => chat.isGroup && chat.name == groupName)
        .map(chat => {
            return chat.id._serialized
        });

    return chatId;
}

async function objectMsg2json(obj) {
    if(isJson(obj.msg.body.text)) {
        let body = JSON.parse(obj.msg.body.text);
    } else {
        console.log("Error Occurred: ", "body is not json");
        console.log("l: 239");
        return false;
    }

    if(body.hasOwnProperty('object')) {
        if(body.object.hasOwnProperty('mensajeWhatsapp')) {
            console.log('object2json: evaluating');
        } else {
            console.log("Error Occurred: ", "mensajeWhatsapp doesnt exist");
            console.log("l: 248");
            return false;
        }

    } else {
        console.log("Error Occurred: ", "object doesnt exist")
        console.log("l: 247");
        return false;
    }

    if(bodyObj.updated == false) {
        bodyObj.object.id = body.id;
        bodyObj.object.fechaOperacion = body.fechaOperacion;
        bodyObj.object.horaSalida = body.horaSalida;
        bodyObj.object.observacion = body.observacion;

        bodyObj.object.detalleCobertura.ciudad = body.detalleCobertura.ciudad;
        bodyObj.object.detalleCobertura.destino = body.detalleCobertura.destino;
        bodyObj.object.detalleCobertura.seccion = body.detalleCobertura.seccion;
        bodyObj.object.detalleCobertura.medio = body.detalleCobertura.medio;
        bodyObj.object.detalleCobertura.motivo = body.detalleCobertura.motivo;
        bodyObj.object.detalleCobertura.horaCobertura = body.detalleCobertura.horaCobertura;

        bodyObj.object.detalleFoto.nombre = body.detalleFoto.nombre;
        bodyObj.object.detalleFoto.monto = body.detalleFoto.monto;
            
        bodyObj.object.ordenViaticos.monto = body.ordenViaticos.monto;

        bodyObj.object.ordenTransportes.movil = body.ordenTransportes.movil;
        bodyObj.object.ordenTransportes.conductor = body.ordenTransportes.conductor;
        bodyObj.object.ordenTransportes.monto = body.ordenTransportes.monto;
        
        bodyObj.object.autorizacionCoberturas.usuario = body.autorizacionCoberturas.usuario;
        bodyObj.object.mensajeHtml = body.mensajeHtml;
        bodyObj.object.mensajeWhatsapp = body.mensajeWhatsapp;
        bodyObj.updated = true;

        return bodyObj;
    } else {
        console.log("Error Occurred: ", "updated doesnt exist")
        return false;
    }
}

async function objectPost2json(obj) {
    let body
    if(isJson(obj)) {
        body = JSON.parse(obj);
    } else {
        console.log("Error Occurred: ", "body is not json");
        console.log("l: 234");
        return false;
    }

    if(body.hasOwnProperty('mensajeWhatsapp')) {
        console.log('object2json: evaluating');
    } else {
        console.log("Error Occurred: ", "mensajeWhatsapp doesnt exist");
        console.log("l: 248");
        return false;
    }

    if(bodyObj.updated == false) {
        bodyObj.object.id = body.id;
        bodyObj.object.fechaOperacion = body.fechaOperacion;
        bodyObj.object.horaSalida = body.horaSalida;
        bodyObj.object.observacion = body.observacion;

        bodyObj.object.detalleCobertura.ciudad = body.detalleCobertura.ciudad;
        bodyObj.object.detalleCobertura.destino = body.detalleCobertura.destino;
        bodyObj.object.detalleCobertura.seccion = body.detalleCobertura.seccion;
        bodyObj.object.detalleCobertura.medio = body.detalleCobertura.medio;
        bodyObj.object.detalleCobertura.motivo = body.detalleCobertura.motivo;
        bodyObj.object.detalleCobertura.horaCobertura = body.detalleCobertura.horaCobertura;

        bodyObj.object.detalleFoto.nombre = body.detalleFoto.nombre;
        bodyObj.object.detalleFoto.monto = body.detalleFoto.monto;
            
        bodyObj.object.ordenViaticos.monto = body.ordenViaticos.monto;

        bodyObj.object.ordenTransportes.movil = body.ordenTransportes.movil;
        bodyObj.object.ordenTransportes.conductor = body.ordenTransportes.conductor;
        bodyObj.object.ordenTransportes.monto = body.ordenTransportes.monto;
        
        bodyObj.object.autorizacionCoberturas.usuario = body.autorizacionCoberturas.usuario;
        bodyObj.object.mensajeHtml = body.mensajeHtml;
        bodyObj.object.mensajeWhatsapp = body.mensajeWhatsapp;
        bodyObj.updated = true;

        return bodyObj;
    } else {
        console.log("Error Occurred: ", "updated doesnt exist")
        return false;
    }
}

function isJson(item) {
    if (typeof item !== "string") { return false; }
    if (!["{", "}", "[", "]"].some(value => item.includes(value))) { return false; }
    let value = typeof item !== "string" ? JSON.stringify(item) : item;

    try {
        value = JSON.parse(value);
    } catch (e) {
        console.log("Error Occurred: ", e);
        console.log("l: 328")
        return false;
    }
      
    return typeof value === "object" && value !== null;
}


process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection:', error);
});

const server = http.createServer((req, res) => {
    const baseURL =  req.protocol + '://' + req.headers.host + '/';
    const reqUrl = new URL(req.url,baseURL);

    if(reqUrl.pathname == "/msg") {
        if (req.method == 'POST') {
            let body = [];
            req.on('data', async (chunk) => {
                body.push(chunk);
            }).on('end', async () => {
                body = Buffer.concat(body).toString();
                console.log(body);
                // at this point, `body` has the entire request body stored in it as a string
                if(await getSendMsgByPost(body)) {
                    res.end(JSON.stringify({ status: 200, message: 'Success'}));
                } else {
                    res.end(JSON.stringify({ status: 500, message: 'Error'}));
                }
            });
        }


        client.getState().then((result) => {
            if(result.match("CONNECTED")){
                var q = url.parse(req.url, true).query;
                
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
