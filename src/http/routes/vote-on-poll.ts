import { FastifyInstance } from "fastify";
import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { z } from 'zod';
import { randomUUID } from "crypto";
import { pubsub } from '../../utils/voting-pub-sub';

export async function voteOnPoll(app: FastifyInstance){
    app.post("/polls/:pollId/votes", async(request, reply) => {
        const voteOnPollBody = z.object({
            pollOptionId: z.string().uuid(),
        })

        const voteOnPollParams = z.object({
            pollId: z.string().uuid()
        });

        const { pollId } = voteOnPollParams.parse(request.params);
        const { pollOptionId } = voteOnPollBody.parse(request.body);

        let { sessionId } = request.cookies;
        const pollKey:string = `poll:${pollId}`;
        if(sessionId){
            const foundVoteOnPoll = await prisma.vote.findUnique({
                where: {
                    sessionId_pollId: {
                        sessionId,
                        pollId
                    },
                }
            });

            if(foundVoteOnPoll && foundVoteOnPoll.pollOptionId !== pollOptionId){
                await prisma.vote.delete({
                    where:{
                        id: foundVoteOnPoll.id
                    }
                })
                //decrementa 1 voto do antigo
                const votes = await redis.zincrby(pollKey, -1, foundVoteOnPoll.pollOptionId);
                
                //pub
                pubsub.publish(pollId, {
                    pollOptionId: foundVoteOnPoll.pollOptionId, votes: Number(votes)
                })
        
            }
            else if(foundVoteOnPoll){
                return reply.status(400).send({ message: "you already voted on this poll" });
            }
        }

        if(!sessionId){
            sessionId = randomUUID();
            reply.setCookie('sessionId', sessionId, {
                path: '/',
                maxAge: 60*60*24*30, //30 dias
                signed: true,
                httpOnly: true      //acessível apenas pelo backend da aplicação
            })
        }

        await prisma.vote.create({
            data:{
                sessionId: sessionId,
                pollId: pollId,
                pollOptionId: pollOptionId,
            }
        })

        //Incrementa 1 o score da opção da enquete
        const votes = await redis.zincrby(pollKey, 1, pollOptionId);
        
        //pub
        pubsub.publish(pollId, {
            pollOptionId, votes: Number(votes)
        })

        return reply.status(200).send({message: "vote created"});
    })
}