import { PrismaClient } from "@prisma/client";
import { log,dir } from "console";

const prisma = new PrismaClient();

async function main() {
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

    await prisma.post.update({
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
    })
    const posts = await prisma.post.findMany({
      include: {
        comments: true,
      },
    })
  
    console.dir(posts, { depth: Infinity })
}

main()
    .catch(async (e)=>{
        console.error(e);
        process.exit(1);
    })
    .finally(async ()=>{
        await prisma.$disconnect();
    });


