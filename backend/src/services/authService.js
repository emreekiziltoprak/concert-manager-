const prisma = require("../utils/prismaClient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//function for registering a user
const register = async ({email, password, fullName}) => {
    const existingUser = await prisma.user.findUnique({
      where: {email}
    });

    if(existingUser) throw new Error("This user is registered")

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            email, passwordHash, fullName
        }
    });

    return {
        id: user.id, 
        email: user.email,
        fullName: user.fullName,
        role: user.role
    };


}

const login = async ({email, password}) => {
    const user = await prisma.user.findUnique({
        where: {email}
    });

    if(!user) throw new Error("User cant be found");

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if(!isValid) throw new Error("Email or password is wrong");

    const token = jwt.sign(
        {userId: user.id, role: user.role, email: user.email},
        process.env.JWT_SECRET,
        {expiresIn: "7d"}

    );

    return { token, user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
    }}
}

module.exports = {
    register, login
};
