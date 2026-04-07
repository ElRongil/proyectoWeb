import { EventEmitter } from 'events';

const notificationEmitter = new EventEmitter();

// Listeners — en la práctica final enviarían a Slack
notificationEmitter.on('user:registered', (user) => {
  console.log(`[EVENT] user:registered → ${user.email}`);
});

notificationEmitter.on('user:verified', (user) => {
  console.log(`[EVENT] user:verified → ${user.email}`);
});

notificationEmitter.on('user:invited', (user) => {
  console.log(`[EVENT] user:invited → ${user.email}`);
});

notificationEmitter.on('user:deleted', (user) => {
  console.log(`[EVENT] user:deleted → ${user.email}`);
});

export default notificationEmitter;