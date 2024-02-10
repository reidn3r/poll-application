import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { z } from 'zod';

export async function createPoll(app: FastifyInstance){

    app.post("/polls", async(request, reply) => {
        const createPollBody = z.object({
            title: z.string(),
            options: z.array(z.string()), //array de titulo de opções
        })
        const { title, options } = createPollBody.parse(request.body);
        
        const poll = await prisma.poll.create({
            data: {
                title: title,
                options: {
                    createMany: {
                        data: options.map((opt) => {
                            return { title: opt }
                        })
                    }
                }
            }
        })


        
        return reply.status(201).send({ "id":poll.id });
    })
}