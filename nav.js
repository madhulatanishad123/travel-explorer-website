// Theme Management
(function() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
})();

document.addEventListener('DOMContentLoaded', function() {
    const username = localStorage.getItem('username');
    const navUl = document.querySelector('nav ul');
    
    if (navUl) {
        let navHtml = `
            <li><a href="index.html">Home</a></li>
            <li><a href="package.html">Packages</a></li>
            <li><a href="gallery.html">Gallery</a></li>
            <li><a href="contact.html">Contact</a></li>
        `;

        if (username) {
            navHtml += `
                <li><a href="booking.html" style="font-weight: bold; color: #ffeb3b;">Dashboard</a></li>
                <li><a href="#" onclick="logout()">Logout (${username})</a></li>
            `;
        } else {
            navHtml += `
                <li><a href="login.html">Login</a></li>
                <li><a href="register.html">Register</a></li>
            `;
        }

        // Add theme toggle
        const theme = localStorage.getItem('theme') || 'light';
        navHtml += `
            <li><button id="theme-toggle-btn" class="theme-toggle" onclick="toggleTheme()">
                ${theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button></li>
        `;
        
        navUl.innerHTML = navHtml;
    }
});

function toggleTheme() {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
        btn.innerText = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
    }
}

function logout() {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("username");
        localStorage.removeItem("email");
        window.location.href = "index.html";
    }
}
