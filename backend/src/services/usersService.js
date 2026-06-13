const prisma = require("../utils/prismaClient");

const getUserProfile = async (userId) => {
    try {
        const profileData = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                orders: {
                    where: { status: "SUCCESS" },
                    include: {
                        event: true,
                        orderItems: {
                            include: {
                                ticketType: true,
                                tickets: true
                            }
                        }
                    }
                },
                eventRoles: {
                    include: {
                        event: true
                    }
                }
            }
        });

        console.log("profile data", profileData);

        if (!profileData) {
            throw new Error("User not found.");
        }

        const { passwordHash, ...safeProfileData } = profileData;
        return safeProfileData;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

module.exports = { getUserProfile };