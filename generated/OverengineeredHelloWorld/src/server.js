const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

// Connect to MongoDB (dummy URI for example)
mongoose.connect('mongodb://localhost:27017/helloworld', { useNewUrlParser: true, useUnifiedTopology: true });

// Define a schema and model
const helloSchema = new mongoose.Schema({ message: String });
const Hello = mongoose.model('Hello', helloSchema);

// Ensure data is in the DB
Hello.create({ message: 'Hello, World!' });

// API to get the message
app.get('/api/hello', async (req, res) => {
    const hello = await Hello.findOne();
    res.send(hello.message);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
