import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { z } from 'zod';
import { redis } from '../../lib/redis';
import { title } from 'process';

export async function getPoll(app: FastifyInstance){

    app.get("/poll/:id", async(request, reply) => {
        const getIdParam  = z.object({id: z.string()});
        const { id } = getIdParam.parse(request.params);

        const poll = await prisma.poll.findUnique({
            where: {
                id: id
            },
            include:{
                options: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        })

        if(!poll) return reply.status(400).send({ message: "Poll not found" });
        
        const pollKey:string = `poll:${id}`;        
        const result = await redis.zrange(pollKey, 0, -1, "WITHSCORES");

        let votesObject = {} as Record<string, number>;
        const scores = result.map((item, index) => {
            if(index % 2 === 0){
                Object.assign(votesObject, { [item] : result[index+1] });
            }
        });

        return reply.status(200).send({ 
            poll: {
                id: poll.id,
                title: poll.title,
                options: poll.options.map((item) => {
                    return { 
                        id: item.id,
                        title: item.title,
                        votes: votesObject[item.id] || "0"
                    }
                })
            }
        });
    })

}