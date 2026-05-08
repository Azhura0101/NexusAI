document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startScreen = document.getElementById('start-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');
    
    const topicCards = document.querySelectorAll('.topic-card');
    const timerToggle = document.getElementById('timer-toggle');
    const questionCountSelect = document.getElementById('question-count-select');
    
    const questionCounter = document.getElementById('question-counter');
    const topicBadge = document.getElementById('topic-badge');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const timerContainer = document.getElementById('timer-container');
    const timerDisplay = document.getElementById('timer-display');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const feedbackContainer = document.getElementById('feedback-container');
    const feedbackText = document.getElementById('feedback-text');
    const nextBtn = document.getElementById('next-btn');
    
    const scoreNumber = document.getElementById('score-number');
    const totalNumber = document.getElementById('total-number');
    const scoreMessage = document.getElementById('score-message');
    const reviewList = document.getElementById('review-list');
    const restartBtn = document.getElementById('restart-btn');
    const scoreCircle = document.querySelector('.score-circle');

    // State
    let currentTopic = '';
    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let userAnswers = []; // Store to show review later
    
    // Timer State
    let useTimer = false;
    const TIME_LIMIT = 30; // seconds
    let timeRemaining = TIME_LIMIT;
    let timerInterval = null;

    // Initialize Event Listeners
    topicCards.forEach(card => {
        card.addEventListener('click', () => {
            currentTopic = card.dataset.topic;
            startQuiz();
        });
    });

    nextBtn.addEventListener('click', handleNextQuestion);
    restartBtn.addEventListener('click', resetQuiz);

    function startQuiz() {
        useTimer = timerToggle.checked;
        const numQuestions = parseInt(questionCountSelect.value);
        
        // Shuffle the questions array and pick the requested amount
        let allQuestions = [...quizData[currentTopic]];
        allQuestions.sort(() => Math.random() - 0.5); // Simple shuffle
        questions = allQuestions.slice(0, numQuestions);
        
        currentQuestionIndex = 0;
        score = 0;
        userAnswers = [];
        
        // Setup UI
        topicBadge.textContent = currentTopic.toUpperCase();
        startScreen.classList.remove('active');
        quizScreen.classList.add('active');
        
        if (useTimer) {
            timerContainer.classList.remove('hidden');
        } else {
            timerContainer.classList.add('hidden');
        }

        loadQuestion();
    }

    function loadQuestion() {
        resetState();
        
        const q = questions[currentQuestionIndex];
        questionText.textContent = q.question;
        questionCounter.textContent = `Pregunta ${currentQuestionIndex + 1} de ${questions.length}`;
        
        // Update Progress Bar
        const progress = ((currentQuestionIndex) / questions.length) * 100;
        progressBarFill.style.width = `${progress}%`;

        // Render Options
        q.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.classList.add('option-btn');
            btn.textContent = opt;
            btn.dataset.index = index;
            btn.addEventListener('click', selectAnswer);
            optionsContainer.appendChild(btn);
        });

        if (useTimer) {
            startTimer();
        }
    }

    function resetState() {
        nextBtn.classList.add('hidden');
        feedbackContainer.classList.add('hidden');
        optionsContainer.innerHTML = '';
        clearInterval(timerInterval);
        timerContainer.classList.remove('warning');
    }

    function startTimer() {
        timeRemaining = TIME_LIMIT;
        updateTimerDisplay();
        
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateTimerDisplay();
            
            if (timeRemaining <= 5) {
                timerContainer.classList.add('warning');
            }
            
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                handleTimeOut();
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        timerDisplay.textContent = timeRemaining;
    }

    function handleTimeOut() {
        const q = questions[currentQuestionIndex];
        
        // Disable all buttons
        Array.from(optionsContainer.children).forEach(btn => {
            btn.disabled = true;
            if (parseInt(btn.dataset.index) === q.correctAnswer) {
                btn.classList.add('correct');
            }
        });
        
        userAnswers.push({
            question: q.question,
            isCorrect: false,
            explanation: q.explanation,
            selected: "Tiempo agotado"
        });

        showFeedback(false, "¡Tiempo agotado! " + q.explanation);
    }

    function selectAnswer(e) {
        clearInterval(timerInterval);
        const selectedBtn = e.target;
        const selectedIndex = parseInt(selectedBtn.dataset.index);
        const q = questions[currentQuestionIndex];
        const isCorrect = selectedIndex === q.correctAnswer;

        if (isCorrect) {
            score++;
            selectedBtn.classList.add('correct');
        } else {
            selectedBtn.classList.add('wrong');
            // Highlight correct answer
            Array.from(optionsContainer.children).forEach(btn => {
                if (parseInt(btn.dataset.index) === q.correctAnswer) {
                    btn.classList.add('correct');
                }
            });
        }

        // Disable all buttons
        Array.from(optionsContainer.children).forEach(btn => btn.disabled = true);

        // Save for review
        userAnswers.push({
            question: q.question,
            isCorrect: isCorrect,
            explanation: q.explanation,
            selected: q.options[selectedIndex]
        });

        showFeedback(isCorrect, q.explanation);
    }

    function showFeedback(isCorrect, text) {
        feedbackContainer.classList.remove('hidden');
        feedbackText.textContent = text;
        feedbackContainer.style.borderLeftColor = isCorrect ? 'var(--success-color)' : 'var(--danger-color)';
        nextBtn.classList.remove('hidden');
        
        // update progress bar properly
        const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
        progressBarFill.style.width = `${progress}%`;
    }

    function handleNextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion();
        } else {
            showResult();
        }
    }

    function showResult() {
        quizScreen.classList.remove('active');
        resultScreen.classList.add('active');
        
        scoreNumber.textContent = score;
        totalNumber.textContent = questions.length;
        
        // Calculate percentage for circular progress
        const percentage = (score / questions.length) * 100;
        scoreCircle.style.background = `conic-gradient(var(--primary-color) ${percentage}%, var(--panel-bg) 0%)`;
        
        if (percentage >= 80) {
            scoreMessage.textContent = "¡Excelente! Tienes bases muy sólidas.";
        } else if (percentage >= 50) {
            scoreMessage.textContent = "Buen trabajo, pero aún hay conceptos que reforzar.";
        } else {
            scoreMessage.textContent = "Necesitas repasar estos conceptos clave.";
        }
        
        // Build review list
        reviewList.innerHTML = '';
        userAnswers.forEach((ans, i) => {
            const div = document.createElement('div');
            div.className = `review-item ${ans.isCorrect ? 'correct' : 'wrong'}`;
            div.innerHTML = `
                <p><strong>P${i+1}:</strong> ${ans.question}</p>
                <p class="explanation">${ans.explanation}</p>
            `;
            reviewList.appendChild(div);
        });
    }

    function resetQuiz() {
        resultScreen.classList.remove('active');
        startScreen.classList.add('active');
    }
});
