async function loadDailyChallenge() {
    try {
        const response = await fetch('questions.json?v=' + Date.now());
        const allChallenges = await response.json();

        // On récupère la date du jour (format 2026-03-07)
        const today = new Date().toISOString().split('T')[0];

        // On cherche l'article du jour
        let dailyData = allChallenges.find(item => item.date === today);

        // Sécurité : si on est samedi et que tu n'as rien prévu, 
        // on prend le dernier article de la liste
        if (!dailyData) {
            dailyData = allChallenges[allChallenges.length - 1];
        }

        // --- CES DEUX LIGNES SONT LES PLUS IMPORTANTES ---
        initDashboard(dailyData.questions.length); // Prépare la barre verte
        renderPage(dailyData);                     // Affiche l'article

    } catch (error) {
        console.error("Erreur de chargement:", error);
    }
}

function renderPage(data) {
    document.getElementById('art-title').innerText = data.articleTitle;
    document.getElementById('art-link').href = data.articleLink;
    document.getElementById('art-img').src = data.articleImg;
    
    const textDiv = document.getElementById('art-text');
    textDiv.innerHTML = data.articleBody.split('\n\n').map(p => `<p>${p}</p>`).join('');

    const container = document.getElementById('quiz-container');
    container.innerHTML = ""; 

    data.questions.forEach((q, qIdx) => {
        const qBox = document.createElement('div');
        qBox.className = 'question-box';
        qBox.innerHTML = `
            <p><strong>Q${qIdx + 1}: ${q.qText}</strong></p>
            ${q.options.map((opt, optIdx) => `
                <button class="option-btn" onclick="verify(${qIdx}, ${optIdx}, this, ${q.correctIndex}, 'expl-${qIdx}')">
                    ${opt}
                </button>
            `).join('')}
            <div id="expl-${qIdx}" class="explanation">${q.explanation}</div>
        `;
        container.appendChild(qBox);
    });
}

function verify(qIdx, optIdx, btn, correctIndex, explId) {
    const isCorrect = optIdx === correctIndex;
    const parent = btn.parentElement;
    parent.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
    btn.classList.add(isCorrect ? 'btn-correct' : 'btn-wrong');
    document.getElementById(explId).style.display = 'block';
}

window.onload = loadDailyChallenge;


// --- GESTION DU SCORE HEBDO ---

function updateWeeklyScore(pointsGagnes) {
    let stats = JSON.parse(localStorage.getItem('toeic_stats')) || { week: getWeekNumber(), total: 0 };

    // Si on change de semaine, on réinitialise
    if (stats.week !== getWeekNumber()) {
        stats = { week: getWeekNumber(), total: 0 };
    }

    stats.total += pointsGagnes;
    localStorage.setItem('toeic_stats', JSON.stringify(stats));
    displayWeeklyScore();
}

function displayWeeklyScore() {
    const stats = JSON.parse(localStorage.getItem('toeic_stats')) || { total: 0 };
    const maxPointsPossibles = 25; // Exemple : 5 jours x 5 questions
    
    const percentage = Math.min((stats.total / maxPointsPossibles) * 100, 100);
    document.getElementById('weekly-progress').style.width = percentage + "%";
    document.getElementById('weekly-text').innerText = `${stats.total} points accumulés cette semaine`;
}

// Fonction utilitaire pour savoir quelle semaine on est
function getWeekNumber() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    return Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7);
}

// --- MODIFICATION DE TA FONCTION VERIFY ---
// (À adapter dans ton script existant)
function verify(qIdx, optIdx, btn, correctIndex, explId) {
    if (optIdx === correctIndex) {
        btn.classList.add('btn-correct');
        updateWeeklyScore(1); // On ajoute 1 point au cumul hebdo
    } else {
        btn.classList.add('btn-wrong');
    }
    // ... reste de ta fonction (désactiver boutons, afficher explication)
}


let correctAnswersToday = 0;
let totalQuestionsToday = 0;

function initDashboard(questionsCount) {
    totalQuestionsToday = questionsCount;
    updateDisplay();
}

function verify(qIdx, optIdx, btn, correctIndex, explId) {
    const parent = btn.parentElement;
    parent.querySelectorAll('.option-btn').forEach(b => b.disabled = true);

    if (optIdx === correctIndex) {
        btn.classList.add('btn-correct');
        correctAnswersToday++;
        saveToWeekly(1); // Ajoute 1 au cumul permanent
    } else {
        btn.classList.add('btn-wrong');
    }
    
    updateDisplay();
    document.getElementById(explId).style.display = 'block';
}

function updateDisplay() {
    // Mise à jour Barre du Jour
    const dailyPercent = (correctAnswersToday / totalQuestionsToday) * 100;
    document.getElementById('daily-bar').style.width = dailyPercent + "%";
    document.getElementById('daily-count').innerText = `${correctAnswersToday}/${totalQuestionsToday}`;

    // Mise à jour Cumul Hebdo
    const stats = JSON.parse(localStorage.getItem('toeic_stats')) || { total: 0 };
    document.getElementById('weekly-total').innerText = `${stats.total} pts`;
}

function saveToWeekly(pts) {
    let stats = JSON.parse(localStorage.getItem('toeic_stats')) || { week: getWeekNumber(), total: 0 };
    
    // Reset si nouvelle semaine
    if (stats.week !== getWeekNumber()) {
        stats = { week: getWeekNumber(), total: 0 };
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