// import jwt from "jsonwebtoken";

// const config = {
//     secret:'20231226',
//     time:60*60*24*7,
// }

// //创建签名令牌
// function create(payload:object):string{
//     return jwt.sign(payload,config.secret,
//         {
//             expiresIn:config.time,
//             algorithm:'HS256'
//         })
// }

// //验证令牌
// function verify(token:string):any{
//     return jwt.verify(token,config.secret,function(err:any,decoded:any){
//         if(err){
//             return {
//                 ok:0,
//                 msg:'令牌验证失败'
//             }
//         }else{
//             return {
//                 ok:1,
//                 msg:'令牌验证成功',
//                 data:decoded
//             }
//         }
//     })
// }

// //解码令牌
// function decoded(token:string,complete = true):any{
//     return jwt.decode(token,{complete:complete});
// }

// const token = {
//     create,
//     verify,
//     decoded
// }

// export default token;