document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const introOverlay = document.getElementById('intro-overlay');
    const appContent = document.getElementById('app');
    const bgMusic = document.getElementById('bg-music');
    const giftCard = document.getElementById('giftCard');
    const frontFace = document.querySelector('.gift-card-face.front');
    const backFace = document.querySelector('.gift-card-face.back');
    const progressDots = document.querySelectorAll('.progress-dots .dot');

    // --- Card Flip Animation ---
    let currentStep = 1;
    let isTransitioning = false;

    if (giftCard) {
        giftCard.addEventListener('click', () => {
            if (isTransitioning) return;
            isTransitioning = true;

            if (currentStep === 1) {
                // Step 1: Flip to reveal "For Aafreen"
                frontFace.classList.remove('active');
                frontFace.classList.add('flipped');

                setTimeout(() => {
                    backFace.classList.add('active');
                    progressDots[0].classList.remove('active');
                    progressDots[1].classList.add('active');
                    isTransitioning = false;
                    currentStep = 2;
                }, 400);

            } else if (currentStep === 2) {
                // Step 2: Transition to main content

                // Start music - DELAYED until candle blow
                /* if (bgMusic) {
                    bgMusic.volume = 0.3;
                    bgMusic.play().catch(e => console.log("Audio blocked", e));
                } */

                // Fade out intro
                setTimeout(() => {
                    if (introOverlay) {
                        introOverlay.style.opacity = '0';

                        setTimeout(() => {
                            introOverlay.style.display = 'none';
                            if (appContent) appContent.classList.remove('hidden');
                            initAnimations();
                        }, 1500);
                    }
                }, 500);
            }
        });
    }

    // --- Timer Logic ---
    const birthDate = new Date('2009-11-29T00:00:00');

    function updateTimer() {
        const now = new Date();
        const diff = now - birthDate;

        const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
        const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('years').innerText = years;
        document.getElementById('days').innerText = days;
        document.getElementById('hours').innerText = hours;
        document.getElementById('minutes').innerText = minutes;
        document.getElementById('seconds').innerText = seconds;
    }

    setInterval(updateTimer, 1000);
    updateTimer();

    // --- Audio Player Logic ---
    const voiceNote = document.getElementById('voice-note');
    const playBtn = document.getElementById('play-voice-btn');
    const seekBar = document.getElementById('seek-bar');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');
    const visualizer = document.querySelector('.visualizer');

    playBtn.addEventListener('click', () => {
        if (voiceNote.paused) {
            if (bgMusic) bgMusic.volume = 0.1;
            voiceNote.play().then(() => {
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                visualizer.classList.add('active');
            }).catch(e => console.log("Error:", e));
        } else {
            voiceNote.pause();
            if (bgMusic) bgMusic.volume = 0.3;
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            visualizer.classList.remove('active');
        }
    });

    voiceNote.addEventListener('timeupdate', () => {
        const current = voiceNote.currentTime;
        const duration = voiceNote.duration;

        if (!isNaN(duration)) {
            seekBar.max = duration;
            seekBar.value = current;
            currentTimeEl.textContent = formatTime(current);
            durationEl.textContent = formatTime(duration);
        }
    });

    seekBar.addEventListener('input', () => {
        voiceNote.currentTime = seekBar.value;
    });

    voiceNote.addEventListener('ended', () => {
        if (bgMusic) bgMusic.volume = 0.3;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        visualizer.classList.remove('active');
        seekBar.value = 0;
        currentTimeEl.textContent = "0:00";
    });

    function formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    // --- Candle Blowing ---
    const blowBtn = document.getElementById('blow-btn');
    const wishMessage = document.getElementById('wish-message');
    let isListening = false;
    let audioContext;

    blowBtn.addEventListener('click', async () => {
        if (isListening) return;

        blowBtn.innerHTML = '<i class="fas fa-microphone"></i> Blow into Mic...';

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            analyser.fftSize = 256;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            isListening = true;

            function detectBlow() {
                if (!isListening) return;
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
                let average = sum / bufferLength;

                if (average > 90) { // Increased threshold for realistic blow
                    blowOutCandle();
                } else {
                    requestAnimationFrame(detectBlow);
                }
            }
            detectBlow();

        } catch (err) {
            blowBtn.innerHTML = 'Tap to Blow Candles 👆';
            blowBtn.onclick = blowOutCandle;
        }
    });

    function blowOutCandle() {
        isListening = false;
        if (audioContext) audioContext.close();

        const flames = document.querySelectorAll('.flame');
        flames.forEach(flame => {
            flame.classList.add('out');

            // Create smoke effect for each candle
            const smoke = document.createElement('div');
            smoke.classList.add('smoke', 'active');
            flame.parentNode.appendChild(smoke);
        });

        blowBtn.style.display = 'none';
        wishMessage.classList.add('show');

        // Play Happy Birthday Song
        if (bgMusic) {
            bgMusic.currentTime = 0;
            bgMusic.volume = 0.3;
            bgMusic.play().catch(e => console.log("Audio blocked", e));
        }

        startConfetti();
    }

    // --- Confetti ---
    function startConfetti() {
        const canvas = document.createElement('canvas');
        canvas.id = 'confetti-canvas';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const colors = ['#FF69B4', '#FFD700', '#87CEEB', '#FFB7B2', '#98FB98'];

        for (let i = 0; i < 300; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                size: Math.random() * 8 + 4,
                speedY: Math.random() * 3 + 2,
                speedX: Math.random() * 2 - 1,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360
            });
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.y += p.speedY;
                p.x += p.speedX;
                p.rotation += 2;

                if (p.y > canvas.height) p.y = -10;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            });
            requestAnimationFrame(animate);
        }
        animate();

        setTimeout(() => canvas.remove(), 8000);
    }

    // --- Scroll Animations ---
    function initAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.event, .photo-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s ease';
            observer.observe(el);
        });
    }
});
