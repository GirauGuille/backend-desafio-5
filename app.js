import express from "express";
import handlebars from "express-handlebars";
import { Server } from "socket.io";
import { __dirname } from "./src/utils.js";
import ProductManager from "./src/dao/productManagerMongo.js";
import ChatManager from "./src/dao/chatManagerMongo.js";
import "./src/db/dbConfig.js";
import products from "./src/routers/products.router.js";
import carts from "./src/routers/carts.router.js";
import views from "./src/routers/views.router.js";

//import cookieParser from "cookie-parser";

const app = express();
const PORT = 8080;
const productManager = new ProductManager();
const chatManager = new ChatManager();

/* middlewares */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

/* cokies */
/* app.use(cookieParser())

app.get('/crearCookie', (req, res) => {
  res.cookie('cookie1', 'primera Cookie').send('respuesta guardado cookie')
}) */

/* handlebars */
app.engine(
  "hbs",
  handlebars.engine({
    extname: "hbs",
    defaultLayout: "main.hbs",
    layoutsDir: __dirname + "/views/layouts",
  })
);
app.set("views", __dirname + "/views");
app.set("view engine", "hbs");

/* routers */
app.use("/api/products", products);
app.use("/api/carts", carts);
app.use("/", views);

/* server */
const httpServer = app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${httpServer.address().port}`);
  console.log(`http://localhost:${PORT}`);
});
httpServer.on("error", error =>
  console.log(`Error en servidor: ${error.message}`)
);

/* webSocket */
const socketServer = new Server(httpServer);
socketServer.on("connection", async socket => {
  const products = await productManager.getAll();
  const messages = await chatManager.getAllMessages();

  socket.emit("products", products);

  socket.on("newProduct", async data => {
    await productManager.addProduct(data);
    const products = await productManager.getAll();
    socket.emit("products", products);
  });

  socket.on("deleteProduct", async id => {
    await productManager.deleteById(id);
    const products = await productManager.getAll();
    socket.emit("products", products);
  });

  socket.emit("messages", messages);

  socket.on("newMessage", async data => {
    await chatManager.addMessage(data);
    socket.emit("messages", messages);
  });
});
