// --- VARIABLES GLOBALES ---
let correctAnswersToday = 0;
let totalQuestionsToday = 0;

async function loadDailyChallenge() {
    try {
        const response = await fetch('questions.json?v=' + Date.now());
        const allChallenges = await response.json();
        const today = new Date().toISOString().split('T')[0];

        let dailyData = allChallenges.find(item => item.date === today);
        if (!dailyData) dailyData = allChallenges[allChallenges.length - 1];

        // 1. On définit le nombre total de questions AVANT d'afficher
        totalQuestionsToday = dailyData.questions.length;
        
        // 2. On affiche les scores à 0 au départ
        updateDisplay(); 
        
        // 3. On affiche l'article
        renderPage(dailyData);

    } catch (error) {
        console.error("Erreur:", error);
    }
}

function verify(qIdx, optIdx, btn, correctIndex, explId) {
    const parent = btn.parentElement;
    // Empêche de recliquer
    if (btn.disabled) return; 
    parent.querySelectorAll('.option-btn').forEach(b => b.disabled = true);

    if (optIdx === correctIndex) {
        btn.classList.add('btn-correct');
        correctAnswersToday++; // +1 pour la barre verte
        saveToWeekly(1);       // +1 pour le cumul hebdo
    } else {
        btn.classList.add('btn-wrong');
    }
    
    updateDisplay(); // Met à jour les barres visuellement
    document.getElementById(explId).style.display = 'block';
}

function updateDisplay() {
    // Calcul du pourcentage pour la barre verte
    const dailyPercent = totalQuestionsToday > 0 ? (correctAnswersToday / totalQuestionsToday) * 100 : 0;
    
    const bar = document.getElementById('daily-bar');
    const countText = document.getElementById('daily-count');
    const weeklyText = document.getElementById('weekly-total');

    if (bar) bar.style.width = dailyPercent + "%";
    if (countText) countText.innerText = `${correctAnswersToday}/${totalQuestionsToday}`;

    // Récupération du score hebdo dans le stockage du navigateur
    const stats = JSON.parse(localStorage.getItem('toeic_stats')) || { total: 0 };
    if (weeklyText) weeklyText.innerText = `${stats.total} pts`;
}

// Fonction pour sauvegarder dans la mémoire du navigateur
function saveToWeekly(pts) {
    let stats = JSON.parse(localStorage.getItem('toeic_stats')) || { week: getWeekNumber(), total: 0 };
    const currentWeek = getWeekNumber();

    if (stats.week !== currentWeek) {
        stats = { week: currentWeek, total: 0 };
    }
    
    stats.total += pts;
    localStorage.setItem('toeic_stats', JSON.stringify(stats));
}

function getWeekNumber() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    return Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7);
}

window.onload = loadDailyChallenge;