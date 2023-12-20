import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid';

function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

const prisma = new PrismaClient()

async function main() {

  // const chatTitleInfo = await prisma.chatTitleInfo.create({
  //   data: {
  //     name: 'test',
  //     chatConnectId: hashCode(uuidv4()),
  //   },
  // })

  // const u1 = await prisma.user.create({
  //   data: {
  //     name: 'admin',
  //     email: '13928245451@163.com',
  //     password: '123',
  //     chatTitleInfo: {
  //       connect: {id: chatTitleInfo.id}
  //     }
  //   },
  // })

  // const u2 = await prisma.user.create({
  //   data: {
  //     name: 'test',
  //     email: 'ww@gmail.com',
  //     password: '123',
  //     chatTitleInfo: {
  //       connect: {id: chatTitleInfo.id}
  //     }
  //   },
  // })



  // await prisma.user.updateMany({
  //   data: {
  //     isOnline: false, // 或者你想设置的默认值
  //   },
  // })


  // 删除 ChatDetail 表中的所有记录
  await prisma.chatDetail.deleteMany()

  // 删除 ChatTitleInfo 表中的所有记录
  await prisma.chatTitleInfo.deleteMany()

  // 删除 User 表中的所有记录
  await prisma.user.deleteMany()

  const allUsers = await prisma.user.findMany()
  console.log(allUsers)
}

main()
  .catch(async (e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })