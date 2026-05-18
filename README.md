# Sneha Travel Explore - Execution Guide

Follow these steps to run the project locally.

## Prerequisites
- Node.js installed.
- Dependencies installed. If not, run:
  ```bash
  cd backend
  npm install
  ```

## Step 1: Run the Backend
The backend is built with Node.js and Express.
1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Start the server:
   ```bash
   node server.js
   ```
   The backend will be running at `http://localhost:8000`.

## Step 2: Run the Frontend
You can run the frontend in two ways:

### Option A: Open directly (Simplest)
Just double-click `index.html` in your file explorer to open it in your browser.

### Option B: Use a local server (Recommended)
This avoids some browser security restrictions.
1. Open another terminal in the root directory (`sneha`).
2. Run:
   ```bash
   python -m http.server 3000
   ```
3. Open `http://localhost:3000` in your browser.

## How to use the app
1. Go to the **Register** page and create an account.
2. **Login** with your new credentials.
3. You will be redirected to the **Booking Dashboard**.
4. Go to **Packages**, click "Book Now" on any destination.
5. Fill in the details and submit your booking!
6. View your confirmed bookings in the "My Bookings" section.
