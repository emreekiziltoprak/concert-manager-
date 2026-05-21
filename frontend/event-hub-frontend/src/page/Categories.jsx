import React, { useState, useEffect } from 'react'; // 1. useEffect import edildi
import api from "../config/axios";
import { Box, TextField, Button, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
const Categories = () => {
    const [form, setForm] = useState({
        name: "",
        slug: "",
        iconUrl: ""
    });
    const [cats, setCats] = useState([]);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const res = await api.post("/categories", form);
            console.log("success:", res.data);
            
            if (res.data) {
                setCats([...cats, res.data.category || { ...form, id: Date.now() }]);
            }

            setForm({ name: "", slug: "", iconUrl: "" });
            
        } catch (err) {
            console.error("error in adding categories", err);
        }
    };

    useEffect(() => {
        api.get("/categories").then((resp) => {
            setCats(resp.data.categories || resp.data); 
        }).catch(err => console.error("Kategoriler yüklenemedi:", err));
    }, []);

    return (
        <Box
            sx={{
                maxWidth: 400,
                margin: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                mt: 5,
            }}
        >
            <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="h5">Add Category</Typography>

                <TextField
                    label="Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                />

                <TextField
                    label="Slug"
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    required
                />

                <TextField
                    label="Icon URL"
                    name="iconUrl"
                    value={form.iconUrl}
                    onChange={handleChange}
                />

                <Button type="submit" variant="contained">
                    Send
                </Button>
            </Box>

            <hr style={{ border: "0.5px solid #eee", width: "100%" }} />

            <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Category List</Typography>
                {cats && cats.length > 0 ? (
                    <List>
                        {cats.map((cat, index) => (
                            <ListItem key={cat.id || index} disablePadding sx={{ mb: 1 }}>
                                <ListItemAvatar>
                                <Avatar alt="Cindy Baker" src={cat.iconUrl} />
                              </ListItemAvatar>
                                <ListItemText 
                                    primary={cat.name} 
                                    secondary={cat.slug} 
                                />
                                <DeleteIcon onClick={()=>{
                                  try{
                                    api.delete("/categories", {
                                    data: {
                                      id: cat.id,
                                    },
                                  });

                                  setCats((prevCats) => prevCats.filter(i=> i.id!=cat.id));

                                  }catch(e) {
                                    console.error("error", e);
                                  }
                                }}/>
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Typography color="textSecondary">Henüz kategori eklenmemiş.</Typography>
                )}
            </Box>
        </Box>
    );
};

export default Categories;