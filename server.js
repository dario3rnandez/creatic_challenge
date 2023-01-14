const express = require('express');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const app = express();
const mongoose = require('mongoose');
const User = require('./models/user'); // import your user model
const Producto = require('./models/producto'); // import your user model

mongoose.set('strictQuery', false);
mongoose.connect('mongodb://127.0.0.1:27017/mydb', { useNewUrlParser: true, useUnifiedTopology: true });



const SECRET = 'mysecretkey';

app.use(express.json());


// funcion para buscar un usuario por correo
async function findUserByEmail(correo) {
    try {
        const user = await User.findOne({ correo });
        return user;
    } catch (error) {
        console.log(error);
        return null;
    }
}

app.post('/registro', async (req, res) => {
    // validaciones de contraseña y correo registrado
    if (req.body.password !== req.body.passwordConfirm) {
        return res.status(400).json({ error: 'Las contraseñas no coinciden' });
    }

    if (!validator.isEmail(req.body.correo)) {
        return res.status(400).json({ error: 'El correo no es válido' });
    }

    // Verificar si el correo esta registrado
    const userExist = await findUserByEmail(req.body.correo);
    if (userExist) {
        return res.status(400).json({ error: 'El correo ya esta registrado' });
    }

    console.log(req.body);
    // Creando un objeto de usuario con los datos recibidos
    const newUser = new User({
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        correo: req.body.correo,
        password: req.body.password
    });
    newUser.save((error) => {
        if (error) {
            res.status(500).send(error);
        } else {
            // Creando un token de acceso
            const accessToken = jwt.sign({
                nombre: newUser.nombre,
                apellido: newUser.apellido,
                correo: newUser.correo
            }, SECRET, { expiresIn: 3600 });
            // Devolviendo la respuesta con el usuario y el token
            res.json({
                data: {
                    nombre: newUser.nombre,
                    apellido: newUser.apellido,
                    correo: newUser.correo
                },
                token: { access_token: accessToken }
            });
        }
    });
});


// Ruta para iniciar sesión
app.post('/login', async (req, res) => {

    // Verificar si el correo esta registrado
    const userExist = await findUserByEmail(req.body.correo);
    if (!userExist) {
        return res.status(400).json({ error: 'El correo no esta registrado' });
    }

    // Verificar si la contraseña es correcta
    if (userExist.password !== req.body.password) {
        return res.status(400).json({ error: 'La contraseña es incorrecta' });
    }

    // Creando un token de acceso
    const accessToken = jwt.sign({
        nombre: userExist.nombre,
        apellido: userExist.apellido,
        correo: userExist.correo
    }, SECRET, { expiresIn: 3600 });

    // Devolviendo la respuesta con el usuario y el token
    res.json({
        message: 'ok',
        token: { access_token: accessToken }
    });
});


function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401)
    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
};


// Ruta para crear un producto (solo usuarios autenticados)
app.post('/crear', authenticateToken, async (req, res) => {
    // Verificar si el id del producto ya existe
    const productExist = await Producto.findOne({ id: req.body.id });
    if (productExist) {
        return res.status(400).json({ error: 'El id del producto ya existe' });
    }
    // Creando un objeto de producto con los datos recibidos 
    const newProduct = new Producto({
        id: req.body.id,
        producto: req.body.producto,
        precio: req.body.precio,
        cantidad: req.body.cantidad
    });
    newProduct.save((error) => {
        if (error) {
            res.status(500).send(error);
        } else {
            // Devolviendo la respuesta
            res.json({
                message: "Producto creado"
            });
        }
    });
});

// Ruta para leer todos los productos (solo usuarios autenticados)
app.get('/leer', authenticateToken, async (req, res) => {
    try {
        const productos = await Producto.find({});
        res.json({data: productos});
    } catch (error) {
        res.status(500).send(error);
    }
});


// Ruta para actualizar un producto (solo usuarios autenticados)
app.put('/actualizar', authenticateToken, async (req, res) => {
    // Verificar si el id del producto existe
    const productExist = await Producto.findOne({ id: req.body.id });
    if (!productExist) {
        return res.status(400).json({ error: 'El id del producto no existe' });
    }
    // Actualizando el producto
    try {
        const producto = await Producto
            .findOneAndUpdate({ id:
                req.body.id
            }, {
                producto: req.body.producto,
                precio: req.body.precio,
                cantidad: req.body.cantidad
            }, {
                new: true
            });


        // Devuelve mensaje
        res.json({ message: "Producto actualizado" });
    } catch (error) {
        res.status(500).send(error);
    }
});

// Ruta para eliminar un producto (solo usuarios autenticados)
app.delete('/eliminar', authenticateToken, async (req, res) => {
    // Verificar si el id del producto existe
    const productExist = await Producto
        .findOne
        ({
            id: req.body.id
        });
    if (!productExist) {
        return res.status(400).json({ error: 'El id del producto no existe' });
    }
    // Eliminando el producto
    try {
        const producto = await Producto
            .findOneAndDelete({ id:
                req.body.id
            });
        // Devuelve mensaje
        res.json({ message: "Producto eliminado" });
    } catch (error) {
        res.status(500).send(error);
    }
});


app.listen(3000, () => {
    console.log('Server escuchando en el puerto 3000');
});




