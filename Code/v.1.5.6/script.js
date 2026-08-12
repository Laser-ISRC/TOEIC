let allQuizzes = [];
let currentIndex = 0;

let correctAnswers = 0;
let totalQuestions = 0;
let solvedQuestions = new Set();

async function loadQuizzes() {
    try {
        const response = await fetch(`questions.json?v=${Date.now()}`);
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        
        allQuizzes = await response.json();
        
        if (allQuizzes.length > 0) {
            renderQuiz(currentIndex);
        } else {
            console.error("Aucun quiz trouvé dans questions.json");
        }
    } catch (error) {
        console.error("Détails de l'erreur :", error);
        const container = document.getElementById('quiz-container');
        if (container) {
            container.innerHTML = `<p class="error">Erreur de chargement des données. (${error.message})</p>`;
        }
    }
}

// Formatage des explications (s'adapte au format Texte ou Objet Distractors)
function formatExplanation(expl) {
    if (!expl) return "";
    if (typeof expl === 'string') return `<p>${expl}</p>`;
    
    let html = "";
    if (expl.correct) html += `<p class="expl-correct"><strong>Correct:</strong> ${expl.correct}</p>`;
    if (expl.distractors) {
        html += `<ul class="expl-distractors">`;
        for (const [key, val] of Object.entries(expl.distractors)) {
            html += `<li><strong>${key}:</strong> ${val}</li>`;
        }
        html += `</ul>`;
    }
    return html;
}

function showExplanation(part2Data) {
    const container = document.getElementById('explanation-container');
    const correctEl = document.getElementById('explanation-correct');
    const distractorsEl = document.getElementById('explanation-distractors');

    if (!container || !part2Data || !part2Data.explanation) return;

    const exp = part2Data.explanation;

    // 1. Explication de la réponse correcte
    if (correctEl) {
        correctEl.innerHTML = `<strong>Correct</strong> ${exp.correct || ''}`;
    }

    // 2. Traitement et affichage des distracteurs
    if (distractorsEl) {
        distractorsEl.innerHTML = ''; // Vide la liste précédente
        
        if (exp.distractors && typeof exp.distractors === 'object') {
            Object.entries(exp.distractors).forEach(([key, text]) => {
                const li = document.createElement('li');
                // Nettoie la clé pour éviter les doublons de parenthèses
                const cleanKey = key.replace(/[\(\)]/g, ''); 
                li.innerHTML = `<strong>Option ${cleanKey} :</strong> ${text}`;
                distractorsEl.appendChild(li);
            });
        }
    }

    // 3. Afficher le conteneur
    container.style.display = 'block';
}

function getAccentBadgeHTML(accentText) {
    if (!accentText) return '';

    // Détection du code pays selon le texte d'accent
    let countryCode = '';
    if (accentText.includes('US')) countryCode = 'us';
    else if (accentText.includes('UK') || accentText.includes('GB')) countryCode = 'gb';
    else if (accentText.includes('AU')) countryCode = 'au';
    else if (accentText.includes('CA')) countryCode = 'ca';
    else if (accentText.includes('NZ')) countryCode = 'nz';

    // Si un code est trouvé, on crée la balise img avec flagcdn (SVG ultra-léger)
    if (countryCode) {
        const flagUrl = `https://flagcdn.com/${countryCode}.svg`;
        return `<img src="${flagUrl}" alt="${accentText}" title="${accentText}" class="flag-icon" style="width:2.5em; height:2.5em; object-fit:cover; border-radius:50%; vertical-align:middle; display:inline-block;" />`;
    }

    return `<span>${accentText}</span>`;
}



function renderQuiz(index) {
    const quiz = allQuizzes[index];
    if (!quiz) return;


    // Mise à jour du badge de quiz courant
    const quizDisplay = document.getElementById('current-quiz-display');
    if (quizDisplay) quizDisplay.innerText = `Quiz #${quiz.index || (allQuizzes.length - index)}`;

    // Reinitialisation des scores pour le quiz
    solvedQuestions.clear();
    correctAnswers = 0;

    // ----------------------------------------------------
    // 1. PART 2 (Listening)
    // ----------------------------------------------------
    const part2Data = quiz.part2 ? quiz.part2[0] : null;
    const part2Card = document.querySelector('.part2-card');

    const container = document.getElementById('explanation-container');
    if (container) {
        container.style.display = 'none'; // Masque l'explication précédente
    }

    const accentDisplay = document.getElementById('quiz-accent');
    if (accentDisplay && part2Data) {
        // Affiche la valeur de la propriété "accent" du JSON (ex: "US - Male", "UK - Female")
        accentDisplay.innerHTML = getAccentBadgeHTML(part2Data.accent);
        //accentDisplay.innerText = part2Data.accent || '';
    }

    if (part2Data && part2Card) {
        part2Card.style.display = 'block';

        // Audio
        const audioEl = document.getElementById('part2-audio');
        if (audioEl) audioEl.src = part2Data.audioUrl || '';

        // Masquer le script au début
        const transcriptBox = document.getElementById('part2-transcript-box');
        if (transcriptBox) transcriptBox.style.display = 'none';

        // Configurer les boutons Option A, B, C
        const p2Buttons = part2Card.querySelectorAll('.options-grid-3 .option-btn');
        p2Buttons.forEach((btn, optIdx) => {
            btn.className = 'option-btn';
            btn.disabled = false;
            btn.onclick = () => checkPart2Answer(optIdx, btn, part2Data);
        });

        // Préparer le contenu du transcript/explication
        const transcriptQ = part2Card.querySelector('.transcript-q');
        if (transcriptQ && part2Data.transcript) {
            transcriptQ.innerHTML = `<strong>Q:</strong> ${part2Data.transcript.question}`;
        }

        const transcriptOpts = part2Card.querySelector('.transcript-options');
        if (transcriptOpts && part2Data.transcript) {
            const labels = ['A', 'B', 'C'];
            transcriptOpts.innerHTML = part2Data.transcript.options.map((opt, i) => `
                <li class="${i === part2Data.correctIndex ? 'correct' : ''}">
                    <strong>${labels[i]}:</strong> ${opt}
                </li>
            `).join('');
        }

        const p2Expl = document.getElementById('part2-explanation');
        if (p2Expl) {
            p2Expl.innerHTML = formatExplanation(part2Data.explanation);
        }
    } else if (part2Card) {
        part2Card.style.display = 'none';
    }

    // ----------------------------------------------------
    // 2. PART 7 (Reading Article & Questions)
    // ----------------------------------------------------
    const p7Data = quiz.part7 ? quiz.part7 : (quiz.questions ? quiz : null);
    const articleCard = document.querySelector('.article-card');

    if (p7Data && articleCard) {
        articleCard.style.display = 'block';

        // Titre, Image, Lien, Texte
        const artTitle = document.getElementById('art-title');
        if (artTitle) artTitle.innerText = p7Data.articleTitle || p7Data.title || '';

        const artLink = document.getElementById('art-link');
        if (artLink) {
            if (p7Data.sourceUrl || p7Data.url) {
                artLink.href = p7Data.sourceUrl || p7Data.url;
                artLink.style.display = 'inline-block';
            } else {
                artLink.style.display = 'none';
            }
        }

        const artImg = document.getElementById('art-img');
        if (artImg) {
            if (p7Data.articleImg || p7Data.imageUrl) {
                artImg.src = p7Data.articleImg || p7Data.imageUrl;
                artImg.style.display = 'block';
            } else {
                artImg.style.display = 'none';
            }
        }

        const artText = document.getElementById('art-text');
        if (artText && p7Data.articleBody) {
            artText.innerHTML = p7Data.articleBody.split('\n\n').map(p => `<p>${p}</p>`).join('');
        }

        // Injection des questions Part 7 dans #quiz-container
        const quizContainer = document.getElementById('quiz-container');
        if (quizContainer) {
            quizContainer.innerHTML = ''; // Réinitialise

            const questionsList = p7Data.questions || [];
            totalQuestions = (part2Data ? 1 : 0) + questionsList.length;

            questionsList.forEach((q, qIdx) => {
                const qBox = document.createElement('div');
                qBox.className = 'question-box';

                const optionsHtml = q.options.map((opt, optIdx) => `
                    <button class="option-btn" onclick="checkPart7Answer(${qIdx}, ${optIdx}, this, ${q.correctIndex}, 'p7-expl-${qIdx}')">
                        ${opt}
                    </button>
                `).join('');

                qBox.innerHTML = `
                    <p class="question-text"><strong>Q${qIdx + 1}: ${q.qText || q.question}</strong></p>
                    <div class="options-grid">${optionsHtml}</div>
                    <div id="p7-expl-${qIdx}" class="explanation" style="display:none; margin-top:15px;">
                        ${formatExplanation(q.explanation)}
                    </div>
                `;
                quizContainer.appendChild(qBox);
            });
        }
    } else if (articleCard) {
        articleCard.style.display = 'none';
    }

    updateProgressBar();
}

// ----------------------------------------------------
// VALIDATION PART 2
// ----------------------------------------------------
function checkPart2Answer(selectedIdx, btn, part2Data) {
    const parentGrid = btn.closest('.options-grid-3');
    const buttons = parentGrid.querySelectorAll('.option-btn');

    // Empêcher de cliquer plusieurs fois
    buttons.forEach(b => b.disabled = true);

    const correctIndex = part2Data.correctIndex;

    if (selectedIdx === correctIndex) {
        btn.classList.add('btn-correct');
        correctAnswers++;
    } else {
        btn.classList.add('btn-wrong');
        if (buttons[correctIndex]) buttons[correctIndex].classList.add('btn-correct');
    }

    // 1. Affiche la boîte de transcription
    const transcriptBox = document.getElementById('part2-transcript-box');
    if (transcriptBox) transcriptBox.style.display = 'block';

    // 2. Déclenche l'affichage du bloc d'explications et distracteurs
    if (part2Data) {
        showExplanation(part2Data);
    }

    updateProgressBar();
}

// ----------------------------------------------------
// VALIDATION PART 7
// ----------------------------------------------------
function checkPart7Answer(qIdx, selectedIdx, btn, correctIndex, explId) {
    const qBox = btn.closest('.question-box');
    if (qBox.classList.contains('answered')) return;
    qBox.classList.add('answered');

    const buttons = qBox.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true);

    if (selectedIdx === correctIndex) {
        btn.classList.add('btn-correct');
        if (!solvedQuestions.has(qIdx)) {
            solvedQuestions.add(qIdx);
            correctAnswers++;
        }
    } else {
        btn.classList.add('btn-wrong');
        if (buttons[correctIndex]) buttons[correctIndex].classList.add('btn-correct');
    }

    const explDiv = document.getElementById(explId);
    if (explDiv) explDiv.style.display = 'block';

    updateProgressBar();
}

// ----------------------------------------------------
// BARRE DE PROGRESSION
// ----------------------------------------------------
function updateProgressBar() {
    const percent = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    const miniBar = document.getElementById('daily-bar-mini');
    if (miniBar) miniBar.style.width = `${percent}%`;

    const mainBar = document.getElementById('daily-bar-main');
    if (mainBar) mainBar.style.width = `${percent}%`;

    const countText = document.getElementById('daily-count');
    if (countText) countText.innerText = `${correctAnswers}/${totalQuestions}`;
}

// ----------------------------------------------------
// ÉVÉNEMENT / NAVIGATION
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    loadQuizzes();

    // Boutons Suivant / Précédent
    const prevBtn = document.getElementById('prev-day');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (allQuizzes.length === 0) return;
            currentIndex = (currentIndex + 1) % allQuizzes.length;
            renderQuiz(currentIndex);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    const nextBtn = document.getElementById('next-day');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (allQuizzes.length === 0) return;
            currentIndex = (currentIndex - 1 + allQuizzes.length) % allQuizzes.length;
            renderQuiz(currentIndex);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Sélecteur de Part (Part 2 vs Part 7)
    const partSelector = document.getElementById('part-selector');
    if (partSelector) {
        partSelector.addEventListener('change', (e) => {
            const val = e.target.value;
            const part2Card = document.querySelector('.part2-card');
            const p2Header = document.querySelector('h1:nth-of-type(1)');
            const articleCard = document.querySelector('.article-card');
            const p7Header = document.querySelector('h1:nth-of-type(2)');
            const quizContainer = document.getElementById('quiz-container');

            if (val.includes('Part 2')) {
                if (part2Card) part2Card.style.display = 'block';
                if (p2Header) p2Header.style.display = 'block';
                if (articleCard) articleCard.style.display = 'none';
                if (p7Header) p7Header.style.display = 'none';
                if (quizContainer) quizContainer.style.display = 'none';
            } else if (val.includes('Part 7')) {
                if (part2Card) part2Card.style.display = 'none';
                if (p2Header) p2Header.style.display = 'none';
                if (articleCard) articleCard.style.display = 'block';
                if (p7Header) p7Header.style.display = 'block';
                if (quizContainer) quizContainer.style.display = 'block';
            }
        });
    }
});