// 启动mongodb 及 replica set 数据副集

//查看状态，副本集启动需要先关闭服务
// sc query MongoDB
// net stop MongoDB

// 管理员权限
// mongod --port 27017 --dbpath "F:/Learn/DB/MongoDB/Server/6.0/data" --replSet myReplicaSet

// 一般权限
// mongosh --port 27017
// rs.initiate()
// rs.add("localhost:27018")
// rs.add("localhost:27019")

