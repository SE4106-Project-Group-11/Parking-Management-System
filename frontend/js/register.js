// Show/hide user ID , permitType for employee only
document.getElementById('userType').addEventListener('change', function () {
  const userIdGroup = document.getElementById('userIdGroup');
  const userIdInput = document.getElementById('userId');
  const permitGroup = document.getElementById('permitGroup');
  const permitType = document.getElementById('permitType');


if (this.value === 'employee') {
    // Set default to 'annual' and hide permit field
    permitType.value = 'annual';
    permitGroup.style.display = 'none';
    permitType.removeAttribute('required');
    permitType.setAttribute('disabled', 'true');
  } else {
    // Reset if non-employee or visitor
    permitType.value = '';
    permitGroup.style.display = 'block';
    permitType.setAttribute('required', 'required');
    permitType.removeAttribute('disabled');
  }
if (this.value === 'employee') {
    
    userIdGroup.style.display = 'block';
    userIdInput.required = true;
       
  } else {
     

    userIdGroup.style.display = 'none';
    userIdInput.required = false;
    userIdInput.value = '';
    
  }  

});

document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const userType = document.getElementById('userType').value;
  const empID = document.getElementById('userId').value;
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const nic = document.getElementById('nic').value;
  const address = document.getElementById('address').value;
  const telNo = document.getElementById('telNo').value;
  const vehicleNo = document.getElementById('vehicleNo').value;
  const permitType = document.getElementById('permitType').value;
  const vehicleType = document.getElementById('vehicleType').value;
  const password = document.getElementById('password').value;

  // Payload for all roles
  const payload = {
    userType,
    empID, // will be ignored for visitors/non-employees
    name,
    email,
    nic,
    address,
    telNo,
    vehicleNo,
    vehicleType,
    permitType,
    password
  };

  try {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      document.getElementById('registerForm').style.display = 'none';
      document.getElementById('registerSuccess').style.display = 'block';
    } else {
      alert(data.message || 'Registration failed.');
    }
  } catch (err) {
    console.error(err);
    alert('An error occurred during registration.');
  }
});
