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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // ... you will write your Prisma Client queries here
        // const allUsers = await prisma.user.findMany()
        // log(allUsers);
        // await prisma.user.create({
        //     data: {
        //       name: 'Rich',
        //       email: 'hello@prisma.com',
        //       posts: {
        //         create: {
        //           title: 'My first post',
        //           body: 'Lots of really interesting stuff',
        //           slug: 'my-first-post',
        //         },
        //       },
        //     },
        //   })
        //   const allUsers = await prisma.user.findMany({
        //     include: {
        //       posts: true,
        //     },
        //   })
        //   dir(allUsers, { depth: null })
        yield prisma.post.update({
            where: {
                slug: 'my-first-post',
            },
            data: {
                comments: {
                    createMany: {
                        data: [
                            { comment: 'Great post!' },
                            { comment: "Can't wait to read more!" },
                        ],
                    },
                },
            },
        });
        const posts = yield prisma.post.findMany({
            include: {
                comments: true,
            },
        });
        console.dir(posts, { depth: Infinity });
    });
}
main()
    .catch((e) => __awaiter(void 0, void 0, void 0, function* () {
    console.error(e);
    process.exit(1);
}))
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
