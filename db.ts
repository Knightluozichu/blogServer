import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // await prisma.user.create({
  //   data: {
  //     name: 'admin',
  //     email: '13928245451@163.com',
  //     password: '123',
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