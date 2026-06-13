const userService = require('../services/usersService');


const getUserProfile = async (req, res) => {
  console.log("get user p")

  try {
    const userId = req.user.userId;
    const userProfileInformation = await userService.getUserProfile(userId);    
    res.status(200).json(userProfileInformation);
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.  status(500).json({ error: "User info cant be fetched." });
  }
};

module.exports = {getUserProfile}