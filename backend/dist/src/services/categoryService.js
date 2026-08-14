"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.getCategories = exports.addCategory = void 0;
// `import = require` rather than a default import: prismaClient uses `export =`,
// and this form emits a bare `require()` with no __importDefault wrapper, so the
// generated JS is byte-for-byte what the .js file did.
const prisma = require("../utils/prismaClient");
const addCategory = async (category) => {
    const foundCategory = await prisma.category.findUnique({
        where: { name: category.name },
    });
    if (foundCategory)
        throw new Error("Category already exists");
    const categoryResp = await prisma.category.create({ data: category });
    return { message: "Category successfully created", categoryResp };
};
exports.addCategory = addCategory;
const getCategories = async () => {
    return await prisma.category.findMany();
};
exports.getCategories = getCategories;
const deleteCategory = async (id) => {
    const deletedCat = await prisma.category.delete({
        where: { id }
    });
    return { deletedCategory: deletedCat };
};
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=categoryService.js.map