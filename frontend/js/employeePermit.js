document.addEventListener('DOMContentLoaded', () => {
  const userId       = localStorage.getItem('userId');
  const permitStatus = document.getElementById('permit-status');
  const dbUserId = localStorage.getItem('dbUserId');
  if (!userId || !permitStatus) return;

  fetch(`http://localhost:5000/api/permits/user/${dbUserId}`)
    .then(r => r.json())
    .then(data => {
      if (data.permit) {
        const p = data.permit;
        permitStatus.innerHTML = `
          <span class="status-badge status-active">
            Active until ${new Date(p.endDate).toISOString().split('T')[0]}
          </span>
          <p class="permit-detail">Vehicle: ${p.vehicleNo}</p>
        `;
      } else {
        permitStatus.innerHTML = '<p>No active permit.</p>';
      }
    })
    .catch(err => {
      console.error('Error fetching permit:', err);
      permitStatus.textContent = 'Failed to load permit.';
    });
});