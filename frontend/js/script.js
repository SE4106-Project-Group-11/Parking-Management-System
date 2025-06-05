// DOM Elements
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const registerContainer = document.getElementById("registerContainer");
const loginContainer = document.getElementById("loginContainer");
const showRegisterLink = document.getElementById("showRegister");
const showLoginLink = document.getElementById("showLogin");

// Helper: add fade/slide transitions for visibility toggle
function toggleForms(showLogin) {
  if (showLogin) {
    registerContainer.classList.remove("visible");
    registerContainer.classList.add("hidden");
    loginContainer.classList.remove("hidden");
    setTimeout(() => loginContainer.classList.add("visible"), 10);
  } else {
    loginContainer.classList.remove("visible");
    loginContainer.classList.add("hidden");
    registerContainer.classList.remove("hidden");
    setTimeout(() => registerContainer.classList.add("visible"), 10);
  }
}

// Toggle between login and register forms with animation
showRegisterLink.addEventListener("click", (e) => {
  e.preventDefault();
  toggleForms(false);
});

showLoginLink.addEventListener("click", (e) => {
  e.preventDefault();
  toggleForms(true);
});

// Handle Login
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const userType = document.getElementById("userType").value;

  if (!email || !password) {
    alert("Please fill in all fields");
    return;
  }

  // Simulate loading feedback
  const btn = loginForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = "Logging in...";

  setTimeout(() => {
    if (userType === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "employee.html";
    }
  }, 1000);
});

// Handle Registration
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();
  const employeeId = document.getElementById("employeeId").value.trim();

  if (!fullName || !email || !password || !employeeId) {
    alert("Please fill in all fields");
    return;
  }

  const btn = registerForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = "Registering...";

  setTimeout(() => {
    alert("Registration successful! Please login.");
    registerForm.reset();
    btn.disabled = false;
    btn.textContent = "Register";
    toggleForms(true);
  }, 1200);
});
