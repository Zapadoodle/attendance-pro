// Form validation and live calculations
document.addEventListener('DOMContentLoaded', function() {
    // Validate attendance form
    const attendanceForm = document.getElementById('attendanceForm');
    if (attendanceForm) {
        attendanceForm.addEventListener('submit', function(e) {
            const total = parseInt(document.getElementById('total_classes')?.value) || 0;
            const attended = parseInt(document.getElementById('attended_classes')?.value) || 0;
            
            if (attended > total) {
                e.preventDefault();
                showAlert('Attended classes cannot be more than total classes!', 'danger');
            }
            
            if (total === 0) {
                e.preventDefault();
                showAlert('Total classes cannot be zero!', 'danger');
            }
        });
    }
    
// Live prediction for predict page with future expectations
document.addEventListener('DOMContentLoaded', function() {
    const predictForm = document.getElementById('predictForm');
    if (predictForm) {
        const totalInput = document.getElementById('total_classes');
        const attendedInput = document.getElementById('attended_classes');
        const futureClassesInput = document.getElementById('future_classes');
        const futureAttendanceInput = document.getElementById('future_attendance');
        const targetInput = document.getElementById('target_percentage');
        const liveResult = document.getElementById('liveResult');
        const liveResultText = document.getElementById('liveResultText');
        
        async function updateLiveResult() {
            const total = parseInt(totalInput.value) || 0;
            const attended = parseInt(attendedInput.value) || 0;
            const futureClasses = parseInt(futureClassesInput.value) || 0;
            const futureAttendance = parseInt(futureAttendanceInput.value) || 0;
            const target = parseFloat(targetInput.value) || 75;
            
            if (total > 0 && attended >= 0 && attended <= total) {
                // Validate future inputs
                if (futureAttendance > futureClasses) {
                    liveResultText.innerHTML = `<span class="text-danger">Future attendance cannot exceed future classes!</span>`;
                    liveResult.style.display = 'block';
                    return;
                }
                
                const currentPercentage = (attended / total * 100).toFixed(2);
                const futureTotal = total + futureClasses;
                const futureAttended = attended + futureAttendance;
                const futurePercentage = (futureAttended / futureTotal * 100).toFixed(2);
                
                if (futurePercentage >= target) {
                    liveResultText.innerHTML = `With your planned future attendance, you'll reach <strong>${futurePercentage}%</strong> which is above your target!`;
                    liveResult.style.display = 'block';
                } else {
                    // Calculate via API
                    const result = await calculateViaAPI(total, attended, futureClasses, futureAttendance, target);
                    if (result && !result.error) {
                        liveResultText.innerHTML = `
                            Current: <strong>${currentPercentage}%</strong><br>
                            After planned future: <strong>${futurePercentage}%</strong><br>
                            Need <strong>${result.required_classes}</strong> more classes beyond your plan
                        `;
                        liveResult.style.display = 'block';
                    }
                }
            } else {
                liveResult.style.display = 'none';
            }
        }
        
        // Add event listeners with debounce
        [totalInput, attendedInput, futureClassesInput, futureAttendanceInput, targetInput].forEach(input => {
            if (input) {
                input.addEventListener('input', debounce(updateLiveResult, 500));
            }
        });
    }
});

// API call function (updated)
async function calculateViaAPI(total, attended, futureClasses, futureAttendance, target) {
    try {
        const response = await fetch('/api/calculate-prediction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                total_classes: total,
                attended_classes: attended,
                future_classes: futureClasses,
                future_attendance: futureAttendance,
                target_percentage: target
            })
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}
// Utility function: show alert
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const main = document.querySelector('main');
    main.insertBefore(alertDiv, main.firstChild);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Utility function: debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format date function
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Print results
function printResults() {
    window.print();
}

// Reset form
function resetForm(formId) {
    document.getElementById(formId)?.reset();
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showAlert('Copied to clipboard!', 'success');
    }).catch(() => {
        showAlert('Failed to copy!', 'danger');
    });
}