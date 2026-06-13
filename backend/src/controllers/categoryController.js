const categoryService = require("../services/categoryService");

const addCategory = async (req, res) => {
    try {
        const successResponse = await categoryService.addCategory(req.body);
        res.status(201).json(successResponse);
    } catch(e){
        res.status(400).json({error: e.message});
    }
}

const getCategories = async (req, res) => {
    try {
        const allCat = await categoryService.getCategories();
        return res.status(200).json({categories: allCat});
    } catch(e) {
        res.status(500).json({error: "Kategoriler getirilirken bir hata oluştu."});
    }
}

const deleteCategory = async (req, res) => {
    try {
        // DİKKAT: req.body.id yerine, route'dan gelen req.params.categoryId'yi alıyoruz!
        const categoryId = req.params.categoryId; 
        
        const result = await categoryService.deleteCategory(categoryId);
        return res.status(200).json(result);
    } catch(e) {
        return res.status(400).json({error: e.message});
    }
}

module.exports = {
    addCategory,
    getCategories,
    deleteCategory
}