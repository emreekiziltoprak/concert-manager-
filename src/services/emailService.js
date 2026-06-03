const sendTicketEmail = async (userEmail, fullName, orderId) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            
            console.log("Mock Email Service");
            resolve(true); // İşlem başarılı diyoruz
        }, 1000); 
    });
};

module.exports = { sendTicketEmail };