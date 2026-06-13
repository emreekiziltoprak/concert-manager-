const prisma = require("../utils/prismaClient");

const addCategory = async (category) => {
    const foundCategory = await prisma.category.findUnique({
        where: {name: category.name},
    })

    if(foundCategory) throw new Error("Category already exists");

    const categoryResp = await prisma.category.create({ data: category });
    return {message: "Category successfully created", categoryResp};
}

const getCategories = async () => {
    return await prisma.category.findMany();
}

const deleteCategory = async (id) => {
    const deletedCat = await prisma.category.delete({
        where: {id}
    });
    return {deletedCategory: deletedCat};
}

module.exports = {addCategory, getCategories, deleteCategory};