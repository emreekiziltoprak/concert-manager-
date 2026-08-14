import type { Request, Response } from "express";
import * as categoryService from "../services/categoryService";
import { errorMessage } from "../utils/errorMessage";

const addCategory = async (req: Request, res: Response) => {
    try {
        const successResponse = await categoryService.addCategory(req.body);
        res.status(201).json(successResponse);
    } catch(e){
        res.status(400).json({error: errorMessage(e)});
    }
}

const getCategories = async (req: Request, res: Response) => {
    try {
        const allCat = await categoryService.getCategories();
        return res.status(200).json({categories: allCat});
    } catch(e) {
        res.status(500).json({error: "Kategoriler getirilirken bir hata oluştu."});
    }
}

const deleteCategory = async (req: Request, res: Response) => {
    try {
        const categoryId = req.body.id as string;

        const result = await categoryService.deleteCategory(categoryId);
        return res.status(200).json(result);
    } catch(e) {
        return res.status(400).json({error: errorMessage(e)});
    }
}

export {
    addCategory,
    getCategories,
    deleteCategory
}
