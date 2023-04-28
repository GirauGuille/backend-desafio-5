import { Router } from "express";
import ProductManager from "../Dao/ProductManagerMongo.js";
import CartManager from "../Dao/CartManagerMongo.js";
import UsersManager from "../Dao/UsersManagerMongo.js";

const router = Router();
const usersManager = new UsersManager();
const auth = async (req, res, next) => {
    try {
        if (req.session.logged) {
            next();
        } else {
            res.redirect('/views/login');
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const isLogged = async (req, res, next) => {
    try {
        if (req.session.logged) {
            res.redirect('/views/perfil');
        } else {
            next();
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}



router.get("/chat", (req, res) => {
    res.render("chat", {
        seccion: "Chat",
    });
});

router.get("/products", auth, async (req, res) => {
    const { userId, isAdmin, role } = req.session;
    const userLogged = await usersManager.getUserById(userId);
    const { first_name, last_name, email, age } = userLogged;
    const productManager = new ProductManager();
    const products = await productManager.getProducts(2);
    res.render("products", {
        products, first_name, last_name, email, age, isAdmin, role,
        seccion: "productos",
    });
});

router.get("/products/page/:page", auth, async (req, res) => {
    const page = req.params.page || 1;
    const productManager = new ProductManager();
    const products = await productManager.getProducts(5, page);
    res.render("products", { products });
});

router.get("/products/:id", auth, async (req, res) => {
    const productManager = new ProductManager();
    const product = await productManager.getProductById(req.params.id);
    const { _id, title, description, price, code, stock, category, thumbnail } =
        product;
    res.render("product", {
        id: _id, title, description, price, code, stock, category, thumbnail,
        seccion: "producto",
    });
});

router.get("/carts/:cid", async (req, res) => {
    const cartManager = new CartManager();
    const cart = await cartManager.getCartById(req.params.cid);
    const { products } = cart;
    res.render("cart", { 
        products,
        seccion: "carrito",
    });
});

/* RUTA DE REGISTRO DE USAUARIO */
router.get("/singUp", isLogged, (req, res) => {
    res.render("singUp",);
});

/* RUTA LOGGING */
router.get("/login", isLogged, (req, res) => {
    res.render("login", {
        seccion: "inicia seción",
    });
});

/* RUTA PERFIL DE USUARIO */
router.get("/perfil", auth, async (req, res) => {
    const { userId, isAdmin, role } = req.session;
    const userLogged = await usersManager.getUserById(userId);
    const { first_name, last_name, email, age } = userLogged;
    res.render("perfil", { first_name, last_name, email, age, isAdmin, role });
});

/* RUTA DE ERROR AL REGISTRAR USUARIO */
router.get("/errorSingUp", (req, res) => {
    res.render("errorSingUp");
});

/* RUTA ERROR DE INICIO DE SESION */
router.get("/errorLogin", (req, res) => {
    res.render("errorLogin");
});

export default router;
