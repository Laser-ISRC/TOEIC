let allQuizzes = [];
let currentIndex = 0;

let correctAnswers = 0;
let totalQuestions = 0;
let solvedQuestions = new Set();

async function loadInitialQuiz() {
    try {
        const response = await fetch('questions.json?v=' + Date.now());
        if (!response.ok) throw new Error("Fichier JSON introuvable");
        
        allQuizzes = await response.json();
        
        if (!allQuizzes || allQuizzes.length === 0) {
            throw new Error("Le fichier JSON est vide.");
        }

        // Active les boutons de navigation au chargement
        const prevBtn = document.getElementById('prev-day');
        const nextBtn = document.getElementById('next-day');
        if (prevBtn) prevBtn.disabled = false;
        if (nextBtn) nextBtn.disabled = false;

        // Le quiz le plus récent est en PREMIÈRE POSITION dans ton JSON (index 0 du tableau)
        currentIndex = 0;
        
        displayQuiz(currentIndex);

    } catch (error) {
        console.error("Erreur de chargement :", error);
        const title = document.getElementById('art-title');
        if (title) title.innerText = "Error loading content. Please refresh.";
    }
}

function displayQuiz(arrayIndex) {
    const quizData = allQuizzes[arrayIndex];

    // Utilise explicitement la propriété "index" de ton objet JSON (ex: 20)
    const quizNumber = quizData.index !== undefined ? quizData.index : (allQuizzes.length - arrayIndex);

    // Mise à jour de l'affichage du badge central "Quiz #20 / 20"
    const displayBadge = document.getElementById('current-quiz-display');
    if (displayBadge) {
        displayBadge.innerText = `Quiz #${quizNumber} / ${allQuizzes.length}`;
    }

    // Réinitialisation des scores
    solvedQuestions.clear();
    correctAnswers = 0;
    totalQuestions = quizData.questions ? quizData.questions.length : 0;
    updateDisplay();

    renderPage(quizData);
}

function renderPage(data) {
    document.getElementById('art-title').innerText = data.articleTitle || "";
    
    const artLink = document.getElementById('art-link');
    if (artLink) artLink.href = data.articleLink || "#";
    
    const artImg = document.getElementById('art-img');
    if (artImg) artImg.src = data.articleImg || "";
    
    const textDiv = document.getElementById('art-text');
    if (textDiv && data.articleBody) {
        textDiv.innerHTML = data.articleBody.split('\n\n').map(p => `<p>${p}</p>`).join('');
    }

    const container = document.getElementById('quiz-container');
    container.innerHTML = ""; 

    if (data.questions) {
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
}

function verify(qIdx, optIdx, btn, correctIndex, explId) {
    const questionBlock = btn.closest('.question-box');

    if (questionBlock.classList.contains('answered')) return;
    questionBlock.classList.add('answered');

    const buttons = questionBlock.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true);

    if (optIdx === correctIndex) {
        btn.classList.add('btn-correct');
        if (!solvedQuestions.has(qIdx)) {
            solvedQuestions.add(qIdx);
            correctAnswers++;
        }
    } else {
        btn.classList.add('btn-wrong');
        if (buttons[correctIndex]) {
            buttons[correctIndex].classList.add('btn-correct');
        }
    }
    
    updateDisplay();
    
    const explDiv = document.getElementById(explId);
    if (explDiv) explDiv.style.display = 'block';
}

function updateDisplay() {
    const percent = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const widthString = percent + "%";

    const mini = document.getElementById('daily-bar-mini');
    if (mini) mini.style.width = widthString;

    const main = document.getElementById('daily-bar-main');
    if (main) main.style.width = widthString;

    const countText = document.getElementById('daily-count');
    if (countText) countText.innerText = `${correctAnswers}/${totalQuestions}`;
}

// NAVIGATION
// "Prev" descend dans le tableau (ex: passe de l'index 0 [Quiz 20] à l'index 1 [Quiz 19])
document.getElementById('prev-day').addEventListener('click', () => {
    if (allQuizzes.length === 0) return;
    currentIndex = (currentIndex + 1) % allQuizzes.length;
    displayQuiz(currentIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// "Next" remonte dans le tableau (ex: passe de l'index 1 [Quiz 19] à l'index 0 [Quiz 20])
document.getElementById('next-day').addEventListener('click', () => {
    if (allQuizzes.length === 0) return;
    currentIndex = (currentIndex - 1 + allQuizzes.length) % allQuizzes.length;
    displayQuiz(currentIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

window.onload = loadInitialQuiz;