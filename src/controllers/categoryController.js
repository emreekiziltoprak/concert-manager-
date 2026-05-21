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
    const allCat = await categoryService.getCategories();
    return res.status(200).json({categories: allCat});
}

const deleteCategory = async (req,res) => {
    const result = await categoryService.deleteCategory(req.body.id);
    return res.status(200).json(result);
}

module.exports = {
    addCategory,
    getCategories,
    deleteCategory
}