const fs = require('fs');
const csv = require('csv-parser');
const mysql = require('mysql2/promise');
const path = require('path');

// Cấu hình kết nối MySQL (Mặc định XAMPP không có pass)
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'english_learning_app',
    port: 3306 // Hoặc 3305 nếu dùng bản MySQL lúc nãy, nhưng hiện tại đang chạy XAMPP 3306
};

// Đường dẫn tới file CSV đã cào dữ liệu
const CSV_FILE_PATH = path.join('..', '..', 'DataSet', 'ENGLISH_CERF_WORDS_ENHANCED.csv');

async function importData() {
    let connection;
    try {
        console.log("Đang kết nối vào cơ sở dữ liệu MySQL...");
        connection = await mysql.createConnection(dbConfig);
        console.log("✅ Kết nối thành công!");

        const wordsToInsert = [];
        
        console.log(`Đang đọc file CSV: ${CSV_FILE_PATH}`);
        
        // Đọc file CSV
        await new Promise((resolve, reject) => {
            fs.createReadStream(CSV_FILE_PATH)
                .pipe(csv())
                .on('data', (row) => {
                    // Lọc dữ liệu tránh lỗi null hoặc quá dài
                    const headword = row.headword ? row.headword.substring(0, 100) : '';
                    const cefr = row.CEFR ? row.CEFR.substring(0, 10) : null;
                    const phonetic = row.phonetic ? row.phonetic.substring(0, 100) : null;
                    const image_url = row.image || null;

                    if (headword) {
                        wordsToInsert.push([headword, cefr, phonetic, image_url]);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`Đã đọc xong ${wordsToInsert.length} từ vựng từ CSV. Đang bắt đầu import vào Database (quá trình này có thể mất vài chục giây)...`);

        // Chia nhỏ mảng để insert (batch insert) tránh lỗi gói tin MySQL quá lớn
        const batchSize = 1000;
        let insertedCount = 0;

        for (let i = 0; i < wordsToInsert.length; i += batchSize) {
            const batch = wordsToInsert.slice(i, i + batchSize);
            
            // Câu lệnh SQL Insert (sử dụng Ignore để bỏ qua nếu trùng lặp)
            const query = `
                INSERT IGNORE INTO words (headword, cefr_level, phonetic, image_url)
                VALUES ?
            `;
            
            await connection.query(query, [batch]);
            insertedCount += batch.length;
            console.log(`Đã import thành công: ${insertedCount} / ${wordsToInsert.length} từ.`);
        }

        console.log("🎉 XONG! Đã import toàn bộ dữ liệu vào bảng 'words'.");

    } catch (error) {
        console.error("❌ Xảy ra lỗi trong quá trình import:", error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log("Đã đóng kết nối Database.");
        }
    }
}

importData();
