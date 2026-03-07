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
    // 1. Trouver la boîte de la question
    const questionBlock = btn.closest('.question-box');
    
    // 2. VERROU ANTI-TRICHE : On vérifie une classe CSS plutôt qu'un dataset
    if (questionBlock.classList.contains('answered')) return;
    
    // 3. Marquage immédiat
    questionBlock.classList.add('answered');
    
    // 4. Désactiver tous les boutons du bloc
    const buttons = questionBlock.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true);

    // 5. Calcul du point
    if (optIdx === correctIndex) {
        btn.classList.add('btn-correct');
        // Sécurité supplémentaire pour le cumul
        if (!solvedQuestions.has(qIdx)) {
            solvedQuestions.add(qIdx);
            correctAnswersToday++;
            saveToWeekly(1);
        }
    } else {
        btn.classList.add('btn-wrong');
        buttons[correctIndex].classList.add('btn-correct'); // Montre la bonne réponse
    }

    // 6. Mise à jour visuelle
    updateDisplay();
    document.getElementById(explId).style.display = 'block';
}

function updateDisplay() {
    const dailyPercent = totalQuestionsToday > 0 ? (correctAnswersToday / totalQuestionsToday) * 100 : 0;
    
    // Ciblage ultra-précis des deux barres
    const miniBar = document.getElementById('daily-bar-mini'); // Le liseré fixe
    const mainBar = document.getElementById('daily-bar-main'); // La grosse barre du bloc
    
    if (miniBar) {
        miniBar.style.width = dailyPercent + "%";
        console.log("Liseré mis à jour : " + dailyPercent + "%"); // Pour vérifier dans la console
    } else {
        console.error("ERREUR : L'élément #daily-bar-mini est introuvable dans le HTML !");
    }

    if (mainBar) {
        mainBar.style.width = dailyPercent + "%";
    }

    // Mise à jour des textes
    const dailyText = document.getElementById('daily-count');
    if (dailyText) dailyText.innerText = `${correctAnswersToday}/${totalQuestionsToday}`;

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