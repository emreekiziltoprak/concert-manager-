
// `import = require` rather than a default import: prismaClient uses `export =`,
// and this form emits a bare `require()` with no __importDefault wrapper, so the
// generated JS is byte-for-byte what the .js file did.
import prisma = require("../utils/prismaClient");
import { Prisma } from "../types/prisma";

const addCategory = async (category: Prisma.CategoryCreateInput) => {
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

const deleteCategory = async (id: string) => {
    const deletedCat = await prisma.category.delete({
        where: {id}
    });
    return {deletedCategory: deletedCat};
}

export {addCategory, getCategories, deleteCategory};
