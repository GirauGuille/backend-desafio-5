import express from 'express';
import './db/dbConfig.js';
import productsRouter from './routes/products.router.js';
import cartsRouter from './routes/carts.router.js';
import { __dirname } from './utils/dirname.js';
import handlebars from 'express-handlebars';
import { Server } from 'socket.io';
import usersRouter from './routes/users.router.js';
import viewsRouter from './routes/views.router.js';
import { messagesModel } from './db/models/messages.model.js';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import FileStore from 'session-file-store';
import MongoStore from 'connect-mongo';

const app = express();
const PORT = 8080;
const FileStoreSession = FileStore(session);

/* cookie */
app.use(cookieParser());

/* middlewares */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(__dirname + '/public/html'));
app.use(express.static(__dirname + '/public'));

/* handlebars */
app.engine('handlebars', handlebars.engine());
app.set('views', __dirname + '/views');
app.set('view engine', 'handlebars');

app.use(session({
    store: MongoStore.create({
        mongoUrl: 'mongodb+srv://girauguillermo:giraug@cluster0.bfpv0cy.mongodb.net/electrogirau?retryWrites=true&w=majority',
    }),
    resave: false,
    saveUninitialized: false,
    secret: 'secreto',
    //La sesión dura un día activa
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

/* routers */
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/users', usersRouter);
app.use('/views', viewsRouter)
app.get('/', (req, res) => {
    res.redirect('/views/login');
});


/* server */
const httpServer = app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${httpServer.address().port}`);
    console.log(`http://localhost:${PORT}`);});
    httpServer.on("error", error => console.log(`Error en servidor: ${error.message}`));


// websocket
const io = new Server(httpServer)

io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.id}`)

    socket.on('disconnect', () => {
        console.log(`Usuario desconectado: ${socket.id}`)
    })

    socket.on("message", async (data) => {

        const newMessage = new messagesModel({
            user: data.user,
            message: data.msg,
        });
        await newMessage.save();

        socket.broadcast.emit("message", data)
    })

    socket.on('usuarioNuevo', async (usuario) => {
        socket.broadcast.emit('broadcast', usuario)

        const messages = await messagesModel.find();

        socket.emit('chat', messages)
    })
})