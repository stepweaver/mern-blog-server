const mongoose = require('mongoose');

const dbConnect = async () => {
  mongoose.connection.on('error', (err) => {
    console.error(`MongoDB connection error: ${err}`);
  });

  mongoose.connection.once('open', () => {
    console.log('DB Connection successful');
  });

  mongoose.connect(process.env.MONGODB_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });
};

module.exports = dbConnect;