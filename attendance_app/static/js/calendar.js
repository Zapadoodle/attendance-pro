document.addEventListener('DOMContentLoaded', function() {
    const CLASSES_PER_LEAVE_DAY = 6;
    const calendarEl = document.getElementById('calendar');
    const leaveList = document.getElementById('leaveList');
    const saveButton = document.getElementById('saveLeaves');
    const clearAllButton = document.getElementById('clearAllLeaves');
    const confirmClearAll = document.getElementById('confirmClearAll');
    const inputModeSelect = document.getElementById('calendarInputMode');
    const totalInput = document.getElementById('totalClassesInput');
    const attendedInput = document.getElementById('attendedClassesInput');
    const totalLabel = document.getElementById('calendarTotalLabel');
    const attendedLabel = document.getElementById('calendarAttendedLabel');

    const currentDisplay = document.getElementById('currentAttendanceDisplay');
    const attendanceDetails = document.getElementById('attendanceDetails');
    const predictedDisplay = document.getElementById('predictedAttendanceDisplay');
    const predictedDetails = document.getElementById('predictedDetails');
    const dropProgress = document.getElementById('dropProgress');
    const dropPercentage = document.getElementById('dropPercentage');
    const impactMessage = document.getElementById('impactMessage');

    if (!calendarEl) return;

    const savedDatesInput = document.getElementById('savedLeaveDates');
    const savedAttendanceInput = document.getElementById('savedAttendance');
    const todayDateInput = document.getElementById('todayDate');

    let absentDates = [];
    let totalClasses = 0;
    let attendedClasses = 0;
    let calendarInputMode = 'days';

    function normalizeDate(dateInput) {
        if (typeof dateInput === 'string') {
            return dateInput;
        }
        return FullCalendar.formatDate(dateInput, {
            timeZone: 'local',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    function isAbsent(dateStr) {
        return absentDates.includes(dateStr);
    }

    function getTodayDateStr() {
        if (todayDateInput && todayDateInput.value) {
            return todayDateInput.value;
        }

        return FullCalendar.formatDate(new Date(), {
            timeZone: 'local',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    function isPastDate(dateStr) {
        return dateStr < getTodayDateStr();
    }

    try {
        if (savedDatesInput && savedDatesInput.value && savedDatesInput.value !== 'null') {
            absentDates = JSON.parse(savedDatesInput.value);
            if (!Array.isArray(absentDates)) {
                absentDates = [];
            }
            absentDates = absentDates.filter(date => !isPastDate(date));
        }
    } catch (e) {
        console.error('Error parsing saved dates:', e);
        absentDates = [];
    }

    try {
        if (savedAttendanceInput && savedAttendanceInput.value && savedAttendanceInput.value !== 'null') {
            const savedData = JSON.parse(savedAttendanceInput.value);
            totalClasses = savedData.total || 0;
            attendedClasses = savedData.attended || 0;
        }
    } catch (e) {
        console.error('Error parsing saved attendance:', e);
    }

    function syncAttendanceInputLabels() {
        if (!totalLabel || !attendedLabel || !totalInput || !attendedInput) return;

        if (calendarInputMode === 'days') {
            totalLabel.textContent = 'Total Days Held';
            attendedLabel.textContent = 'Days Attended';
            totalInput.placeholder = 'e.g., 20';
            attendedInput.placeholder = 'e.g., 15';
            totalInput.value = totalClasses > 0 ? (totalClasses / CLASSES_PER_LEAVE_DAY).toFixed(2).replace(/\.00$/, '') : 0;
            attendedInput.value = attendedClasses > 0 ? (attendedClasses / CLASSES_PER_LEAVE_DAY).toFixed(2).replace(/\.00$/, '') : 0;
        } else {
            totalLabel.textContent = 'Total Classes Held';
            attendedLabel.textContent = 'Classes Attended';
            totalInput.placeholder = 'e.g., 120';
            attendedInput.placeholder = 'e.g., 96';
            totalInput.value = totalClasses;
            attendedInput.value = attendedClasses;
        }
    }

    function buildAbsentEvents() {
        return absentDates.map(date => ({
            title: 'Absent',
            start: date,
            allDay: true,
            backgroundColor: '#dc3545',
            borderColor: '#dc3545',
            textColor: '#fff',
            display: 'block'
        }));
    }

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
        },
        selectable: false,
        dayMaxEvents: true,
        weekends: true,
        events: buildAbsentEvents(),
        dateClick: function(info) {
            info.jsEvent.preventDefault();
        },
        eventClick: function(info) {
            info.jsEvent.preventDefault();
        },
        datesSet: function() {
            setTimeout(refreshCalendarDayActions, 0);
        },
        dayCellDidMount: function(info) {
            decorateDayCell(info.el, normalizeDate(info.date));
        }
    });

    calendar.render();

    function calculateAttendance() {
        if (totalClasses > 0) {
            const currentPercent = (attendedClasses / totalClasses * 100).toFixed(1);
            const missedClasses = absentDates.length * CLASSES_PER_LEAVE_DAY;
            const futureTotal = totalClasses + missedClasses;
            const futureAttended = attendedClasses;
            const futurePercent = (futureAttended / futureTotal * 100).toFixed(1);
            const displayCurrentTotal = calendarInputMode === 'days' ? (totalClasses / CLASSES_PER_LEAVE_DAY).toFixed(2).replace(/\.00$/, '') : totalClasses;
            const displayCurrentAttended = calendarInputMode === 'days' ? (attendedClasses / CLASSES_PER_LEAVE_DAY).toFixed(2).replace(/\.00$/, '') : attendedClasses;
            const displayFutureTotal = calendarInputMode === 'days' ? (futureTotal / CLASSES_PER_LEAVE_DAY).toFixed(2).replace(/\.00$/, '') : futureTotal;
            const displayFutureAttended = calendarInputMode === 'days' ? (futureAttended / CLASSES_PER_LEAVE_DAY).toFixed(2).replace(/\.00$/, '') : futureAttended;
            const displayMissed = calendarInputMode === 'days' ? absentDates.length : missedClasses;
            const unitLabel = calendarInputMode === 'days' ? 'Days' : 'Total';
            const attendedLabelText = calendarInputMode === 'days' ? 'Attended Days' : 'Attended';
            const missedLabelText = calendarInputMode === 'days' ? 'Missed Days' : 'Missed';

            currentDisplay.textContent = currentPercent + '%';
            attendanceDetails.textContent = `${unitLabel}: ${displayCurrentTotal} | ${attendedLabelText}: ${displayCurrentAttended}`;
            predictedDisplay.textContent = futurePercent + '%';
            predictedDetails.textContent = `${unitLabel}: ${displayFutureTotal} | ${attendedLabelText}: ${displayFutureAttended} | ${missedLabelText}: ${displayMissed}`;

            // Dynamically style the predicted card to make it highly prominent and color-coded
            const predictedCard = document.getElementById('predictedAttendanceCard');
            if (predictedCard) {
                predictedCard.classList.remove('card-predicted-safe', 'card-predicted-warning', 'card-predicted-danger');
                const futureVal = parseFloat(futurePercent);
                if (futureVal >= 75) {
                    predictedCard.classList.add('card-predicted-safe');
                } else if (futureVal >= 65) {
                    predictedCard.classList.add('card-predicted-warning');
                } else {
                    predictedCard.classList.add('card-predicted-danger');
                }
            }

            const drop = (currentPercent - futurePercent).toFixed(1);
            const dropValue = parseFloat(drop);

            if (dropValue > 0) {
                dropProgress.style.width = Math.min(dropValue * 2, 100) + '%';
                dropPercentage.textContent = dropValue + '% drop';

                if (dropValue < 5) {
                    dropProgress.className = 'progress-bar bg-success';
                    impactMessage.innerHTML = `<i class="fas fa-smile"></i> ${absentDates.length} absent day(s) would cost ${missedClasses} classes with minimal impact.`;
                } else if (dropValue < 10) {
                    dropProgress.className = 'progress-bar bg-warning';
                    impactMessage.innerHTML = `<i class="fas fa-meh"></i> ${absentDates.length} absent day(s) would cost ${missedClasses} classes and moderately reduce attendance.`;
                } else {
                    dropProgress.className = 'progress-bar bg-danger';
                    impactMessage.innerHTML = `<i class="fas fa-frown"></i> ${absentDates.length} absent day(s) would cost ${missedClasses} classes and significantly reduce attendance.`;
                }
            } else {
                dropProgress.style.width = '0%';
                dropPercentage.textContent = '0% drop';
                impactMessage.innerHTML = '<i class="fas fa-check-circle"></i> No absent days marked yet';
            }
        } else {
            currentDisplay.textContent = '0%';
            attendanceDetails.textContent = 'Enter your attendance';
            predictedDisplay.textContent = '0%';
            predictedDetails.textContent = 'Enter your attendance';
            
            const predictedCard = document.getElementById('predictedAttendanceCard');
            if (predictedCard) {
                predictedCard.classList.remove('card-predicted-safe', 'card-predicted-warning', 'card-predicted-danger');
            }
            
            impactMessage.innerHTML = '<i class="fas fa-info-circle"></i> Enter your attendance to see impact';
        }
    }

    function decorateDayCell(dayEl, dateStr) {
        const dayTop = dayEl.querySelector('.fc-daygrid-day-top');
        const dayFrame = dayEl.querySelector('.fc-daygrid-day-frame');
        if (!dayTop || !dayFrame) return;

        const existingAction = dayEl.querySelector('.calendar-day-action');
        if (existingAction) existingAction.remove();

        dayEl.classList.toggle('calendar-absent-day', isAbsent(dateStr));
        dayEl.classList.toggle('calendar-past-day', isPastDate(dateStr));

        if (isPastDate(dateStr)) {
            dayEl.setAttribute('aria-disabled', 'true');
            dayEl.title = 'Past dates cannot be selected';
            return;
        }

        dayEl.removeAttribute('aria-disabled');
        dayEl.removeAttribute('title');

        const actionBtn = document.createElement('button');
        const absent = isAbsent(dateStr);
        actionBtn.type = 'button';
        actionBtn.className = `calendar-day-action${absent ? ' remove' : ''}`;
        actionBtn.textContent = absent ? 'Remove Absent' : 'Absent';
        actionBtn.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            toggleAbsentDate(dateStr);
        });
        dayFrame.appendChild(actionBtn);
    }

    function refreshCalendarDayActions() {
        document.querySelectorAll('.fc-daygrid-day').forEach(dayEl => {
            const dateStr = dayEl.getAttribute('data-date');
            if (dateStr) {
                decorateDayCell(dayEl, dateStr);
            }
        });
    }

    function syncAbsentStorage() {
        absentDates.sort();
        if (savedDatesInput) {
            savedDatesInput.value = JSON.stringify(absentDates);
        }
    }

    function refreshAbsentEvents() {
        calendar.getEvents().forEach(event => event.remove());
        buildAbsentEvents().forEach(event => calendar.addEvent(event));
        refreshCalendarDayActions();
    }

    function toggleAbsentDate(dateStr) {
        const index = absentDates.indexOf(dateStr);
        const isAdding = index === -1;

        if (isAdding) {
            absentDates.push(dateStr);
            showNotification(`Absent marked for ${formatDateDisplay(dateStr)} (6 classes)`, 'danger');
        } else {
            absentDates.splice(index, 1);
            showNotification(`Absent removed for ${formatDateDisplay(dateStr)}`, 'info');
        }

        syncAbsentStorage();
        refreshAbsentEvents();
        updateLeaveList();
        calculateAttendance();
    }

    if (inputModeSelect) {
        inputModeSelect.addEventListener('change', function() {
            calendarInputMode = inputModeSelect.value;
            syncAttendanceInputLabels();
            calculateAttendance();
        });
    }

    function clearAllLeaves() {
        absentDates = [];
        syncAbsentStorage();
        refreshAbsentEvents();
        updateLeaveList();
        calculateAttendance();
        showNotification('All absent dates have been cleared', 'warning');
        saveLeaves();
    }

    if (clearAllButton) {
        clearAllButton.addEventListener('click', function() {
            const modal = new bootstrap.Modal(document.getElementById('clearAllModal'));
            modal.show();
        });
    }

    if (confirmClearAll) {
        confirmClearAll.addEventListener('click', function() {
            const modal = bootstrap.Modal.getInstance(document.getElementById('clearAllModal'));
            modal.hide();
            clearAllLeaves();
        });
    }

    function updateLeaveList() {
        if (!leaveList) return;

        absentDates.sort();

        if (absentDates.length === 0) {
            leaveList.innerHTML = '<p class="text-muted text-center">No absent dates marked</p>';
        } else {
            leaveList.innerHTML = absentDates.map(date => `
                <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                    <span><i class="fas fa-calendar-times text-danger me-2"></i>${formatDateDisplay(date)} <small class="text-muted">(6 classes)</small></span>
                    <button class="btn btn-sm btn-outline-danger" onclick="window.removeLeaveDate('${date}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
        }
    }

    function formatDateDisplay(dateStr) {
        const date = new Date(dateStr + 'T12:00:00');
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function saveLeaves() {
        fetch('/api/save-leave-dates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ dates: absentDates })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showNotification('Absent dates saved successfully!', 'success');
            }
        })
        .catch(error => {
            console.error('Error saving absent dates:', error);
            showNotification('Error saving absent dates', 'danger');
        });
    }

    if (saveButton) {
        saveButton.addEventListener('click', function() {
            saveLeaves();
        });
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
        notification.style.zIndex = '9999';
        notification.style.maxWidth = '320px';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    window.removeLeaveDate = function(dateStr) {
        const index = absentDates.indexOf(dateStr);

        if (index !== -1) {
            absentDates.splice(index, 1);
            syncAbsentStorage();
            refreshAbsentEvents();
            updateLeaveList();
            calculateAttendance();
            showNotification(`Absent removed for ${formatDateDisplay(dateStr)}`, 'info');
        }
    };

    updateLeaveList();
    calculateAttendance();
    syncAttendanceInputLabels();
    refreshCalendarDayActions();
});
