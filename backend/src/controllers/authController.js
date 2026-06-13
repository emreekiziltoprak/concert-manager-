const authService = require("../services/authService");

const register = async (req, res) => {
    
    try {
        const user = await authService.register(req.body);
        res.status(201).json(user);
    }
    catch(e) {
        res.status(400).json({error: e.message});
    }
}

const login = async (req, res) => {
    try{
        const successResult = await authService.login(req.body);
        res.status(200).json(successResult);
    } catch(e){
        res.status(400).json({error: e.message});
    }
}

module.exports = {login, register};