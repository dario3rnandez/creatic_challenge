const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userSchema = new Schema({
    nombre: String,
    apellido: String,
    correo: String,
    password: String
});
module.exports = mongoose.model('User', userSchema);


