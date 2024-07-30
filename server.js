const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

dotenv.config({ path: './config/.env' });

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.CONN_STR, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('DB Connection Successful');
}).catch((error) => {
    console.error('DB Connection Error:', error);
});

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.set('view engine', 'ejs');

app.use(express.static('./public'));

app.use('/', require('./router/userRoutes'));

const port = process.env.PORT || 3030;
app.listen(port, () => {
    console.log(`Server has started on port ${port}`);
});
