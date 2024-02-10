import { FastifyInstance } from "fastify";
import { pubsub } from "../../utils/voting-pub-sub";
import { z } from 'zod';

export async function pollResults(app: FastifyInstance){
    app.get('/polls/:id/results', {websocket: true}, (connection, request) => {
        const getPollId = z.object({ id: z.string().uuid() })
        const { id } = getPollId.parse(request.params);
        
        /*
            Inscreve no canal de id da enquete
            Subscriber apenas ouve as mensagens que são publicadas ao registrarem votos retorna
        */
        pubsub.subscribe(id, (message) => {
            connection.socket.send(JSON.stringify(message)); //Retorna p/ o frontend
        })
        
    })
}