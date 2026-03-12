let correctAnswersToday = 0;
let totalQuestionsToday = 0;
let solvedQuestions = new Set(); // Pour garantir qu'on ne compte pas deux fois un point

async function loadDailyChallenge() {
    try {
        // Le ?v= force le rafraîchissement du JSON
        const response = await fetch('questions.json?v=' + Date.now());
        if (!response.ok) throw new Error("Fichier JSON introuvable");
        
        const allChallenges = await response.json();
        const today = new Date().toISOString().split('T')[0];
        
        // --- AJOUT ICI : Sécurité au chargement ---
        document.getElementById('next-day').disabled = true; 
        document.getElementById('current-date-display').innerText = today;
        // ------------------------------------------

        // On cherche le défi du jour
        let dailyData = allChallenges.find(item => item.date === today);
        if (!dailyData) dailyData = allChallenges[allChallenges.length - 1];

        totalQuestionsToday = dailyData.questions.length;
        
        // On initialise l'affichage
        updateDisplay(); 
        renderPage(dailyData);

    } catch (error) {
        console.error("Erreur de chargement :", error);
        const title = document.getElementById('art-title');
        if (title) title.innerText = "Error loading content. Please refresh.";
    }
}


function renderPage(data) {
    // Remplissage des éléments de l'article
    document.getElementById('art-title').innerText = data.articleTitle;
    document.getElementById('art-link').href = data.articleLink;
    document.getElementById('art-img').src = data.articleImg;
    
    // Découpage du texte en paragraphes
    const textDiv = document.getElementById('art-text');
    textDiv.innerHTML = data.articleBody.split('\n\n').map(p => `<p>${p}</p>`).join('');

    // Remplissage du Quiz
    const container = document.getElementById('quiz-container');
    container.innerHTML = ""; 

    data.questions.forEach((q, qIdx) => {
        const qBox = document.createElement('div');
        qBox.className = 'question-box';
        
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

    // VERROU : Si déjà répondu, on ne fait rien
    if (questionBlock.classList.contains('answered')) return;
    questionBlock.classList.add('answered');

    // On désactive tous les boutons du bloc
    const buttons = questionBlock.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true);

    if (optIdx === correctIndex) {
        btn.classList.add('btn-correct');
        // On vérifie si c'est un nouveau point
        if (!solvedQuestions.has(qIdx)) {
            solvedQuestions.add(qIdx);
            correctAnswersToday++;
        }
    } else {
        btn.classList.add('btn-wrong');
        buttons[correctIndex].classList.add('btn-correct');
    }
    
    updateDisplay();
    
    // Affichage de l'explication
    const explDiv = document.getElementById(explId);
    if (explDiv) explDiv.style.display = 'block';
}

function updateDisplay() {
    const dailyPercent = totalQuestionsToday > 0 ? (correctAnswersToday / totalQuestionsToday) * 100 : 0;
    const widthString = dailyPercent + "%";

    // Mise à jour du liseré fixe (ID: daily-bar-mini)
    const mini = document.getElementById('daily-bar-mini');
    if (mini) mini.style.width = widthString;

    // Mise à jour de la barre dashboard (ID: daily-bar-main)
    const main = document.getElementById('daily-bar-main');
    if (main) {
    main.style.width = dailyPercent + "%";
    }

    // Mise à jour du texte 0/0 (ID: daily-count)
    const countText = document.getElementById('daily-count');
    if (countText) countText.innerText = `${correctAnswersToday}/${totalQuestionsToday}`;
}


let currentOffset = 0; 

async function loadChallenge(offset = 0) {
    try {
        const response = await fetch('questions.json?v=' + Date.now());
        const allChallenges = await response.json();
        
        // Calcul de la date ciblée
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + offset);
        const dateStr = targetDate.toLocaleDateString('en-CA');

        // Recherche du challenge dans le JSON
        let dailyData = allChallenges.find(item => item.date === dateStr);
        
        if (dailyData) {
            // Mise à jour de l'interface
            document.getElementById('current-date-display').innerText = dateStr;
            renderPage(dailyData);
            
            // Réinitialisation du score pour ce jour précis
            solvedQuestions.clear();
            correctAnswersToday = 0;
            totalQuestionsToday = dailyData.questions.length;
            updateDisplay();
        } else {
            alert("Contenu non disponible pour cette date.");
            currentOffset = (offset > 0) ? currentOffset - 1 : currentOffset + 1;
            return;
        }

        // --- GESTION DES BOUTONS (Sécurité) ---
        // On empêche d'aller dans le futur au-delà d'aujourd'hui
        document.getElementById('next-day').disabled = (currentOffset >= 0);
        
    } catch (error) {
        console.error("Erreur de navigation :", error);
    }
}

// Écouteurs d'événements
document.getElementById('prev-day').addEventListener('click', () => {
    currentOffset--;
    loadChallenge(currentOffset);
});

document.getElementById('next-day').addEventListener('click', () => {
    currentOffset++;
    loadChallenge(currentOffset);
});

// Lancement au chargement
window.onload = loadDailyChallenge;