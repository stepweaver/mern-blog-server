const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();

const dbConnect = require('./config/db/dbConnect');
const userRoutes = require('./route/users/usersRoute');
const { errorHandler, notFound } = require('./middlewares/error/errorHandler');
const postRoute = require('./route/posts/postRoute');
const commentRoutes = require('./route/comments/commentRoutes');
const emailMsgRoute = require('./route/emailMsg/emailMsgRoute');
const categoryRoute = require('./route/category/categoryRoute');

const app = express();

// DB
dbConnect();

// Middleware
app.use(express.json());

// CORS
app.use(cors());

// Users route
app.use('/api/users', userRoutes);

// Post route
app.use('/api/posts', postRoute);

// Comment route
app.use('/api/comments', commentRoutes);

// Email route
app.use('/api/email', emailMsgRoute);

// Category route
app.use('/api/category', categoryRoute);

// Error handler
app.use(notFound);
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`Server is running on PORT ${PORT}`)
);
