function welcomeMessage() {
    alert("Welcome to Travel Explore!");
}

function submitForm() {
    alert("Thank you! Your message has been sent.");
    return false;
}

function gotopage(){
    window.location.href = "package.html";
}

function welcomeMessage() {
    alert("Welcome to Travel Explore!");
}

function submitForm() {
    alert("Thank you! Your message has been sent.");
    return false;
}

function gotopage(){
    window.location.href = "package.html";
}

// Smooth scroll to the main gallery content section
function scrollToContent() {
    const targetSection = document.querySelector('.gallery') || document.querySelector('.blog-section');
    if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth' });
    }
}