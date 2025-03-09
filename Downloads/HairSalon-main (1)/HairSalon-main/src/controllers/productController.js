const Product = require('../models/productModel');
const cloudinary = require('../config/cloudinary'); // Thêm Cloudinary
const fs = require('fs'); // Thêm fs để xóa file tạm

const productController = {
  // Lấy tất cả sản phẩm
  getAllProducts: async (req, res) => {
    try {
      const products = await Product.getAll();
      res.status(200).json(products);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách sản phẩm:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  // Lấy sản phẩm theo tên
  getProductByName: async (req, res) => {
    try {
      const { name } = req.params;
      const product = await Product.getByName(name);
      if (!product) return res.status(404).json({ message: 'Sản phẩm không tồn tại' });

      res.status(200).json(product);
    } catch (error) {
      console.error('Lỗi khi lấy sản phẩm:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  // Thêm sản phẩm (Hỗ trợ upload ảnh)
 createProduct: async (req, res) => {
    try {
      if (!req.user || req.user.user_type_id !== 1) { // Giả sử 2 là admin
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(403).json({ message: 'Bạn không có quyền thêm sản phẩm' });
      }

      const { name, description, price, stock } = req.body;
      if (!name || !price || !stock) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
      }

      let imageUrl = null;
      if (req.file) {
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: "products",
          overwrite: true,
        });
        imageUrl = uploadResult.secure_url;
        fs.unlinkSync(req.file.path);
      }

      const newProduct = await Product.create({ name, description, price, stock, image_url: imageUrl });
      res.status(201).json({ message: 'Thêm sản phẩm thành công', product: newProduct });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      console.error('Lỗi khi thêm sản phẩm:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  updateProductByName: async (req, res) => {
    try {
      if (!req.user || req.user.user_type_id !== 1) { // Giả sử 2 là admin
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(403).json({ message: 'Bạn không có quyền cập nhật sản phẩm' });
      }

      const { name } = req.params;
      const { description, price, stock } = req.body;

      const oldProduct = await Product.getByName(name);
      if (!oldProduct) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
      }

      let imageUrl = oldProduct.image_url;
      if (req.file) {
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: "products",
          overwrite: true,
        });
        imageUrl = uploadResult.secure_url;
        fs.unlinkSync(req.file.path);

        if (oldProduct.image_url) {
          const publicId = oldProduct.image_url.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`products/${publicId}`).catch((err) => {
            console.error('Lỗi khi xóa ảnh cũ:', err);
          });
        }
      }

      const updatedProduct = await Product.updateByName(name, { description, price, stock, image_url: imageUrl });
      if (!updatedProduct) {
        return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
      }

      res.status(200).json({ message: 'Cập nhật sản phẩm thành công', product: updatedProduct });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      console.error('Lỗi khi cập nhật sản phẩm:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  deleteProductByName: async (req, res) => {
    try {
      if (!req.user || req.user.user_type_id !== 1) { // Giả sử 2 là admin
        return res.status(403).json({ message: 'Bạn không có quyền xóa sản phẩm' });
      }

      const { name } = req.params;
      const deletedProduct = await Product.deleteByName(name);
      if (!deletedProduct) return res.status(404).json({ message: 'Sản phẩm không tồn tại' });

      if (deletedProduct.image_url) {
        const publicId = deletedProduct.image_url.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`products/${publicId}`).catch((err) => {
          console.error('Lỗi khi xóa ảnh:', err);
        });
      }

      res.status(200).json({ message: 'Xóa sản phẩm thành công' });
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  }
};

module.exports = productController;
