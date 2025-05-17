 (() => {
    const moods = {
      "very-happy": {color: getComputedStyle(document.documentElement).getPropertyValue('--very-happy').trim(), label: "Very Happy", emoji: "😍", score: 5},
      "happy": {color: getComputedStyle(document.documentElement).getPropertyValue('--happy').trim(), label: "Happy", emoji: "😊", score: 4},
      "neutral": {color: getComputedStyle(document.documentElement).getPropertyValue('--neutral').trim(), label: "Neutral", emoji: "😐", score: 3},
      "sad": {color: getComputedStyle(document.documentElement).getPropertyValue('--sad').trim(), label: "Sad", emoji: "😟", score: 2},
      "angry": {color: getComputedStyle(document.documentElement).getPropertyValue('--angry').trim(), label: "Angry", emoji: "😡", score: 1},
    };
    const calendarDays = document.getElementById('calendarDays');
    const monthYearLabel = document.getElementById('monthYearLabel');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const emojiButtons = document.querySelectorAll('.emoji-btn');
    const moodBar = document.getElementById('moodBar');
    const suggestionText = document.getElementById('suggestionText');
    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth();
    // Key to store moods in localStorage
    const STORAGE_KEY = 'moodTrackerData';
    // Load saved moods from localStorage
    function loadMoodData() {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    }
    // Save moods to localStorage
    function saveMoodData(data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    // Format date key like YYYY-MM-DD
    function formatDateKey(year, month, day) {
      return `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    }
    // Render calendar days for current month and color-code by saved moods
    function renderCalendar(year, month) {
      calendarDays.innerHTML = '';
      let firstDay = new Date(year, month, 1);
      let lastDay = new Date(year, month+1, 0);
      let firstWeekday = firstDay.getDay();
      animateMonthLabel(firstDay.toLocaleString('default', { month: 'long' }) + ' ' + year);
      const moodData = loadMoodData();
      // Fill initial blank days for previous month
      for(let i=0; i < firstWeekday; i++){
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('day');
        calendarDays.appendChild(emptyDiv);
      }
      // Create day elements
      for(let day=1; day<=lastDay.getDate(); day++){
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');
        dayDiv.textContent = day;
        const dateKey = formatDateKey(year, month, day);
        const mood = moodData[dateKey];
        if(mood && moods[mood]){
          dayDiv.classList.add(`mood-${mood}`);
          dayDiv.style.transition = 'background-color 0.5s ease';
        }
        // Highlight today
        const today = new Date();
        if(year === today.getFullYear() && month === today.getMonth() && day === today.getDate()){
          dayDiv.classList.add('today');
        }
        // Tooltip for the mood of the day
        if (mood && moods[mood]) {
          const tooltip = document.createElement('span');
          tooltip.className = 'tooltip';
          tooltip.textContent = moods[mood].label + ' ' + moods[mood].emoji;
          dayDiv.appendChild(tooltip);
        }
        calendarDays.appendChild(dayDiv);
      }
    }
    function logMood(mood) {
      const moodData = loadMoodData();
      const now = new Date();
      const todayKey = formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());
      moodData[todayKey] = mood;
      saveMoodData(moodData);
      renderCalendar(currentYear, currentMonth);
      updateSummary();
      showConfirmation(mood);
    }
    // Show a temporary confirmation animation/feedback after mood clicked
    function showConfirmation(mood) {
      const button = document.querySelector(`.emoji-btn[data-mood="${mood}"]`);
      if(!button) return;
      button.animate([
        { transform: 'scale(1) rotate(0deg)' },
        { transform: 'scale(1.5) rotate(30deg)' },
        { transform: 'scale(1) rotate(0deg)' },
      ], {
        duration: 600,
        easing: 'ease-out',
      });
    }
    // Returns array of last 7 days keys in YYYY-MM-DD format
    function getLast7DaysKeys() {
      const keys = [];
      let today = new Date();
      for(let i=6; i>=0; i--) {
        let d = new Date(today);
        d.setDate(today.getDate() - i);
        keys.push(formatDateKey(d.getFullYear(), d.getMonth(), d.getDate()));
      }
      return keys;
    }
    // Update the summary bar with counts for last 7 days
    function updateSummary() {
      const moodData = loadMoodData();
      const last7days = getLast7DaysKeys();
      let counts = { "very-happy": 0, "happy": 0, "neutral": 0, "sad": 0, "angry": 0
      };
      let totalScore = 0;
      let scoredDays = 0;
      last7days.forEach(dayKey => {
        const mood = moodData[dayKey];
        if(mood && moods[mood]){
          counts[mood]++;
          totalScore += moods[mood].score;
          scoredDays++;
        }
      });
      // Clear previous bars
      moodBar.innerHTML = '';
      // For each mood, add a bar element if count > 0 or always show with zero count
      for(const moodKey in counts){
        const count = counts[moodKey];
        const moodDiv = document.createElement('div');
        moodDiv.className = `mood-color-${moodKey}`;
        moodDiv.title = `${moods[moodKey].label}: ${count}`;
        moodDiv.innerHTML = `<div aria-label="${moods[moodKey].label} count">${moods[moodKey].emoji}</div><span class="count">${count}</span>`;
        moodBar.appendChild(moodDiv);
      }
      // Determine suggestion based on average score
      let avgScore = (scoredDays === 0) ? 3 : totalScore/scoredDays;
      let suggestion = '';
      if(scoredDays === 0){
        suggestion = "Start tracking your mood today!😊";
      } else if(avgScore >= 4.5){
        suggestion = "You're doing great! Keep smiling and spreading joy! 🌟";
      } else if(avgScore >= 3.5){
        suggestion = "Good mood overall! Try some mindfulness or a small walk to boost it further.";
      } else if(avgScore >= 2.5){
        suggestion = "It's okay to have ups and downs. Consider talking to a friend or journaling.";
      } else if(avgScore >= 1.5){
        suggestion = "Not all the days are same . Try some relaxation techniques or a hobby.";
      } else {
        suggestion = "Having a tough time? Remember, self-care and talking to someone can help. You are not alone!";
      }
      suggestionText.textContent = suggestion;
    }
    // Add event listeners to emoji buttons
    emojiButtons.forEach(button => {
      button.addEventListener('click', () => {
        const mood = button.getAttribute('data-mood');
        logMood(mood);
      });
    });
    prevMonthBtn.addEventListener('click', () => {
      currentMonth--;
      if(currentMonth < 0){
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar(currentYear, currentMonth);
    });
    nextMonthBtn.addEventListener('click', () => {
      currentMonth++;
      if(currentMonth > 11){
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar(currentYear, currentMonth);
    });
    // Initial render and summary update
    renderCalendar(currentYear, currentMonth);
    updateSummary();
  })();
window.addEventListener('DOMContentLoaded', () => {
  // Stagger emoji animation
  document.querySelectorAll('.emoji-btn').forEach((btn, index) => {
    btn.style.animationDelay = `${0.7 + index * 0.1}s`;
  });
});
 const heading = document.querySelector(".fancy-heading");
  const text = heading.textContent;
  heading.innerHTML = "";
  [...text].forEach((char, index) => {
    const span = document.createElement("span");
    span.textContent = char;
    span.style.animationDelay = `${index * 0.1}s`;
    heading.appendChild(span);
  });
  function animateMonthLabel(newText) {
  const label = document.getElementById('monthYearLabel');
  // Reset the animation
  label.classList.remove('animate-month-change');
  void label.offsetWidth; // Force reflow

  // Set the new text and re-apply animation class
  label.textContent = newText;
  label.classList.add('animate-month-change');
}
document.getElementById('prevMonth').addEventListener('click', () => {
  // your logic to update month...
  document.querySelector('.calendar-header').classList.add('animate-header');
  setTimeout(() => {
    document.querySelector('.calendar-header').classList.remove('animate-header');
  }, 400);
});
