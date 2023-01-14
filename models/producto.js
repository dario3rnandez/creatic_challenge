const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const productoSchema = new Schema({
    id: Number,
    producto: String,
    precio: Number,
    cantidad: Number
});
module.exports = mongoose.model('Producto', productoSchema);


