const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

// Define the user schema
const userSchema = new mongoose.Schema({
  fname: String,
  lname: String,
  mobile: String,
  email: String,
  password: String
});

// Create the User model
const UserModel = mongoose.model("User", userSchema);

// Define schema for job registration
const jobRegistrationSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  message: String
});

// Create the JobRegistration model
const JobRegistration = mongoose.model("JobRegistration", jobRegistrationSchema);

// Define schema for products
const productSchema = new mongoose.Schema({
  title: String,
  price: Number,
  size: String,
  quantity: Number,
  image: String
});

const Product = mongoose.model("Product", productSchema);

// Initialize Express app
const app = express();
app.set('view engine', 'ejs');

// Connect to MongoDB database
mongoose.connect('mongodb://127.0.0.1:27017/craftfarm', {
  useUnifiedTopology: true,
  useNewUrlParser: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Error connecting to MongoDB:', err));

// Configure middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));
app.use(express.static('public'));

// Define routes
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ email, password });
    if (user) {
      req.session.userId = user._id;
      console.log('Login successful');
      res.send('<script>alert("Login successful"); window.location.href = "/home";</script>');
    } else {
      console.log('Invalid email or password');
      res.send('<script>alert("Invalid email or password"); window.location.href = "/login";</script>');
    }
  } catch (error) {
    console.error('Error while querying the database:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', async (req, res) => {
  const { fname, lname, mobile, email, password } = req.body;
  const phnRegex=/^.{10,10}$/;
  if (!phnRegex.test(mobile)) {
    console.error('Invalid mobileno');
    return res.status(400).send('Invalid mobileno.');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('Invalid email format');
    return res.status(400).send('Invalid email format.');
  }
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,20}$/;
  if (!passwordRegex.test(password)) {
    console.error('Invalid password format');
    return res.status(400).send('Invalid password format.');
  }
  try {
    const user = await UserModel.create({ fname, lname, mobile, email, password });
    if (user) {
      console.log('User signed up successfully');
      res.send('<script>alert("User signed up successfully"); window.location.href = "/login";</script>');
    } else {
      res.redirect('/register');
    }
  } catch (error) {
    console.error('Error signing up user:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/home', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.redirect('/login');
    }
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.render('home', { user }); // Assuming you're using a templating engine like EJS
  } catch (error) {
    console.error('Error retrieving user information:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/jobregistration', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'jobregistration.html'));
});

app.post('/jobregistration', async (req, res) => {
  const { name, email, phone, message } = req.body;
  try {
    const jobRegistration = await JobRegistration.create({ name, email, phone, message });
    if (jobRegistration) {
      console.log('Job registration successful');
      res.send('<script>alert("Job registration successful"); window.location.href = "Joboffers.html";</script>');
    } else {
      res.redirect('/jobregistration');
    }
  } catch (error) {
    console.error('Error while registering for job:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Route to save cart items
app.post("/api/cart", (req, res) => {
    const products = req.body.products;
    Product.insertMany(products)
        .then(() => res.status(201).json({ message: "Cart items saved successfully" }))
        .catch((err) => res.status(500).json({ error: err.message }));
});

// Start the server
const port = process.env.PORT || 8088;
app.listen(port, () => console.log(`Server is running at http://localhost:${port}`));
