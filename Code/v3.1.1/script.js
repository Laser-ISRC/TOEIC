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

// Formatage des explications (Texte ou Objet Distractors)
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

    if (correctEl) {
        correctEl.innerHTML = `<strong>Correct :</strong> ${exp.correct || ''}`;
    }

    if (distractorsEl) {
        distractorsEl.innerHTML = '';
        if (exp.distractors && typeof exp.distractors === 'object') {
            Object.entries(exp.distractors).forEach(([key, text]) => {
                const li = document.createElement('li');
                const cleanKey = key.replace(/[\(\)]/g, ''); 
                li.innerHTML = `<strong>Option ${cleanKey} :</strong> ${text}`;
                distractorsEl.appendChild(li);
            });
        }
    }

    container.style.display = 'block';
}

function getAccentBadgeHTML(accentText) {
    if (!accentText) return '';

    let countryCode = '';
    const upperAccent = accentText.toUpperCase();
    if (upperAccent.includes('US')) countryCode = 'us';
    else if (upperAccent.includes('UK') || upperAccent.includes('GB')) countryCode = 'gb';
    else if (upperAccent.includes('AU')) countryCode = 'au';
    else if (upperAccent.includes('CA')) countryCode = 'ca';
    else if (upperAccent.includes('NZ')) countryCode = 'nz';

    if (countryCode) {
        const flagUrl = `https://flagcdn.com/${countryCode}.svg`;
        return `<img src="${flagUrl}" alt="${accentText}" title="${accentText}" class="flag-icon" style="width:2em; height:2em; object-fit:cover; border-radius:50%; vertical-align:middle; display:inline-block;" />`;
    }

    return `<span>${accentText}</span>`;
}

function renderQuiz(index) {
    const quiz = allQuizzes[index];
    if (!quiz) return;

    const quizDisplay = document.getElementById('current-quiz-display');
    if (quizDisplay) quizDisplay.innerText = `Quiz #${quiz.index || (allQuizzes.length - index)}`;

    solvedQuestions.clear();
    correctAnswers = 0;

    // Calcul du nombre total de questions pour le quiz courant
    const p2Count = quiz.part2 ? quiz.part2.length : 0;
    let p3Count = 0;
    if (quiz.part3) {
        quiz.part3.forEach(set => p3Count += (set.questions ? set.questions.length : 0));
    }
    const p7Count = quiz.part7 && quiz.part7.questions ? quiz.part7.questions.length : 0;
    
    totalQuestions = p2Count + p3Count + p7Count;

    // ----------------------------------------------------
    // 1. PART 2 (Listening)
    // ----------------------------------------------------
    const part2Data = quiz.part2 ? quiz.part2[0] : null;
    const part2Section = document.getElementById('part2-section');

    const container = document.getElementById('explanation-container');
    if (container) container.style.display = 'none';

    const accentDisplay = document.getElementById('quiz-accent');
    if (accentDisplay && part2Data) {
        accentDisplay.innerHTML = getAccentBadgeHTML(part2Data.accent);
    }

    if (part2Data && part2Section) {
        const audioEl = document.getElementById('part2-audio');
        if (audioEl) audioEl.src = part2Data.audioUrl || part2Data.outputFile || '';

        const transcriptBox = document.getElementById('part2-transcript-box');
        if (transcriptBox) transcriptBox.style.display = 'none';

        const p2Buttons = part2Section.querySelectorAll('.options-grid-3 .option-btn');
        p2Buttons.forEach((btn, optIdx) => {
            btn.className = 'option-btn';
            btn.disabled = false;
            btn.onclick = () => checkPart2Answer(optIdx, btn, part2Data);
        });

        const transcriptQ = document.getElementById('p2-trans-q');
        if (transcriptQ && part2Data.transcript) {
            transcriptQ.innerHTML = `<strong>Q:</strong> ${part2Data.transcript.question}`;
        }

        const transcriptOpts = document.getElementById('p2-trans-options');
        if (transcriptOpts && part2Data.transcript) {
            const labels = ['A', 'B', 'C'];
            transcriptOpts.innerHTML = part2Data.transcript.options.map((opt, i) => `
                <li class="${i === part2Data.correctIndex ? 'correct' : ''}">
                    <strong>${labels[i]}:</strong> ${opt}
                </li>
            `).join('');
        }
    }

   // ----------------------------------------------------
    // 2. PART 3 (Conversations)
    // ----------------------------------------------------
    const part3Container = document.getElementById('part3-container');
    if (part3Container) {
        part3Container.innerHTML = '';

        if (quiz.part3 && quiz.part3.length > 0) {
            quiz.part3.forEach((set, setIdx) => {
                const setCard = document.createElement('div');
                setCard.className = 'part3-card';

                // Génération de l'audio global du dialogue
                const audioPath = set.audioUrl || (set.outputFile ? `Audio/part3/${set.outputFile}` : '');
                let html = `
                    <div class="audio-player-box part3-audio-box">
                        <audio controls src="${audioPath}"></audio>
                    </div>
                `;

                // Questions du set
                if (set.questions && set.questions.length > 0) {
                    set.questions.forEach((q, qIdx) => {
                        const globalQId = `p3_${setIdx}_${qIdx}`;
                        const labels = ['A', 'B', 'C', 'D'];

                        const optionsHtml = q.options.map((opt, optIdx) => `
                            <button class="option-btn" onclick="checkPart3Answer('${globalQId}', ${optIdx}, this, ${q.correctIndex})">
                                ${opt.startsWith('(') ? opt : `(${labels[optIdx]}) ${opt}`}
                            </button>
                        `).join('');

                        html += `
                            <div class="question-box part3-question-box" id="qbox-${globalQId}">
                                <p class="question-text"><strong>Q${q.qNum || (qIdx + 1)}: ${q.qText}</strong></p>
                                <div class="options-grid part3-options-grid">${optionsHtml}</div>
                                <div id="expl-${globalQId}" class="explanation part3-explanation">
                                    ${formatExplanation(q.explanation)}
                                </div>
                            </div>
                        `;
                    });
                }

                // Transcription du dialogue
                if (set.transcript) {
                    let scriptLines = set.transcript.map(line => `
                        <p><strong>${line.speaker} (${line.accent || 'US'}) :</strong> ${line.text}</p>
                    `).join('');

                    html += `
                        <details class="transcript-box part3-transcript-box">
                            <summary class="part3-transcript-summary">Transcript of the dialogue</summary>
                            <div class="part3-transcript-content">${scriptLines}</div>
                        </details>
                    `;
                }

                setCard.innerHTML = html;
                part3Container.appendChild(setCard);
            });
        }
    }

    // ----------------------------------------------------
    // 3. PART 7 (Reading Article & Questions)
    // ----------------------------------------------------
    const p7Data = quiz.part7;
    const part7Section = document.getElementById('part7-section');

    if (p7Data && part7Section) {
        const artTitle = document.getElementById('art-title');
        if (artTitle) artTitle.innerText = p7Data.articleTitle || p7Data.title || '';

        const artLink = document.getElementById('art-link');
        if (artLink) {
            if (p7Data.articleLink || p7Data.sourceUrl) {
                artLink.href = p7Data.articleLink || p7Data.sourceUrl;
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

        const quizContainer = document.getElementById('quiz-container');
        if (quizContainer) {
            quizContainer.innerHTML = '';

            const questionsList = p7Data.questions || [];
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
    }

    // Met à jour la visibilité selon le sélecteur
    updatePartVisibility();
    updateProgressBar();
}

// ----------------------------------------------------
// VALIDATIONS DES RÉPONSES
// ----------------------------------------------------
function checkPart2Answer(selectedIdx, btn, part2Data) {
    const parentGrid = btn.closest('.options-grid-3');
    const buttons = parentGrid.querySelectorAll('.option-btn');

    buttons.forEach(b => b.disabled = true);

    const correctIndex = part2Data.correctIndex;

    if (selectedIdx === correctIndex) {
        btn.classList.add('btn-correct');
        correctAnswers++;
    } else {
        btn.classList.add('btn-wrong');
        if (buttons[correctIndex]) buttons[correctIndex].classList.add('btn-correct');
    }

    const transcriptBox = document.getElementById('part2-transcript-box');
    if (transcriptBox) transcriptBox.style.display = 'block';

    if (part2Data) {
        showExplanation(part2Data);
    }

    updateProgressBar();
}

function checkPart3Answer(globalQId, selectedIdx, btn, correctIndex) {
    const qBox = document.getElementById(`qbox-${globalQId}`);
    if (!qBox || qBox.classList.contains('answered')) return;

    qBox.classList.add('answered');
    const buttons = qBox.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true);

    if (selectedIdx === correctIndex) {
        btn.classList.add('btn-correct');
        if (!solvedQuestions.has(globalQId)) {
            solvedQuestions.add(globalQId);
            correctAnswers++;
        }
    } else {
        btn.classList.add('btn-wrong');
        if (buttons[correctIndex]) buttons[correctIndex].classList.add('btn-correct');
    }

    const explDiv = document.getElementById(`expl-${globalQId}`);
    if (explDiv) explDiv.style.display = 'block';

    updateProgressBar();
}

function checkPart7Answer(qIdx, selectedIdx, btn, correctIndex, explId) {
    const qBox = btn.closest('.question-box');
    if (!qBox || qBox.classList.contains('answered')) return;
    qBox.classList.add('answered');

    const buttons = qBox.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true);

    const qKey = `p7_${qIdx}`;
    if (selectedIdx === correctIndex) {
        btn.classList.add('btn-correct');
        if (!solvedQuestions.has(qKey)) {
            solvedQuestions.add(qKey);
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
// BARRE DE PROGRESSION & VISIBILITÉ
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

function updatePartVisibility() {
    const partSelector = document.getElementById('part-selector');
    if (!partSelector) return;

    const val = partSelector.value.toLowerCase();
    const p2Section = document.getElementById('part2-section');
    const p3Section = document.getElementById('part3-section');
    const p7Section = document.getElementById('part7-section');

    if (val === 'all') {
        if (p2Section) p2Section.style.display = 'block';
        if (p3Section) p3Section.style.display = 'block';
        if (p7Section) p7Section.style.display = 'block';
    } else {
        if (p2Section) p2Section.style.display = val.includes('part2') ? 'block' : 'none';
        if (p3Section) p3Section.style.display = val.includes('part3') ? 'block' : 'none';
        if (p7Section) p7Section.style.display = val.includes('part7') ? 'block' : 'none';
    }
}

// ----------------------------------------------------
// INITIALISATION
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    loadQuizzes();

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

    const partSelector = document.getElementById('part-selector');
    if (partSelector) {
        partSelector.addEventListener('change', () => {
            updatePartVisibility();
        });
    }
});