// DOM Elements
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const registerContainer = document.getElementById("registerContainer");
const loginContainer = document.getElementById("loginContainer");
const showRegisterLink = document.getElementById("showRegister");
const showLoginLink = document.getElementById("showLogin");

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Helper: Show error messages
function showError(message) {
  // Create or update error message element
  let errorDiv = document.querySelector('.error-message');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
      background: rgba(255, 0, 0, 0.1);
      color: #ff6b6b;
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 15px;
      border: 1px solid rgba(255, 0, 0, 0.3);
      text-align: center;
      font-size: 14px;
    `;
  }
  errorDiv.textContent = message;
  
  const activeForm = document.querySelector('.form-container:not(.hidden)');
  const form = activeForm.querySelector('form');
  form.insertBefore(errorDiv, form.firstChild);
  
  // Remove error after 5 seconds
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.remove();
    }
  }, 5000);
}

// Helper: Show success messages
function showSuccess(message) {
  let successDiv = document.querySelector('.success-message');
  if (!successDiv) {
    successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
      background: rgba(0, 255, 0, 0.1);
      color: #51cf66;
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 15px;
      border: 1px solid rgba(0, 255, 0, 0.3);
      text-align: center;
      font-size: 14px;
    `;
  }
  successDiv.textContent = message;
  
  const activeForm = document.querySelector('.form-container:not(.hidden)');
  const form = activeForm.querySelector('form');
  form.insertBefore(successDiv, form.firstChild);
  
  // Remove success message after 3 seconds
  setTimeout(() => {
    if (successDiv.parentNode) {
      successDiv.remove();
    }
  }, 3000);
}

// Helper: Clear previous messages
function clearMessages() {
  const errorMsg = document.querySelector('.error-message');
  const successMsg = document.querySelector('.success-message');
  if (errorMsg) errorMsg.remove();
  if (successMsg) successMsg.remove();
}

// Helper: add fade/slide transitions for visibility toggle
function toggleForms(showLogin) {
  clearMessages();
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
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessages();
  
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const userType = document.getElementById("userType").value;

  if (!email || !password) {
    showError("Please fill in all fields");
    return;
  }

  // Show loading state
  const btn = loginForm.querySelector('button[type="submit"]');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Logging in...";

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        userType
      })
    });

    const data = await response.json();

    if (data.success) {
      // Store token in localStorage (consider using httpOnly cookies in production)
      localStorage.setItem('authToken', data.data.token);
      localStorage.setItem('userData', JSON.stringify(data.data.user));
      
      showSuccess("Login successful! Redirecting...");
      
      // Redirect based on user type
      setTimeout(() => {
        if (userType === "admin") {
          window.location.href = "admin.html";
        } else {
          window.location.href = "employee.html";
        }
      }, 1500);
    } else {
      showError(data.message || "Login failed");
    }
  } catch (error) {
    console.error('Login error:', error);
    showError("Connection error. Please try again.");
  } finally {
    // Reset button state
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

// Handle Registration
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessages();
  
  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();
  const employeeId = document.getElementById("employeeId").value.trim();

  if (!fullName || !email || !password || !employeeId) {
    showError("Please fill in all fields");
    return;
  }

  // Basic validation
  if (password.length < 6) {
    showError("Password must be at least 6 characters long");
    return;
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    showError("Please enter a valid email address");
    return;
  }

  // Show loading state
  const btn = registerForm.querySelector('button[type="submit"]');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Registering...";

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName,
        email,
        password,
        employeeId
      })
    });

    const data = await response.json();

    if (data.success) {
      showSuccess("Registration successful! Please login with your credentials.");
      registerForm.reset();
      
      // Switch to login form after 2 seconds
      setTimeout(() => {
        toggleForms(true);
      }, 2000);
    } else {
      if (data.errors && data.errors.length > 0) {
        // Show validation errors
        const errorMessages = data.errors.map(err => err.msg).join(', ');
        showError(errorMessages);
      } else {
        showError(data.message || "Registration failed");
      }
    }
  } catch (error) {
    console.error('Registration error:', error);
    showError("Connection error. Please try again.");
  } finally {
    // Reset button state
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

// Check if user is already logged in
function checkAuthStatus() {
  const token = localStorage.getItem('authToken');
  const userData = localStorage.getItem('userData');
  
  if (token && userData) {
    try {
      const user = JSON.parse(userData);
      // Redirect to appropriate dashboard
      if (user.userType === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'employee.html';
      }
    } catch (error) {
      // Clear invalid data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    }
  }
}

// Utility function to make authenticated API calls
async function makeAuthenticatedRequest(url, options = {}) {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // If unauthorized, clear stored auth data and redirect to login
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = 'index.html';
    return null;
  }
  
  return response;
}

// Logout function (for use in other pages)
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  window.location.href = 'index.html';
}

// Check auth status on page load
document.addEventListener('DOMContentLoaded', () => {
  // Only check auth status on login page
  if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    checkAuthStatus();
  }
});

// Export functions for use in other files
window.authUtils = {
  makeAuthenticatedRequest,
  logout,
  checkAuthStatus
};