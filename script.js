// --- VARIABLES GLOBALES ---
let correctAnswersToday = 0;
let totalQuestionsToday = 0;
let solvedQuestions = new Set();

async function loadDailyChallenge() {
    try {
        const response = await fetch('questions.json?v=' + Date.now());
        if (!response.ok) throw new Error("Fichier JSON introuvable");
        
        const allChallenges = await response.json();
        
        // Récupérer la date du jour (format 2026-03-07)
        const today = new Date().toISOString().split('T')[0];

        // Chercher l'article du jour
        let dailyData = allChallenges.find(item => item.date === today);

        // Si rien pour aujourd'hui, on prend le dernier
        if (!dailyData) {
            dailyData = allChallenges[allChallenges.length - 1];
        }

        // Initialisation du Dashboard
        totalQuestionsToday = dailyData.questions.length;
        updateDisplay();
        
        // Affichage de l'article
        renderPage(dailyData);

    } catch (error) {
        console.error("Erreur critique :", error);
        document.getElementById('art-title').innerText = "Erreur de chargement du défi du jour ❌";
    }
}

function renderPage(data) {
    // Titre et Image
    document.getElementById('art-title').innerText = data.articleTitle;
    document.getElementById('art-link').href = data.articleLink;
    document.getElementById('art-img').src = data.articleImg;
    
    // Corps du texte (découpage par paragraphes)
    const textDiv = document.getElementById('art-text');
    textDiv.innerHTML = data.articleBody.split('\n\n').map(p => `<p>${p}</p>`).join('');

    // Nettoyage et génération du Quiz
    const container = document.getElementById('quiz-container');
    container.innerHTML = ""; 

    data.questions.forEach((q, qIdx) => {
        const qBox = document.createElement('div');
        qBox.className = 'question-box';
        // On prépare le bloc pour la sécurité anti-doublon
        qBox.dataset.answered = "false"; 

        const optionsHtml = q.options.map((opt, optIdx) => `
            <button class="option-btn" onclick="verify(${qIdx}, ${optIdx}, this, ${q.correctIndex}, 'expl-${qIdx}')">
                ${opt}
            </button>
        `).join('');

        qBox.innerHTML = `
            <p class="question-text"><strong>Q${qIdx + 1}: ${q.qText}</strong></p>
            <div class="options-grid">${optionsHtml}</div>
            <div id="expl-${qIdx}" class="explanation" style="display:none;">${q.explanation}</div>
        `;
        container.appendChild(qBox);
    });
}

function verify(qIdx, optIdx, btn, correctIndex, explId) {
    const questionBlock = btn.closest('.question-box');

    // Sécurité : stop si déjà répondu
    if (questionBlock.dataset.answered === "true") return;
    questionBlock.dataset.answered = "true";

    const allButtons = questionBlock.querySelectorAll('.option-btn');
    allButtons.forEach(b => b.disabled = true);

    if (optIdx === correctIndex) {
        btn.classList.add('btn-correct');
        if (!solvedQuestions.has(qIdx)) {
            solvedQuestions.add(qIdx);
            correctAnswersToday++;
            saveToWeekly(1);
        }
    } else {
        btn.classList.add('btn-wrong');
        // On montre la bonne réponse
        allButtons[correctIndex].classList.add('btn-correct');
    }

    updateDisplay();
    document.getElementById(explId).style.display = 'block';
}

function updateDisplay() {
    const dailyPercent = totalQuestionsToday > 0 ? (correctAnswersToday / totalQuestionsToday) * 100 : 0;
    
    // Mise à jour des deux barres (si elles existent dans le HTML)
    const miniBar = document.getElementById('daily-bar-mini');
    const mainBar = document.getElementById('daily-bar-main');
    if (miniBar) miniBar.style.width = dailyPercent + "%";
    if (mainBar) mainBar.style.width = dailyPercent + "%";

    // Mise à jour des textes
    const dailyCountText = document.getElementById('daily-count');
    if (dailyCountText) dailyCountText.innerText = `${correctAnswersToday}/${totalQuestionsToday}`;

    const stats = JSON.parse(localStorage.getItem('toeic_stats')) || { total: 0 };
    const weeklyText = document.getElementById('weekly-total');
    if (weeklyText) weeklyText.innerText = `${stats.total} pts`;
}

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

// Lancement au chargement de la page
window.onload = loadDailyChallenge;