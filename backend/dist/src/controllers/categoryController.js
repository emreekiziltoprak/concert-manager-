"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.getCategories = exports.addCategory = void 0;
const categoryService = __importStar(require("../services/categoryService"));
const errorMessage_1 = require("../utils/errorMessage");
const addCategory = async (req, res) => {
    try {
        const successResponse = await categoryService.addCategory(req.body);
        res.status(201).json(successResponse);
    }
    catch (e) {
        res.status(400).json({ error: (0, errorMessage_1.errorMessage)(e) });
    }
};
exports.addCategory = addCategory;
const getCategories = async (req, res) => {
    try {
        const allCat = await categoryService.getCategories();
        return res.status(200).json({ categories: allCat });
    }
    catch (e) {
        res.status(500).json({ error: "Kategoriler getirilirken bir hata oluştu." });
    }
};
exports.getCategories = getCategories;
const deleteCategory = async (req, res) => {
    try {
        // DİKKAT: req.body.id yerine, route'dan gelen req.params.categoryId'yi alıyoruz!
        // @types/express@5 types a param as `string | string[]`; this route
        // declares `:categoryId` once, so it is always the string form.
        const categoryId = req.params.categoryId;
        const result = await categoryService.deleteCategory(categoryId);
        return res.status(200).json(result);
    }
    catch (e) {
        return res.status(400).json({ error: (0, errorMessage_1.errorMessage)(e) });
    }
};
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=categoryController.js.map