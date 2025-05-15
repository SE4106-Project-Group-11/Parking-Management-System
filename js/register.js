document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const registerSuccess = document.getElementById('registerSuccess');

    // Form validation
    function validateForm() {
        const userType = document.getElementById('userType').value;
        const userId = document.getElementById('userId').value;
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const telNo = document.getElementById('telNo').value;

        // Basic validation
        if (!userType || !userId || !name || !email || !telNo) {
            showError('Please fill in all fields');
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('Please enter a valid email address');
            return false;
        }

        // Phone number validation (basic)
        const phoneRegex = /^[\d\s-+()]{10,}$/;
        if (!phoneRegex.test(telNo)) {
            showError('Please enter a valid phone number');
            return false;
        }

        return true;
    }

    // Show error message
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        // Remove any existing error messages
        const existingError = document.querySelector('.alert-error');
        if (existingError) {
            existingError.remove();
        }

        // Insert error message after the form
        registerForm.parentNode.insertBefore(errorDiv, registerForm.nextSibling);

        // Remove error message after 3 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    // Handle form submission
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Collect form data
        const formData = {
            userType: document.getElementById('userType').value,
            userId: document.getElementById('userId').value,
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            telNo: document.getElementById('telNo').value
        };

        // TODO: Send data to backend
        // For now, just show success message
        registerForm.style.display = 'none';
        registerSuccess.style.display = 'block';

        // In a real application, you would send the data to your backend:
        /*
        fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                registerForm.style.display = 'none';
                registerSuccess.style.display = 'block';
            } else {
                showError(data.message || 'Registration failed. Please try again.');
            }
        })
        .catch(error => {
            showError('An error occurred. Please try again later.');
            console.error('Error:', error);
        });
        */
    });
}); 