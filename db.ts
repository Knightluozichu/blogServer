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


  // 删除 ChatDetail 表中的所有记录
  await prisma.chatDetail.deleteMany()

  // await prisma.userChatInfo.deleteMany()

  // 删除 ChatTitleInfo 表中的所有记录
  await prisma.chatTitleInfo.deleteMany()

  // 删除 User 表中的所有记录
  await prisma.user.deleteMany()

  // 查询名字w1的用户信息
  // const w1User = await prisma.user.findFirst({
  //   where: {
  //     name: 'w1',
  //   },
  // })
  // if(w1User == null) {
  //   return;
  // }


    
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