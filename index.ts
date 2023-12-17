import fastify, { FastifyListenOptions, FastifyRequest } from "fastify";
import path from "path";
import { fastifyStatic, FastifyStaticOptions } from "@fastify/static";
import fastifyCors from '@fastify/cors';

const envToLogger = {
    dev: {
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
    },
    prod: true,
    test: false,
}

console.log(process.env.NODE_ENV);

if (!process.env.NODE_ENV) {
    console.error("NODE_ENV not set");
    process.exit(1);
}

// console.log(envToLogger, process.env); envToLogger["dev"] ??
const server = fastify({
    logger: true,
});

const staticOpts: FastifyStaticOptions = {
    root: path.join(__dirname, "dist"),
};

server.register(fastifyStatic, staticOpts);
server.register(fastifyCors, {
    origin: "http://192.168.8.9:8080", // 你的前端应用的源
    methods: ["GET", "POST", "PUT", "DELETE"], // 允许的 HTTP 方法
  });
  

server.get("/", async (request, reply) => {
    // request.log.info("Some info about the request");
    return reply.sendFile("index.html");
});

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

server.get("/user", async (request: FastifyRequest<{ Querystring: { email: string, password: string } }>, reply) => {
    const { email, password } = request.query;

    if (!email) {
        reply.status(400).send({ error: "Email is required" });
        return;
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            reply.status(404).send({ error: "User not found" });
            return;
        }

        // Compare passwords
        const passwordMatch = user.password.trim() === password.trim();

        if (!passwordMatch) {
            reply.status(401).send({ error: "Incorrect password" });
            return;
        }

        reply.send(user);
    } catch (error) {
        console.error(error);
        reply.status(500).send({ error: "An error occurred while retrieving the user" });
    }
});

const flo: FastifyListenOptions = {
    port: 3000,
    host: "0.0.0.0",
    backlog: 511,
}

server.listen(flo, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    server.log.info(`Server listening at ${address}`);
});

