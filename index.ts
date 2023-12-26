import fastify, { FastifyListenOptions, FastifyRequest } from "fastify";
import path from "path";
import { fastifyStatic, FastifyStaticOptions } from "@fastify/static";
import fastifyCors from '@fastify/cors';
import multipart from '@fastify/multipart'
import { v4 as uuidv4 } from 'uuid';
import { Server } from "socket.io";
import { ChatDetail, PrismaClient } from "@prisma/client";
// import token from "./jwt";
import fastifyJwt from '@fastify/jwt';
import fastifyAuth from '@fastify/auth';

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

const io = new Server(server.server, {
    cors: {
        origin: "http://192.168.8.9:8080"
    }
});

// 存储会话 ID 和 Socket.IO 连接的映射
const sessions = new Map();

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
server.register(fastifyJwt, {
    secret: 'supersecret',
    sign: {
        algorithm: 'HS256',
        expiresIn: '7d'
    },
    verify: {
        maxAge: '7d',
        algorithms: ['HS256'],
    },
    decode: {
        complete: true,
    },
});
server.register(fastifyAuth);

server.addHook("onRequest", async (request, reply) => {
    // server.log.info('--------------------------------------');
    // server.log.info(request.url);
    // server.log.info('--------------------------------------');
    const isFilter = request.url.includes ('/user') || request.url.includes ('/register') ;
    if (!isFilter) {
        try {
            await request.jwtVerify()
        } catch (err) {
            reply.send(err)
        }
    }
})

// 注册 fastify-socket.io 插件
// server.register(fastifySocketIo);

// server.get("/", { preValidation: [(request, reply, done) => done()] }, async (request, reply) => {
//     // request.log.info("Some info about the request");
//     return reply.sendFile("index.html");
// });


const prisma = new PrismaClient();

//登陆 查询用户
server.get<{ Querystring: { email: string, password: string } }>("/user",async (request: FastifyRequest<{ Querystring: { email: string, password: string } }>, reply) => {
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
        // 生成一个新的会话 ID
        const sessionId = uuidv4();

        // 当有新的客户端连接时
        io.on('connection', (socket) => {
            console.log('a user connected');
            console.log(socket.id); // x8WIv7-mJelg7on_ALbx
            socket.on('session', (clientSessionId) => {
                if (clientSessionId === sessionId) {
                    sessions.set(sessionId, socket);
                }
            });

            socket.on('check.ChatTitleInfos', ({ userIds, sessionId }: { userIds: string[]; sessionId: string; }) => {
                // 在这里处理 userIds 和 sessionId
                // 例如，你可以使用这些数据来检查 ChatTitleInfos
                if (userIds.length == 0) {
                    return;
                }
                for (let index = 0; index < userIds.length; index++) {
                    const element = userIds[index];
                    socket.emit('check.ChatTitleInfos', { msg: `傻瓜：${element}` });
                }
            });

            // 当收到客户端发送的消息时
            socket.on('chat message', (msg) => {
                console.log('message: ' + msg);

                // 将消息广播给所有客户端
                socket.emit('chat message', msg);
            });

            // 当客户端断开连接时
            socket.on('disconnect', () => {
                console.log('user disconnected');
            });
        });
        const accessToken = server.jwt.sign(user);
        // const accessToken = token.create(user);
        // 将会话 ID 发送给客户端
        reply.send({ sessionId, user, accessToken });
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
server.post<{ Body: RegisterRequestBody }>("/register", {
    preHandler: async (request, reply, done) => {
        if (!request.headers.authorization || request.headers.authorization === 'Bearer null') {
            done();
        } else {
            try {
                await request.jwtVerify();
                done();
            } catch (err: any) {
                done(err);
            }
        }
    }
}, async (request: FastifyRequest<{ Body: RegisterRequestBody }>, reply) => {
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

        // 根据name查找用户数据对象
        const userSearch = await prisma.user.findFirst({
            where: { name: name },
        });

        //根据用户的chatTitleInfos查找chatTitleInfo
        if (!userSearch || !userSearch.id) {
            reply.status(400).send({ error: "userSearch not found" });
            return;
        }

        const chatTitleInfos = await prisma.chatTitleInfo.findMany({
            where: {
                userIDs: {
                    has: userSearch.id,
                },
            },
        });

        console.log(JSON.stringify(chatTitleInfos));
        reply.send(chatTitleInfos);
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
        reply.status(400).send({ error: "name is required" + name });
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

        if (!userSearch || !userSearch.id) {
            reply.status(400).send({ error: "userSearch not found" });
            return;
        }

        if (!userMy || !userMy.id) {
            reply.status(400).send({ error: "userMy not found" });
            return;
        }

        console.log(userMy.id, userSearch.id, name, email);

        // 查找chatTitleInfo数据库里是userIds否有userMy.id和userSearch.id的对象

        let chatTitleInfos = await prisma.chatTitleInfo.findFirst({
            where: {
                userIDs: {
                    hasEvery: [userMy.id, userSearch.id],
                },
            },
        });

        if (!chatTitleInfos) {
            chatTitleInfos = await prisma.chatTitleInfo.create({
                data: {
                    name: name,
                    userIDs: [userMy.id, userSearch.id],
                    chatConnectId: hashCode(uuidv4()),
                },
            });

            // 更新user chatTitleInfos
            await prisma.user.updateMany({
                where: {
                    id: {
                        in: [userMy.id, userSearch.id],
                    },
                },
                data: {
                    chatTitleInfoIDs: {
                        push: chatTitleInfos.id,
                    },
                },
            });

            reply.send(chatTitleInfos);

        }

        reply.status(400).send({ error: "chatTitleInfos 已经存在了." });
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
        const chatTitleInfo = await prisma.chatTitleInfo.findUnique({
            where: {
                id: chatTitleInfoId,
            },
        });
        if (!chatTitleInfo) {
            reply.status(400).send({ error: "chatTitleInfoId is undefine." });
            return;
        }
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
                chatInfoConnectId: chatTitleInfo?.chatConnectId,
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


server.listen(flo, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    server.log.info(`Server listening at ${address}`);
});