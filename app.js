const path = require('path')

const fastify = require('fastify')({ 
    logger: true
})

fastify.get('/', async (request, reply) => {
    return reply.sendFile('index.html')
})

fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'dist'),
})


const opt = {
    port: 8888,
    host: '0.0.0.0',
    backlog: 511,
    readableAll: true,
    writableAll: true,

}
fastify.listen(opt, (err, address) => {
    if (err) {
        console.error(err)
        process.exit(1)
    }
    console.log(`Server listening at ${address}`)
})
