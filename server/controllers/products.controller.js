import Product from '../models/Product.js';

export const getProducts = async (req, res) => {
  try {
    const { category, active, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (active !== undefined) filter.isActive = active === 'true';
    if (search) filter.name = { $regex: search, $options: 'i' };

    const products = await Product.find(filter)
      .populate('category', 'name color icon')
      .sort({ name: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products', error: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name color icon');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch product', error: err.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };
    if (req.file) {
      productData.image = `/uploads/${req.file.filename}`;
    }
    if (productData.variants && typeof productData.variants === 'string') {
      productData.variants = JSON.parse(productData.variants);
    }
    const product = await Product.create(productData);
    const populated = await product.populate('category', 'name color icon');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create product', error: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }
    if (updateData.variants && typeof updateData.variants === 'string') {
      updateData.variants = JSON.parse(updateData.variants);
    }
    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('category', 'name color icon');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update product', error: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete product', error: err.message });
  }
};
