import fastify, { FastifyListenOptions } from "fastify";
import path from "path";
import { fastifyStatic, FastifyStaticOptions } from "@fastify/static";
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
    logger:  true,
});

const staticOpts: FastifyStaticOptions = {
    root: path.join(__dirname, "dist"),
};

server.register(fastifyStatic, staticOpts);

server.get("/", async (request, reply) => {
    // request.log.info("Some info about the request");
    return reply.sendFile("index.html");
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

