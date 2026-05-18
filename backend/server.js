const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const Razorpay = require('razorpay');

const app = express();
const PORT = 8000;

// Razorpay Configuration
const razorpay = new Razorpay({
    key_id: 'rzp_test_SlArpAeb3Nrchv',
    key_secret: 'w0h4lzEFUmy15U4ic8rPwo49'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));

// Data Directory and Files
const DATA_DIR = path.join(__dirname, 'data');
const USERS_DB_FILE = path.join(DATA_DIR, 'users_db.json');
const BOOKINGS_DB_FILE = path.join(DATA_DIR, 'bookings_db.json');
const ENQUIRIES_DB_FILE = path.join(DATA_DIR, 'enquiries_db.json');
const FAVORITES_DB_FILE = path.join(DATA_DIR, 'favorites_db.json');

// Initialize databases
async function initDatabases() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        try {
            await fs.access(USERS_DB_FILE);
        } catch {
            await fs.writeFile(USERS_DB_FILE, JSON.stringify({}));
        }

        try {
            await fs.access(BOOKINGS_DB_FILE);
        } catch {
            await fs.writeFile(BOOKINGS_DB_FILE, JSON.stringify([]));
        }

        try {
            await fs.access(ENQUIRIES_DB_FILE);
        } catch {
            await fs.writeFile(ENQUIRIES_DB_FILE, JSON.stringify([]));
        }

        try {
            await fs.access(FAVORITES_DB_FILE);
        } catch {
            await fs.writeFile(FAVORITES_DB_FILE, JSON.stringify({}));
        }
    } catch (err) {
        console.error("Error initializing databases:", err);
    }
}

initDatabases();

// Helper functions
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

async function loadUsers() {
    const data = await fs.readFile(USERS_DB_FILE, 'utf-8');
    return JSON.parse(data);
}

async function saveUsers(users) {
    await fs.writeFile(USERS_DB_FILE, JSON.stringify(users, null, 2));
}

async function loadBookings() {
    const data = await fs.readFile(BOOKINGS_DB_FILE, 'utf-8');
    return JSON.parse(data);
}

async function saveBookings(bookings) {
    await fs.writeFile(BOOKINGS_DB_FILE, JSON.stringify(bookings, null, 2));
}

async function loadEnquiries() {
    const data = await fs.readFile(ENQUIRIES_DB_FILE, 'utf-8');
    return JSON.parse(data);
}

async function saveEnquiries(enquiries) {
    await fs.writeFile(ENQUIRIES_DB_FILE, JSON.stringify(enquiries, null, 2));
}

async function loadFavorites() {
    try {
        const data = await fs.readFile(FAVORITES_DB_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
}

async function saveFavorites(favorites) {
    await fs.writeFile(FAVORITES_DB_FILE, JSON.stringify(favorites, null, 2));
}

// Routes

// 1. Register
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const users = await loadUsers();

        if (users[username]) {
            return res.status(400).json({ detail: "Username already exists" });
        }

        users[username] = {
            email,
            password: hashPassword(password),
            created_at: new Date().toISOString()
        };

        await saveUsers(users);
        res.json({ message: "Registration successful", username });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// 2. Login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const users = await loadUsers();

        if (!users[username]) {
            return res.status(401).json({ detail: "Invalid username or password" });
        }

        const storedPassword = users[username].password;
        if (storedPassword === hashPassword(password)) {
            return res.json({
                message: "Login successful",
                username: username,
                email: users[username].email
            });
        }

        res.status(401).json({ detail: "Invalid username or password" });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// 3. Create Booking
app.post('/book', async (req, res) => {
    try {
        const { destination, start_date, end_date, num_people, package_type, username, payment_method, payment_id } = req.body;
        const users = await loadUsers();

        if (!users[username]) {
            return res.status(401).json({ detail: "User not found" });
        }

        const bookings = await loadBookings();
        const newBooking = {
            id: Math.floor(10000 + Math.random() * 90000).toString(),
            username,
            destination,
            start_date,
            end_date,
            num_people,
            package_type,
            payment_method,
            payment_id: payment_id || null,
            status: payment_method === 'Online' ? 'confirmed' : 'pending',
            created_at: new Date().toISOString()
        };

        bookings.push(newBooking);
        await saveBookings(bookings);

        res.json({
            message: "Booking created successfully",
            booking_id: newBooking.id,
            booking: newBooking
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// Razorpay: Create Order
app.post('/create-order', async (req, res) => {
    try {
        const { amount, currency } = req.body;
        const options = {
            amount: amount * 100, // amount in the smallest currency unit (paise)
            currency: currency || "INR",
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// Razorpay: Verify Payment
app.post('/verify-payment', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", "w0h4lzEFUmy15U4ic8rPwo49")
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            return res.json({ message: "Payment verified successfully" });
        } else {
            return res.status(400).json({ detail: "Invalid payment signature" });
        }
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// 3.5 Create Enquiry
app.post('/enquiry', async (req, res) => {
    try {
        const { username, address, place, tripPackage, message } = req.body;
        
        const enquiries = await loadEnquiries();
        const newEnquiry = {
            id: Math.floor(10000 + Math.random() * 90000).toString(),
            username,
            address,
            place,
            tripPackage,
            message,
            status: "pending",
            created_at: new Date().toISOString()
        };

        enquiries.push(newEnquiry);
        await saveEnquiries(enquiries);

        res.json({
            message: "Enquiry submitted successfully",
            enquiry_id: newEnquiry.id
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// 4. Get User Bookings
app.get('/bookings/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const users = await loadUsers();

        if (!users[username]) {
            return res.status(401).json({ detail: "User not found" });
        }

        const bookings = await loadBookings();
        const userBookings = bookings.filter(b => b.username === username);

        // Also fetch enquiries for this user
        const enquiries = await loadEnquiries();
        const userEnquiries = enquiries.filter(e => e.username === username);

        res.json({ 
            bookings: userBookings,
            enquiries: userEnquiries
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// 5. Get Single Booking
app.get('/booking/:booking_id', async (req, res) => {
    try {
        const { booking_id } = req.params;
        const bookings = await loadBookings();
        const booking = bookings.find(b => b.id === booking_id);

        if (!booking) {
            return res.status(404).json({ detail: "Booking not found" });
        }

        res.json(booking);
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// 6. Delete Booking (Remove from DB)
app.delete('/booking/:booking_id', async (req, res) => {
    try {
        const { booking_id } = req.params;
        let bookings = await loadBookings();
        const initialLength = bookings.length;
        
        bookings = bookings.filter(b => b.id !== booking_id);

        if (bookings.length === initialLength) {
            return res.status(404).json({ detail: "Booking not found" });
        }

        await saveBookings(bookings);
        res.json({ message: "Booking deleted successfully", booking_id });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// 6.5 Delete Enquiry
app.delete('/enquiry/:enquiry_id', async (req, res) => {
    try {
        const { enquiry_id } = req.params;
        let enquiries = await loadEnquiries();
        const initialLength = enquiries.length;
        
        enquiries = enquiries.filter(e => e.id !== enquiry_id);

        if (enquiries.length === initialLength) {
            return res.status(404).json({ detail: "Enquiry not found" });
        }

        await saveEnquiries(enquiries);
        res.json({ message: "Enquiry deleted successfully", enquiry_id });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// 8. Favorites (Wishlist) Endpoints

// 8.1 Add to Favorites
app.post('/favorite', async (req, res) => {
    try {
        const { username, destination } = req.body;
        const favorites = await loadFavorites();

        if (!favorites[username]) {
            favorites[username] = [];
        }

        if (!favorites[username].includes(destination)) {
            favorites[username].push(destination);
            await saveFavorites(favorites);
        }

        res.json({ message: "Added to favorites", favorites: favorites[username] });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// 8.2 Remove from Favorites
app.post('/favorite-remove', async (req, res) => {
    try {
        const { username, destination } = req.body;
        const favorites = await loadFavorites();

        if (favorites[username]) {
            favorites[username] = favorites[username].filter(d => d !== destination);
            await saveFavorites(favorites);
        }

        res.json({ message: "Removed from favorites", favorites: favorites[username] || [] });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// 8.3 Get Favorites
app.get('/favorites/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const favorites = await loadFavorites();
        res.json({ favorites: favorites[username] || [] });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// 7. Get Packages
app.get('/packages', (req, res) => {
    const packages = [
        { id: 1, name: "Budget", price: 500, description: "Economy travel package" },
        { id: 2, name: "Standard", price: 1000, description: "Comfortable travel package" },
        { id: 3, name: "Premium", price: 2000, description: "Luxury travel package" },
        { id: 4, name: "VIP", price: 5000, description: "All-inclusive VIP experience" }
    ];
    res.json(packages);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
