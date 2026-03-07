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

        totalQuestionsToday = dailyData.questions.length;
        
        updateDisplay(); 
        renderPage(dailyData);

    } catch (error) {
        console.error("Erreur:", error);
    }
}

function verify(qIdx, optIdx, btn, correctIndex, explId) {
    const questionBlock = btn.closest('.question-box');

    // VERROU : On bloque si déjà répondu
    if (questionBlock.classList.contains('answered')) return;
    questionBlock.classList.add('answered');

    const buttons = questionBlock.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true);

    if (optIdx === correctIndex) {
        btn.classList.add('btn-correct');
        correctAnswersToday++; // On incrémente uniquement pour la session actuelle
    } else {
        btn.classList.add('btn-wrong');
        buttons[correctIndex].classList.add('btn-correct');
    }
    
    updateDisplay();
    document.getElementById(explId).style.display = 'block';
}

function updateDisplay() {
    const dailyPercent = totalQuestionsToday > 0 ? (correctAnswersToday / totalQuestionsToday) * 100 : 0;
    const progressString = dailyPercent + "%";

    // Mise à jour des deux barres (Liseré fixe et barre dashboard)
    const miniBar = document.getElementById('daily-bar-mini');
    const mainBar = document.getElementById('daily-bar-main');
    
    if (miniBar) miniBar.style.width = progressString;
    if (mainBar) mainBar.style.width = progressString;

    const countText = document.getElementById('daily-count');
    if (countText) countText.innerText = `${correctAnswersToday}/${totalQuestionsToday}`;
}

window.onload = loadDailyChallenge;