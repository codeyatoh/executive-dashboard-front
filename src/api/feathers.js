import feathers from '@feathersjs/feathers';
import socketio from '@feathersjs/socketio-client';
import io from 'socket.io-client';

const socket = io('http://localhost:3030'); // Change if backend is hosted elsewhere
const client = feathers();

client.configure(socketio(socket));

export default client;
