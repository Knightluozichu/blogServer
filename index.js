"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const path_1 = __importDefault(require("path"));
const static_1 = require("@fastify/static");
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
};
console.log(process.env.NODE_ENV);
if (!process.env.NODE_ENV) {
    console.error("NODE_ENV not set");
    process.exit(1);
}
// console.log(envToLogger, process.env); envToLogger["dev"] ??
const server = (0, fastify_1.default)({
    logger: true,
});
const staticOpts = {
    root: path_1.default.join(__dirname, "dist"),
};
server.register(static_1.fastifyStatic, staticOpts);
server.get("/", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    // request.log.info("Some info about the request");
    return reply.sendFile("index.html");
}));
const flo = {
    port: 3000,
    host: "0.0.0.0",
    backlog: 511,
};
server.listen(flo, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    server.log.info(`Server listening at ${address}`);
});
