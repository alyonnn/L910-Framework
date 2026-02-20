const Application = require('./framework/Application');
const fs = require('fs');
const path = require('path');

const app = new Application();
const PORT = 3000;

const getPath = (file) => path.resolve(__dirname, 'data', file);
const readJSON = (file) => JSON.parse(fs.readFileSync(getPath(file), 'utf-8'));
const writeJSON = (file, data) => fs.writeFileSync(getPath(file), JSON.stringify(data, null, 2));

/** МАРШРУТЫ ТОВАРОВ (PRODUCTS) **/
app.get('/products', (req, res) => {
    res.json(readJSON('products.json'));
});

app.get('/products/:id', (req, res) => {
    const products = readJSON('products.json');
    const product = products.find(p => p.id == req.params.id);
    product ? res.json(product) : res.status(404).send('Product not found');
});

app.post('/products', (req, res) => {
    const products = readJSON('products.json');
    const newProduct = {
        id: Date.now(),
        ...req.body,
        price: Number(req.body.price) || 0,
        isVegan: Boolean(req.body.isVegan),
        arrivalDate: new Date().toISOString(),
        ingredients: req.body.ingredients || []
    };
    products.push(newProduct);
    writeJSON('products.json', products);
    res.status(201).json(newProduct);
});

app.put('/products/:id', (req, res) => {
    const products = readJSON('products.json');
    const index = products.findIndex(p => p.id == req.params.id);
    if (index !== -1) {
        products[index] = { id: Number(req.params.id), ...req.body };
        writeJSON('products.json', products);
        res.json(products[index]);
    } else {
        res.status(404).send('Product not found');
    }
});

app.patch('/products/:id', (req, res) => {
    const products = readJSON('products.json');
    const index = products.findIndex(p => p.id == req.params.id);
    if (index !== -1) {
        products[index] = { ...products[index], ...req.body };
        writeJSON('products.json', products);
        res.json(products[index]);
    } else {
        res.status(404).send('Product not found');
    }
});

app.delete('/products/:id', (req, res) => {
    let products = readJSON('products.json');
    const initialLength = products.length;
    products = products.filter(p => p.id != req.params.id);
    if (products.length !== initialLength) {
        writeJSON('products.json', products);
        res.send(`Deleted product ${req.params.id}`);
    } else {
        res.status(404).send('Not found');
    }
});

/** МАРШРУТЫ БРЕНДОВ (BRANDS) **/
app.get('/brands', (req, res) => {
    res.json(readJSON('brands.json'));
});

app.get('/brands/:id', (req, res) => {
    const brands = readJSON('brands.json');
    const brand = brands.find(b => b.id == req.params.id);
    brand ? res.json(brand) : res.status(404).send('Brand not found');
});

app.post('/brands', (req, res) => {
    const brands = readJSON('brands.json');
    const newBrand = { 
        id: Date.now(), 
        ...req.body,
        categories: req.body.categories || []
    };
    brands.push(newBrand);
    writeJSON('brands.json', brands);
    res.status(201).json(newBrand);
});

app.delete('/brands/:id', (req, res) => {
    let brands = readJSON('brands.json');
    const initialLength = brands.length;
    brands = brands.filter(b => b.id != req.params.id);
    if (brands.length !== initialLength) {
        writeJSON('brands.json', brands);
        res.send(`Deleted brand ${req.params.id}`);
    } else {
        res.status(404).send('Not found');
    }
});

app.listen(PORT, () => console.log(`✨ Магазин запущен на ${PORT}`));