// test-email.js
require('dotenv').config(); // .env dosyasındaki EMAIL_USER ve PASS için
const { sendTicketEmail } = require('./src/services/emailService');
const runTest = async () => {
    console.log("⏳ E-posta testi başlatılıyor...");

    // Veritabanından geliyormuş gibi sahte (mock) bir veri hazırlıyoruz
    const mockTicketData = {
        event: {
            title: "Rock Festivali 2026",
            date: new Date("2026-07-15T20:00:00"),
            location: "KüçükÇiftlik Park, İstanbul"
        },
        orderItem: [
            {
                ticketType: { name: "VIP" },
                tickets: [{ id: "VIP-98765432" }, { id: "VIP-12345678" }]
            },
            {
                ticketType: { name: "Standart" },
                tickets: [{ id: "STD-55555555" }]
            }
        ]
    };

    try {
        // KENDİ E-POSTA ADRESİNİ YAZ BURAYA
        await sendTicketEmail("emre.kzltprkk@gmail.com", "Emre Kızıltoprak", mockTicketData);
        console.log("✅ Test başarılı! Lütfen mail kutunu kontrol et.");
    } catch (error) {
        console.error("❌ E-posta gönderilirken hata oluştu:", error);
    }
};

runTest();