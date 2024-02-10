import fastify from 'fastify';
import cookie from '@fastify/cookie'
import { createPoll } from './routes/create-poll';
import { getPoll } from './routes/get-poll';
import { voteOnPoll } from './routes/vote-on-poll'
import { pollResults } from './ws/poll-results';
import fastifyWebsocket from '@fastify/websocket';

const app = fastify();

//cookies
app.register(cookie, {
    secret: "polls-nlw",
    hook: "onRequest",
});

//websocket
app.register(fastifyWebsocket);

//endpoints
app.register(createPoll);
app.register(getPoll);
app.register(voteOnPoll);
app.register(pollResults);

app.listen({ port: 3030 }, () => {
    console.log("Running at: 3030");
})