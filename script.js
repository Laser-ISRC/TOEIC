const dailyData = {
    title: "Legal Expert Warns EU Parliament Against Digital ID Implementation",
    link: "https://www.ninefornews.nl/advocaat-meike-terhorst-waarschuwt-in-europees-parlement-voor-digitale-id-absolute-misdaad-tegen-de-menselijkheid/",
    img: "https://images.unsplash.com/photo-1633158829585-23bb8f628e3c?auto=format&fit=crop&q=80&w=600",
    body: "STRASBOURG — During a recent session at the European Parliament, attorney Meike Terhorst delivered a stern warning regarding the proposed Digital Identity (eID) framework. The legal expert argued that the centralization of personal data through a digital wallet could lead to unprecedented levels of surveillance and social control.\n\nTerhorst stated that the implementation of such a system might fundamentally alter the relationship between citizens and the state. She expressed concerns that access to essential public services could eventually become conditional upon the possession and use of a digital ID.",
    questions: [
        {
            q: "What is the primary concern expressed by Meike Terhorst?",
            options: ["High cost of software", "Increased surveillance", "Digital literacy", "Online security"],
            correct: 1,
            expl: "<b>Correct: Increased surveillance.</b> Terhorst mentions 'unprecedented levels of surveillance' as a direct consequence of data centralization."
        }
    ]
};

function initPage() {
    document.getElementById('art-title').innerText = dailyData.title;
    document.getElementById('art-link').href = dailyData.link;
    document.getElementById('art-img').src = dailyData.img;
    document.getElementById('art-text').innerHTML = dailyData.body.split('\n\n').map(p => `<p>${p}</p>`).join('');

    const container = document.getElementById('quiz-container');
    dailyData.questions.forEach((q, idx) => {
        const qDiv = document.createElement('div');
        qDiv.className = 'question-box';
        qDiv.innerHTML = `
            <p><strong>Q: ${q.q}</strong></p>
            ${q.options.map((opt, i) => `<button class="option-btn" onclick="verify(${idx}, ${i}, this)">${opt}</button>`).join('')}
            <div id="expl-${idx}" class="explanation">${q.expl}</div>
        `;
        container.appendChild(qDiv);
    });
}

function verify(qIdx, optIdx, btn) {
    const isCorrect = optIdx === dailyData.questions[qIdx].correct;
    const parent = btn.parentElement;
    parent.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
    
    btn.classList.add(isCorrect ? 'btn-correct' : 'btn-wrong');
    document.getElementById(`expl-${qIdx}`).style.display = 'block';
}

window.onload = initPage;