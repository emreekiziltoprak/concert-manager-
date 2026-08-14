
import prisma = require("../utils/prismaClient");

const getUserProfile = async (userId: string) => {
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

        // Destructured out rather than deselected, so the hash never reaches a
        // response body. `passwordHash` is intentionally unused.
        const { passwordHash, ...safeProfileData } = profileData;
        return safeProfileData;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export { getUserProfile };
