import fastify, { FastifyListenOptions, FastifyRequest } from "fastify";
import path from "path";
import { fastifyStatic, FastifyStaticOptions } from "@fastify/static";
import fastifyCors from '@fastify/cors';
import multipart from '@fastify/multipart'
import { v4 as uuidv4 } from 'uuid';
import { Server } from "socket.io";
import { ChatDetail, PrismaClient } from "@prisma/client";

function hashCode(s: string): number {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

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
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // 允许的 HTTP 方法
});
// 注册流上传插件
server.register(multipart);
// 注册 fastify-socket.io 插件
// server.register(fastifySocketIo);

server.get("/", async (request, reply) => {
    // request.log.info("Some info about the request");
    return reply.sendFile("index.html");
});


const prisma = new PrismaClient();

//登陆 查询用户
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
        const id = user.id;
        await prisma.user.update({ where: { id }, data: { isOnline: true } });

        server.log.info(`User ${user.name} logged in`);
        reply.send(user);
    } catch (error) {
        console.error(error);
        reply.status(500).send({ error: "An error occurred while retrieving the user" });
    }
});

interface RegisterRequestBody {
    name: string;
    password: string;
    email: string;
    // 其他字段...
}
//注册 查询email是否存在，如果存在则返回错误，如果不存在则创建用户
server.post("/register", async (request: FastifyRequest<{ Body: RegisterRequestBody }>, reply) => {
    const { email, password, name } = request.body;
    if (!email) {
        reply.status(400).send({ error: "Email is required" });
        return;
    }
    if (!password) {
        reply.status(400).send({ error: "Password is required" });
        return;
    }
    if (!name) {
        reply.status(400).send({ error: "Name is required" });
        return;
    }
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            reply.status(404).send({ error: "User already exists" });
            return;
        }
        const newUser = await prisma.user.create({ data: { email, password, name } });
        reply.send(newUser);
    } catch (error) {
        console.error(error);
        reply.status(500).send({ error: "An error occurred while retrieving the user" });
    }
});

//根据用户名或者email 查询用户，允许近似和模糊查询
server.get("/search", async (request: FastifyRequest<{ Querystring: { name: string, email: string } }>, reply) => {
    const { name, email } = request.query;
    if (!name && !email) {
        reply.status(400).send({ error: "Name or email is required" });
        return;
    }
    try {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    {
                        name: name,
                    },
                    {
                        email: email,
                    },
                ],
            },
        });
        reply.send(users);
    } catch (error) {
        console.error(error);
        reply.status(500).send({ error: "An error occurred while retrieving the user" });
    }
});

// /chatInfo 获取聊天信息列表 get
server.get("/chatInfo", async (request: FastifyRequest<{ Querystring: { name: string } }>, reply) => {
    const { name } = request.query;
    if (!name) {
        reply.status(400).send({ error: "name is required" });
        return;
    }
    try {
        const chatInfos = await prisma.chatTitleInfo.findMany({
            where: {
                name: name,
                chatConnectId: hashCode(uuidv4()),
            },
        });
        console.log(JSON.stringify(chatInfos));
        reply.send(chatInfos);
    } catch (error) {
        console.error(error);
        reply.status(500).send({ error: "An error occurred while retrieving the chatInfo" });
    }
});

// /chatInfo patch,使chatInfo.value?.id 关联上 chatDetail.chatTitleInfoId


// /chatInfo 创建聊天信息 post, name是搜索，email是自己
server.post("/chatInfo", async (request: FastifyRequest<{ Body: { name: string, email: string } }>, reply) => {
    const { name, email } = request.body;

    if (!name) {
        reply.status(400).send({ error: "name is required" });
        return;
    }

    try {
        // 根据email查找用户数据对象,然后把chatInfo.id关联到user.chatTitleInfoId
        const userMy = await prisma.user.findUnique({
            where: { email: email },
        });

        // 根据name查找用户数据对象
        const userSearch = await prisma.user.findFirst({
            where: { name: name },
        });

        if (!userSearch || !userMy) {
            reply.status(400).send({ error: "user not found" });
            return;
        }

        const chatInfo = await prisma.chatTitleInfo.create({
            data: {
                name: name,
                chatConnectId: hashCode(uuidv4()),
                users: {
                    connect: { id: userMy.id }
                }
            },
        });

        await prisma.user.update({
            where: { id: userSearch.id },
            data: {
                chatTitleInfo: {
                    connect: { id: chatInfo.id }
                }
            },
        });

        reply.send(chatInfo);
    } catch (error) {
        console.error(error);
        reply.status(500).send({ error: "An error occurred while retrieving the chatInfo" });
    }
});

// 新增聊天信息 post
server.post("/chatDetail", async (request: FastifyRequest<{
    Body: {
        order: number, type: number, content: string,
        time: string, icon: string, isOwner: boolean, name: string, counter: number, chatTitleInfoId: string
    }
}>, reply) => {
    const { order, type, content, time, icon, isOwner, name, counter, chatTitleInfoId } = request.body;

    try {
        const chatDetail = await prisma.chatDetail.create({
            data: {
                order: order,
                type: type,
                content: content,
                time: time,
                icon: icon,
                isOwner: isOwner,
                name: name,
                counter: counter,
                chatTitleInfoId: chatTitleInfoId,
            },
        });
        reply.send(chatDetail);
    } catch (error) {
        console.error(error);
        reply.status(500).send({ error: "An error occurred while retrieving the chatDetail" });
    }
});

// /chatDetail 删除聊天信息 delete
server.delete("/chatDetail", async (request: FastifyRequest<{ Querystring: { id: string } }>, reply) => {
    const { id } = request.query;

    try {
        await prisma.chatDetail.delete({
            where: {
                id: id,
            },
        });
        reply.status(200).send({ msg: '删除成功.' });
    } catch (error) {
        console.error(error);
        reply.status(500).send({ error: "An error occurred while retrieving the chatDetail" });
    }
});




const flo: FastifyListenOptions = {
    port: 3000,
    host: "0.0.0.0",
    backlog: 511,
}

const io = new Server(server.server,{
    cors:{
        origin:"http://192.168.8.9:8080"
    }
});

// 当有新的客户端连接时
io.on('connection', (socket) => {
    console.log('a user connected');
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx

    // 当收到客户端发送的消息时
    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);

        // 将消息广播给所有客户端
        io.emit('chat message', msg);
    });

    // 当客户端断开连接时
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(flo, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    server.log.info(`Server listening at ${address}`);
});