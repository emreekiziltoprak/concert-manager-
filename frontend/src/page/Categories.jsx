import React, { useState } from 'react';
import { Paper, TextField, Button, Typography, Avatar, IconButton } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { createCategory, deleteCategory } from "../api/categories";
import { useCategories } from "../hooks/useCategories";

const Categories = () => {
    const [form, setForm] = useState({
        name: "",
        slug: "",
        iconUrl: ""
    });
    const { categories: cats, setCategories: setCats } = useCategories();

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await createCategory(form);
            console.log("success:", res.data);

            if (res.data) {
                setCats([...cats, res.data.category || { ...form, id: Date.now() }]);
            }

            setForm({ name: "", slug: "", iconUrl: "" });

        } catch (err) {
            console.error("error in adding categories", err);
        }
    };

    const handleDelete = async (categoryId) => {
        try {
            await deleteCategory(categoryId);
            setCats((prevCats) => prevCats.filter((i) => i.id !== categoryId));
        } catch (e) {
            console.error("error", e);
        }
    };

    return (
        <div className="page-container">
        <div className="categories-page">
            <Paper className="form-panel">
                <Typography variant="h5" className="form-panel__title">Add Category</Typography>

                <form onSubmit={handleSubmit} className="categories-page__form">
                    <TextField label="Name" name="name" value={form.name} onChange={handleChange} required fullWidth />
                    <TextField label="Slug" name="slug" value={form.slug} onChange={handleChange} required fullWidth />
                    <TextField label="Icon URL" name="iconUrl" value={form.iconUrl} onChange={handleChange} fullWidth />
                    <Button type="submit" variant="contained">
                        Send
                    </Button>
                </form>
            </Paper>

            <Paper className="form-panel">
                <Typography variant="h6" className="categories-page__list-title">Category List</Typography>
                {cats && cats.length > 0 ? (
                    cats.map((cat, index) => (
                        <div className="categories-page__item" key={cat.id || index}>
                            <div className="categories-page__item-info">
                                <Avatar alt={cat.name} src={cat.iconUrl} />
                                <div>
                                    <Typography>{cat.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">{cat.slug}</Typography>
                                </div>
                            </div>
                            <IconButton className="icon-action icon-action--danger" onClick={() => handleDelete(cat.id)} aria-label="Delete category">
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </div>
                    ))
                ) : (
                    <Typography color="text.secondary">Henüz kategori eklenmemiş.</Typography>
                )}
            </Paper>
        </div>
        </div>
    );
};

export default Categories;
