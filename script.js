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
    // 1. On récupère le conteneur de la question (le parent)
    const questionBlock = btn.parentElement;

    // 2. SÉCURITÉ : Si la question a déjà été répondue, on stoppe tout de suite
    if (questionBlock.dataset.answered === "true") {
        return; 
    }

    // 3. On marque immédiatement la question comme répondue
    questionBlock.dataset.answered = "true";

    // 4. On désactive TOUS les boutons de cette question pour empêcher d'autres clics
    const allButtons = questionBlock.querySelectorAll('.option-btn');
    allButtons.forEach(b => {
        b.disabled = true;
        b.style.cursor = "default"; // Optionnel : change le curseur pour montrer que c'est bloqué
    });

    // 5. Logique de scoring
    if (optIdx === correctIndex) {
        // C'est juste !
        btn.classList.add('btn-correct');
        
        // On incrémente les scores
        correctAnswersToday++;
        saveToWeekly(1); // Sauvegarde +1 dans le localStorage
    } else {
        // C'est faux !
        btn.classList.add('btn-wrong');
        
        // Optionnel : on montre la bonne réponse en vert pour aider l'utilisateur
        allButtons[correctIndex].classList.add('btn-correct');
    }

    // 6. Mise à jour visuelle des barres et du compteur
    updateDisplay();

    // 7. Affichage de l'explication pédagogique
    const explanation = document.getElementById(explId);
    if (explanation) {
        explanation.style.display = 'block';
    }
}


function updateDisplay() {
    const dailyPercent = totalQuestionsToday > 0 ? (correctAnswersToday / totalQuestionsToday) * 100 : 0;
    
    // On met à jour la barre du bloc ET le liseré du haut
    const miniBar = document.getElementById('daily-bar-mini');
    const mainBar = document.getElementById('daily-bar-main');
    
    if (miniBar) miniBar.style.width = dailyPercent + "%";
    if (mainBar) mainBar.style.width = dailyPercent + "%";

    document.getElementById('daily-count').innerText = `${correctAnswersToday}/${totalQuestionsToday}`;

    const stats = JSON.parse(localStorage.getItem('toeic_stats')) || { total: 0 };
    document.getElementById('weekly-total').innerText = `${stats.total} pts`;
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