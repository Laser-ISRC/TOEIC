async function loadDailyChallenge() {
    try {
        // Le "cache busting" (?v=...) force le navigateur à lire le JSON frais
        const response = await fetch('questions.json?v=' + new Date().getTime());
        const data = await response.json();

        // On prend la dernière question du tableau (la plus récente)
        const dailyData = data[data.length - 1];

        renderPage(dailyData);
    } catch (error) {
        console.error("Erreur de chargement du JSON :", error);
        document.getElementById('art-title').innerText = "Erreur de chargement ❌";
    }
}

function renderPage(data) {
    // Remplissage de l'article
    document.getElementById('art-title').innerText = data.articleTitle;
    document.getElementById('art-link').href = data.articleLink;
    document.getElementById('art-img').src = data.articleImg;
    
    // Gestion du texte (supporte les sauts de ligne \n\n)
    const textDiv = document.getElementById('art-text');
    textDiv.innerHTML = data.articleBody.split('\n\n').map(p => `<p>${p}</p>`).join('');

    // Remplissage du Quiz
    const container = document.getElementById('quiz-container');
    container.innerHTML = ""; // On vide avant de remplir

    data.questions.forEach((q, qIdx) => {
        const qBox = document.createElement('div');
        qBox.className = 'question-box';
        qBox.innerHTML = `
            <p><strong>Q${qIdx + 1}: ${q.qText}</strong></p>
            <div class="options-list">
                ${q.options.map((opt, optIdx) => `
                    <button class="option-btn" onclick="verify(${qIdx}, ${optIdx}, this, ${q.correctIndex}, 'expl-${qIdx}')">
                        ${opt}
                    </button>
                `).join('')}
            </div>
            <div id="expl-${qIdx}" class="explanation">
                ${q.explanation}
            </div>
        `;
        container.appendChild(qBox);
    });
}

function verify(qIdx, optIdx, btn, correctIndex, explId) {
    const isCorrect = optIdx === correctIndex;
    const parent = btn.parentElement;
    
    // Désactive les boutons du bloc de CETTE question uniquement
    parent.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
    
    btn.classList.add(isCorrect ? 'btn-correct' : 'btn-wrong');
    document.getElementById(explId).style.display = 'block';
}

// Lancement au chargement de la page
window.onload = loadDailyChallenge;