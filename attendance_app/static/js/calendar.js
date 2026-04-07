document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    const leaveList = document.getElementById('leaveList');
    const saveButton = document.getElementById('saveLeaves');
    const clearAllButton = document.getElementById('clearAllLeaves');
    const confirmClearAll = document.getElementById('confirmClearAll');
    const calculateBtn = document.getElementById('calculateAttendanceBtn');
    const totalInput = document.getElementById('totalClassesInput');
    const attendedInput = document.getElementById('attendedClassesInput');
    
    // Display elements
    const currentDisplay = document.getElementById('currentAttendanceDisplay');
    const attendanceDetails = document.getElementById('attendanceDetails');
    const predictedDisplay = document.getElementById('predictedAttendanceDisplay');
    const predictedDetails = document.getElementById('predictedDetails');
    const dropProgress = document.getElementById('dropProgress');
    const dropPercentage = document.getElementById('dropPercentage');
    const impactMessage = document.getElementById('impactMessage');
    
    if (!calendarEl) return;
    
    // Get saved data
    const savedDatesInput = document.getElementById('savedLeaveDates');
    const savedAttendanceInput = document.getElementById('savedAttendance');
    
    // Initialize variables
    let leaveDates = [];
    let totalClasses = 0;
    let attendedClasses = 0;
    
    // Load saved leave dates
    try {
        if (savedDatesInput && savedDatesInput.value && savedDatesInput.value !== 'null') {
            leaveDates = JSON.parse(savedDatesInput.value);
            if (!Array.isArray(leaveDates)) {
                leaveDates = [];
            }
        }
    } catch (e) {
        console.error('Error parsing saved dates:', e);
        leaveDates = [];
    }
    
    // Load saved attendance
    try {
        if (savedAttendanceInput && savedAttendanceInput.value && savedAttendanceInput.value !== 'null') {
            const savedData = JSON.parse(savedAttendanceInput.value);
            totalClasses = savedData.total || 0;
            attendedClasses = savedData.attended || 0;
            if (totalInput) totalInput.value = totalClasses;
            if (attendedInput) attendedInput.value = attendedClasses;
        }
    } catch (e) {
        console.error('Error parsing saved attendance:', e);
    }
    
    // Initialize calendar
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
        },
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        weekends: true,
        dateClick: function(info) {
            info.jsEvent.preventDefault();
            toggleLeaveDate(info.dateStr);
        },
        events: leaveDates.map(date => ({
            title: '📅 Leave',
            start: date,
            allDay: true,
            backgroundColor: '#ffc107',
            borderColor: '#ffc107',
            textColor: '#000',
            display: 'block'
        })),
        eventClick: function(info) {
            info.jsEvent.preventDefault();
            toggleLeaveDate(info.event.startStr);
        },
        unselectAuto: true,
        unselectCancel: '.fc-daygrid-day',
        longPressDelay: 100,
        selectLongPressDelay: 100
    });
    
    calendar.render();
    
    // Calculate attendance function
    function calculateAttendance() {
        if (totalClasses > 0) {
            const currentPercent = (attendedClasses / totalClasses * 100).toFixed(1);
            currentDisplay.textContent = currentPercent + '%';
            attendanceDetails.textContent = `Total: ${totalClasses} | Attended: ${attendedClasses}`;
            
            // Calculate with leaves
            const futureTotal = totalClasses + leaveDates.length;
            const futureAttended = attendedClasses; // Attended doesn't change, leaves are future absences
            const futurePercent = (futureAttended / futureTotal * 100).toFixed(1);
            
            predictedDisplay.textContent = futurePercent + '%';
            predictedDetails.textContent = `Total: ${futureTotal} | Attended: ${futureAttended}`;
            
            // Calculate drop
            const drop = (currentPercent - futurePercent).toFixed(1);
            const dropValue = parseFloat(drop);
            
            if (dropValue > 0) {
                dropProgress.style.width = Math.min(dropValue * 2, 100) + '%';
                dropPercentage.textContent = dropValue + '% drop';
                
                if (dropValue < 5) {
                    dropProgress.className = 'progress-bar bg-success';
                    impactMessage.innerHTML = '<i class="fas fa-smile"></i> Minimal impact on your attendance';
                } else if (dropValue < 10) {
                    dropProgress.className = 'progress-bar bg-warning';
                    impactMessage.innerHTML = '<i class="fas fa-meh"></i> Moderate impact on your attendance';
                } else {
                    dropProgress.className = 'progress-bar bg-danger';
                    impactMessage.innerHTML = '<i class="fas fa-frown"></i> Significant impact! Consider reducing leaves';
                }
            } else {
                dropProgress.style.width = '0%';
                dropPercentage.textContent = '0% drop';
                impactMessage.innerHTML = '<i class="fas fa-check-circle"></i> No leaves marked yet';
            }
            
            // No manual color override to avoid contrast issues with bg-warning
        } else {
            currentDisplay.textContent = '0%';
            attendanceDetails.textContent = 'Enter your attendance';
            predictedDisplay.textContent = '0%';
            predictedDetails.textContent = 'Enter your attendance';
            impactMessage.innerHTML = '<i class="fas fa-info-circle"></i> Enter your attendance to see impact';
        }
    }
    
    // Toggle leave date function
    function toggleLeaveDate(dateStr) {
        const date = new Date(dateStr);
        const formattedDate = date.toISOString().split('T')[0];
        
        const index = leaveDates.indexOf(formattedDate);
        
        if (index === -1) {
            // Add leave date
            leaveDates.push(formattedDate);
            calendar.addEvent({
                title: '📅 Leave',
                start: formattedDate,
                allDay: true,
                backgroundColor: '#ffc107',
                borderColor: '#ffc107',
                textColor: '#000',
                display: 'block'
            });
            showNotification(`Leave marked for ${formatDateDisplay(formattedDate)}`, 'success');
        } else {
            // Remove leave date
            leaveDates.splice(index, 1);
            const events = calendar.getEvents();
            const eventToRemove = events.find(event => {
                const eventDate = event.start ? event.start.toISOString().split('T')[0] : null;
                return eventDate === formattedDate;
            });
            if (eventToRemove) {
                eventToRemove.remove();
            }
            showNotification(`Leave removed for ${formatDateDisplay(formattedDate)}`, 'info');
        }
        
        // Sort dates
        leaveDates.sort();
        
        // Update hidden input
        if (savedDatesInput) {
            savedDatesInput.value = JSON.stringify(leaveDates);
        }
        
        updateLeaveList();
        calculateAttendance(); // Recalculate after toggling leave
    }
    
    // Calculate button click handler
    if (calculateBtn) {
        calculateBtn.addEventListener('click', function() {
            totalClasses = parseInt(totalInput.value) || 0;
            attendedClasses = parseInt(attendedInput.value) || 0;
            
            if (attendedClasses > totalClasses) {
                showNotification('Attended classes cannot exceed total classes!', 'danger');
                return;
            }
            
            if (totalClasses > 0) {
                calculateAttendance();
                saveAttendanceToSession();
                showNotification('Attendance calculated successfully!', 'success');
            } else {
                showNotification('Please enter total classes', 'warning');
            }
        });
    }
    
    // Clear all leaves function
    function clearAllLeaves() {
        // Remove all events from calendar
        const events = calendar.getEvents();
        events.forEach(event => {
            if (event.title === '📅 Leave') {
                event.remove();
            }
        });
        
        // Clear the leave dates array
        leaveDates = [];
        
        // Update hidden input
        if (savedDatesInput) {
            savedDatesInput.value = JSON.stringify(leaveDates);
        }
        
        // Update the leave list
        updateLeaveList();
        
        // Recalculate attendance
        calculateAttendance();
        
        // Show notification
        showNotification('All leave dates have been cleared', 'warning');
        
        // Auto-save after clearing
        saveLeavesToSession();
    }
    
    // Clear All button click handler
    if (clearAllButton) {
        clearAllButton.addEventListener('click', function() {
            const modal = new bootstrap.Modal(document.getElementById('clearAllModal'));
            modal.show();
        });
    }
    
    // Confirm Clear All button click handler
    if (confirmClearAll) {
        confirmClearAll.addEventListener('click', function() {
            const modal = bootstrap.Modal.getInstance(document.getElementById('clearAllModal'));
            modal.hide();
            clearAllLeaves();
        });
    }
    
    // Update leave list display
    function updateLeaveList() {
        if (!leaveList) return;
        
        leaveDates.sort();
        
        if (leaveDates.length === 0) {
            leaveList.innerHTML = '<p class="text-muted text-center">No leaves marked</p>';
        } else {
            leaveList.innerHTML = leaveDates.map(date => `
                <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                    <span><i class="fas fa-calendar-times text-warning me-2"></i>${formatDateDisplay(date)}</span>
                    <button class="btn btn-sm btn-outline-danger" onclick="window.removeLeaveDate('${date}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
        }
    }
    
    // Format date for display
    function formatDateDisplay(dateStr) {
        const date = new Date(dateStr + 'T12:00:00');
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    // Save functions
    function saveLeavesToSession() {
        fetch('/api/save-leave-dates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ dates: leaveDates })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showNotification('Leave dates saved successfully!', 'success');
            }
        })
        .catch(error => {
            console.error('Error saving leave dates:', error);
            showNotification('Error saving leave dates', 'error');
        });
    }
    
    function saveAttendanceToSession() {
        fetch('/api/save-attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                total: totalClasses, 
                attended: attendedClasses 
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                console.log('Attendance saved');
            }
        })
        .catch(error => {
            console.error('Error saving attendance:', error);
        });
    }
    
    // Save button click handler
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            saveLeavesToSession();
        });
    }
    
    // Show notification function
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
        notification.style.zIndex = '9999';
        notification.style.maxWidth = '300px';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Initial calculations
    updateLeaveList();
    calculateAttendance();
    
    // Add click handlers to calendar days
    setTimeout(() => {
        document.querySelectorAll('.fc-daygrid-day').forEach(day => {
            day.style.cursor = 'pointer';
        });
    }, 500);
});

// Global function to remove leave date
window.removeLeaveDate = function(dateStr) {
    try {
        const savedDatesInput = document.getElementById('savedLeaveDates');
        if (!savedDatesInput) return;
        
        let leaveDates = [];
        try {
            if (savedDatesInput.value && savedDatesInput.value !== 'null') {
                leaveDates = JSON.parse(savedDatesInput.value);
            }
        } catch (e) {
            console.error('Error parsing saved dates:', e);
            leaveDates = [];
        }
        
        const index = leaveDates.indexOf(dateStr);
        
        if (index !== -1) {
            leaveDates.splice(index, 1);
            savedDatesInput.value = JSON.stringify(leaveDates);
            
            // Refresh the page to update calendar
            location.reload();
        }
    } catch (error) {
        console.error('Error removing leave date:', error);
    }
};