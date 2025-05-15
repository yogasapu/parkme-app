const express = require('express');
const axios = require('axios');
require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;


const MIDTRANS_SERVER_KEY = process.env.SERVER_KEY;
const MIDTRANS_API_URL = process.env.API_URL;
console.log(process.env.API_URL);

app.use(cors());
app.use(bodyParser.json());

app.post('/create-qris', async (req, res) => {
    const { amount } = req.body;
    const orderId = 'ORDER-' + Date.now();

    const data = {
        payment_type: 'qris',
        transaction_details: {
            order_id: orderId,
            gross_amount: amount
        }
    };

    try {
        const response = await axios.post(MIDTRANS_API_URL, data, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64')
            }
        });

        res.json({
            success: true,
            order_id: orderId,
            qr_url: response.data.actions[0]?.url,
            transaction_data: response.data
        });
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Gagal membuat QRIS',
            error: error.response?.data || error.message
        });
    }
});

app.post('/create-va', async (req, res) => {
    const { amount, bank } = req.body;  // Mengambil jumlah dan bank dari request body
    const orderId = 'ORDER-' + Date.now();

    const data = {
        payment_type: 'va',
        transaction_details: {
            order_id: orderId,
            gross_amount: amount
        },
        bank_transfer: {
            bank: bank  // Pilihan bank yang akan digunakan (misalnya 'bca', 'mandiri', 'bni', dll)
        }
    };

    try {
        // Mengirim request ke API Midtrans untuk membuat transaksi VA
        const response = await axios.post(MIDTRANS_API_URL, data, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64')
            }
        });

        // Mengirimkan respons dengan URL untuk melakukan pembayaran
        res.json({
            success: true,
            order_id: orderId,
            va_number: response.data.va_numbers[0]?.va_number, // Nomor VA yang dapat digunakan untuk pembayaran
            transaction_data: response.data
        });
    } catch (error) {
        // Menangani error
        console.error(error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Gagal membuat Virtual Account',
            error: error.response?.data || error.message
        });
    }
});


app.get('/check-status/:order_id', async (req, res) => {
    const { order_id } = req.params;
    try {
        const response = await axios.get(`https://api.sandbox.midtrans.com/v2/${order_id}/status`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64')
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
});

app.post('/cancel-transaction', async (req, res) => {
    const { order_id } = req.body;

    try {
        // Memanggil API Midtrans untuk membatalkan transaksi
        const response = await axios.post(`https://api.sandbox.midtrans.com/v2/${order_id}/cancel`, {}, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64')
            }
        });

        // Jika berhasil
        res.json({
            success: true,
            message: 'Transaksi berhasil dibatalkan',
            data: response.data
        });
    } catch (error) {
        // Menangani error
        console.error(error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Gagal membatalkan transaksi',
            error: error.response?.data || error.message
        });
    }
});


app.listen(port, () => {
    console.log(`✅ Midtrans QRIS backend running at http://localhost:${port}`);
});

