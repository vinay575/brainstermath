
// Load all requests (pending, approved, rejected)
async function loadAllRequests() {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`${API_URL}/level-access/all`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      window.allRequests = await response.json();
      renderRequestsTable();
      updateRequestBadge();
    }
  } catch (error) {
    console.error('Error loading requests:', error);
  }
}

// Render requests table
function renderRequestsTable() {
  const tbody = document.getElementById('requestsTableBody');
  const filter = document.getElementById('requestStatusFilter')?.value || 'all';
  
  if (!window.allRequests || window.allRequests.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-8 text-gray-500">No requests found</td>
      </tr>
    `;
    return;
  }
  
  let requestsToShow = window.allRequests;
  if (filter !== 'all') {
    requestsToShow = window.allRequests.filter(req => req.status === filter);
  }
  
  if (requestsToShow.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-8 text-gray-500">No ${filter} requests</td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = requestsToShow.map(req => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    const statusClass = statusColors[req.status] || 'bg-gray-100 text-gray-800';
    
    return `
      <tr class="hover:bg-gray-50">
        <td class="py-3 px-4">${req.student_name}</td>
        <td class="py-3 px-4 text-sm">${req.student_email}</td>
        <td class="py-3 px-4 text-center">
          <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Level ${req.current_level}</span>
        </td>
        <td class="py-3 px-4 text-center">
          <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-semibold">Level ${req.requested_level}</span>
        </td>
        <td class="py-3 px-4">
          <span class="px-3 py-1 ${statusClass} rounded-full text-xs font-medium uppercase">${req.status}</span>
        </td>
        <td class="py-3 px-4 text-sm text-gray-600">${new Date(req.created_at).toLocaleDateString()}</td>
        <td class="py-3 px-4">
          ${req.status === 'pending' ? `
            <div class="flex space-x-2">
              <button 
                onclick="approveRequest(${req.id}, '${req.student_name}')"
                class="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition font-semibold"
              >
                ✓ Approve
              </button>
              <button 
                onclick="rejectRequest(${req.id}, '${req.student_name}')"
                class="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition font-semibold"
              >
                ✗ Reject
              </button>
            </div>
          ` : `
            <span class="text-sm text-gray-500">
              ${req.processed_by_email ? `By: ${req.processed_by_email}` : 'Processed'}
            </span>
          `}
        </td>
      </tr>
    `;
  }).join('');
}








// Popup function for success/error
function showPopup(message, type = 'success') {
  let popup = document.getElementById('popup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'popup';
    document.body.appendChild(popup);
    Object.assign(popup.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      color: '#fff',
      zIndex: 1000,
      opacity: 0,
      transition: 'opacity 0.3s ease, transform 0.3s ease',
      transform: 'translateY(-20px)',
    });
  }
  popup.textContent = message;
  popup.style.backgroundColor = type === 'success' ? '#4ade80' : '#f87171';
  popup.style.opacity = 1;
  popup.style.transform = 'translateY(0)';
  setTimeout(() => {
    popup.style.opacity = 0;
    popup.style.transform = 'translateY(-20px)';
  }, 3000);
}

// Simple confirm modal
function showConfirmModal(title, callback) {
  const modal = document.createElement('div');
  Object.assign(modal.style, {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    background: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1001
  });

  const box = document.createElement('div');
  Object.assign(box.style, {
    background: '#fff', padding: '20px', borderRadius: '8px',
    maxWidth: '350px', width: '90%', textAlign: 'center'
  });

  const h3 = document.createElement('h3');
  h3.textContent = title;
  h3.style.marginBottom = '20px';

  const yesBtn = document.createElement('button');
  yesBtn.textContent = 'Yes';
  Object.assign(yesBtn.style, { marginRight: '10px', padding: '8px 16px', cursor: 'pointer' });
  yesBtn.onclick = () => { document.body.removeChild(modal); callback(true); };

  const noBtn = document.createElement('button');
  noBtn.textContent = 'No';
  Object.assign(noBtn.style, { padding: '8px 16px', cursor: 'pointer' });
  noBtn.onclick = () => { document.body.removeChild(modal); callback(false); };

  box.appendChild(h3);
  box.appendChild(yesBtn);
  box.appendChild(noBtn);
  modal.appendChild(box);
  document.body.appendChild(modal);
}

// Approve request
async function approveRequest(requestId, studentName) {
  showConfirmModal(`Approve level access for ${studentName}?`, async (confirmed) => {
    if (!confirmed) return;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/level-access/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        showPopup(`Level access approved for ${studentName}!`, 'success');
        loadAllRequests();
      } else {
        const error = await res.json();
        showPopup(error.error || 'Failed to approve request', 'error');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      showPopup('Failed to approve request', 'error');
    }
  });
}

// Reject request
async function rejectRequest(requestId, studentName) {
  showConfirmModal(`Reject level access for ${studentName}?`, async (confirmed) => {
    if (!confirmed) return;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/level-access/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        showPopup(`Level access request rejected for ${studentName}.`, 'success');
        loadAllRequests();
      } else {
        const error = await res.json();
        showPopup(error.error || 'Failed to reject request', 'error');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      showPopup('Failed to reject request', 'error');
    }
  });
}









// Filter requests table
function filterRequestsTable() {
  renderRequestsTable();
}

// Auto-refresh requests every 30 seconds
setInterval(loadAllRequests, 30000);
