async function loadDailyChallenge() {
    const titleElement = document.getElementById('art-title');
    
    try {
        // Le ?v= force GitHub à ne pas utiliser une vieille version en cache
        const response = await fetch('questions.json?v=' + new Date().getTime());
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status} - Fichier non trouvé`);
        }

        const data = await response.json();
        const dailyData = data[data.length - 1]; // Prend le dernier élément du tableau
        renderPage(dailyData);

    } catch (error) {
        console.error("Détails de l'erreur:", error);
        titleElement.innerText = "Erreur : " + error.message;
        titleElement.style.color = "red";
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