// Fonction pour valider une réponse
function checkAnswer(button, isCorrect, explanationId) {
    const parent = button.parentElement;
    const buttons = parent.querySelectorAll('.option-btn');
    const explanationDiv = document.getElementById(explanationId);

    // Désactiver tous les boutons après le clic
    buttons.forEach(btn => btn.disabled = true);

    if (isCorrect) {
        button.classList.add('btn-correct');
    } else {
        button.classList.add('btn-wrong');
        // Optionnel : montrer la bonne réponse en vert quand même
    }

    // Afficher l'analyse des distracteurs
    explanationDiv.style.display = 'block';
}

// Fonction pour injecter les données du JSON dans le HTML
function displayPart7(data) {
    document.getElementById('art-title').innerText = data.articleTitle;
    document.getElementById('art-link').href = data.articleLink;
    document.getElementById('art-img').src = data.articleImg;
    
    // Injection du texte avec paragraphes
    const artTextDiv = document.getElementById('art-text');
    artTextDiv.innerHTML = data.articleBody.split('\n\n').map(p => `<p>${p}</p>`).join('');

    // Injection des questions
    const quizContainer = document.getElementById('quiz-container');
    quizContainer.innerHTML = data.questions.map((q, qIndex) => `
        <div class="question-block">
            <p><strong>Question ${qIndex + 1}:</strong> ${q.qText}</p>
            ${q.options.map((opt, optIndex) => `
                <button class="option-btn" onclick="handleAnswer(this, ${optIndex === q.correctIndex}, 'expl-${q.id}')">
                    ${opt}
                </button>
            `).join('')}
            <div id="expl-${q.id}" class="explanation-box">
                ${q.explanation}
            </div>
        </div>
    `).join('');
}

// Pour le test, on appelle la fonction avec notre objet
// (Plus tard, ce sera un fetch('questions.json'))
const testData = /* coller le bloc JSON ici pour tester */;
displayPart7(testData);