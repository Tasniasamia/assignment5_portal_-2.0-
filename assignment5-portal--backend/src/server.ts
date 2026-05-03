// import { Server } from "http";
// import app from "./app"
// import { envVars } from "./config/env";

// let server : Server;

// const main=async()=>{
//     try{
//         server = app.listen(process.env.PORT || 6060,()=>{
//         console.log(`http://localhost:${envVars.PORT || 6060}`)
//     })
// } catch(error){
//     console.log(error);
// }
// }
// // SIGTERM signal handler
// process.on("SIGTERM", () => {
//     console.log("SIGTERM signal received. Shutting down server...");

//     if(server){
//         server.close(() => {
//             console.log("Server closed gracefully.");
//             process.exit(1);
//         });
//     } 
    
//     process.exit(1);
    
// })

// // SIGINT signal handler

// process.on("SIGINT", () => {
//     console.log("SIGINT signal received. Shutting down server...");

//     if(server){
//         server.close(() => {
//             console.log("Server closed gracefully.");
//             process.exit(1);
//         });

//     }

//     process.exit(1);
// });

// //uncaught exception handler
// process.on('uncaughtException', (error) => {
//     console.log("Uncaught Exception Detected... Shutting down server", error);

//     if(server){
//         server.close(() => {
//             process.exit(1);
//         })
//     }

//     process.exit(1);
// })

// process.on("unhandledRejection", (error) => {
//     console.log("Unhandled Rejection Detected... Shutting down server", error);

//     if(server){
//         server.close(() => {
//             process.exit(1);
//         })
//     }

//     process.exit(1);
// })

// main();

import { Server } from "http"
import app from "./app"
import { envVars } from "./config/env"

console.log("server.ts loaded")

const PORT = process.env.PORT || envVars.PORT || 6061
console.log("server starting on port", PORT)

let server: Server

const main = async () => {
  try {
    server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })

    // Request timing middleware
    app.use((req, res, next) => {
      const start = Date.now()
      res.on('finish', () => {
        const duration = Date.now() - start
        console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`)
      })
      next()
    })

    server.on("error", (error) => {
      console.error("Server listen error:", error)
    })
  } catch (error) {
    console.error("Server startup error:", error)
    process.exit(1)
  }
}

main()