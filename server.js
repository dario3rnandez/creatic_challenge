const express = require('express');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const app = express();
const mongoose = require('mongoose');
const User = require('./models/user'); // import your user model

mongoose.set('strictQuery', false);
mongoose.connect('mongodb://127.0.0.1:27017/mydb', { useNewUrlParser: true, useUnifiedTopology: true });



const SECRET = 'mysecretkey';

app.use(express.json());


// funcion para buscar un usuario por correo
async function findUserByEmail(correo) {
    try {
        const user = await User.findOne({ correo });
        console.log(user);
        return user;
    } catch (error) {
        console.log(error);
        return null;
    }
}

app.post('/registro', async(req, res) => {
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
app.post('/login', async(req, res) => {

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



app.listen(3000, () => {
    console.log('Server escuchando en el puerto 3000');
});

