// Konfigurasi API
const API_URL = 'https://project-make-ai-agent.onrender.com/analyze';

// Global Variables
let stream = null;
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const modal = document.getElementById('captureModal');
const modalContent = document.getElementById('modalContent');
const imageInput = document.getElementById('imageInput');
const previewImage = document.getElementById('previewImage');

// --- Tab Navigation Logic ---
const navItems = document.querySelectorAll('.nav-item[data-target]');
const pageSections = document.querySelectorAll('.page-section');
let chartsInitialized = false;

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all nav items
        navItems.forEach(nav => nav.classList.remove('active'));
        // Add active class to clicked nav item
        item.classList.add('active');

        // Hide all sections
        pageSections.forEach(sec => sec.classList.remove('active'));
        
        // Show target section
        const targetId = item.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');

        // Initialize charts if target is analitik and not yet initialized
        if (targetId === 'analitik' && !chartsInitialized) {
            setTimeout(() => {
                initCharts();
                chartsInitialized = true;
            }, 100); // slight delay to ensure container has dimensions
        }
    });
});

// --- Chart.js Logic ---
function initCharts() {
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = "#64748B";

    // 1. Historical Health Line Chart
    const ctxHistory = document.getElementById('historicalChart').getContext('2d');
    
    // Create gradient
    let gradientHistory = ctxHistory.createLinearGradient(0, 0, 0, 400);
    gradientHistory.addColorStop(0, 'rgba(200, 230, 100, 0.4)');
    gradientHistory.addColorStop(1, 'rgba(200, 230, 100, 0.0)');

    new Chart(ctxHistory, {
        type: 'line',
        data: {
            labels: ['1 Mei', '5 Mei', '10 Mei', '15 Mei', '20 Mei', '25 Mei', '30 Mei'],
            datasets: [{
                label: 'Skor Kesehatan (%)',
                data: [72, 75, 71, 78, 85, 84, 89],
                borderColor: '#C8E664',
                backgroundColor: gradientHistory,
                borderWidth: 4,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#0B2E26',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0B2E26',
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 14 },
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) { return `Skor: ${context.parsed.y}%`; }
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: false, 
                    min: 60,
                    max: 100, 
                    grid: { borderDash: [5, 5], color: '#f1f5f9', drawBorder: false } 
                },
                x: { grid: { display: false, drawBorder: false } }
            }
        }
    });

    // 2. Production Comparison Bar Chart
    const ctxProd = document.getElementById('productionChart').getContext('2d');
    new Chart(ctxProd, {
        type: 'bar',
        data: {
            labels: ['Lahan A', 'Lahan B', 'Lahan C'],
            datasets: [
                {
                    label: 'Musim Lalu (Ton)',
                    data: [5.2, 2.5, 2.8],
                    backgroundColor: '#E2E8F0',
                    borderRadius: 8,
                    barPercentage: 0.6,
                    categoryPercentage: 0.8
                },
                {
                    label: 'Estimasi Saat Ini (Ton)',
                    data: [6.5, 3.0, 3.0],
                    backgroundColor: '#0B2E26',
                    borderRadius: 8,
                    barPercentage: 0.6,
                    categoryPercentage: 0.8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true, padding: 20, font: { weight: 'bold' } }
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [5, 5], color: '#f1f5f9', drawBorder: false } },
                x: { grid: { display: false, drawBorder: false } }
            }
        }
    });
}

// --- Fungsi Modal & Kamera ---
function openCaptureModal() {
    modal.classList.remove('hidden');
    // Trigger reflow
    void modal.offsetWidth;
    modal.classList.add('modal-overlay-show');
    modalContent.classList.add('modal-content-show');
}

function closeCaptureModal() {
    modalContent.classList.remove('modal-content-show');
    modal.classList.remove('modal-overlay-show');
    setTimeout(() => {
        modal.classList.add('hidden');
        stopCamera();
    }, 300); // Wait for transition
}

async function startCamera() {
    document.getElementById('cameraContainer').classList.remove('hidden');
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
        });
        video.srcObject = stream;
    } catch (err) {
        alert("Akses kamera ditolak atau tidak tersedia.");
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        document.getElementById('cameraContainer').classList.add('hidden');
    }
}

function takeSnapshot() {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        imageInput.files = dataTransfer.files;

        previewImage.src = URL.createObjectURL(blob);
        closeCaptureModal();
    }, 'image/jpeg');
}

// --- Update Circle Health Progress ---
function setHealthScore(score) {
    const circle = document.getElementById('healthCircle');
    const scoreText = document.getElementById('healthScoreCircle');
    
    // Circumference calculation for 15.9155 radius is ~100
    // stroke-dasharray is "length, gap". So "score, 100" creates a progress ring.
    circle.setAttribute('stroke-dasharray', `${score}, 100`);
    
    // Animate text
    let current = 0;
    const interval = setInterval(() => {
        if (current >= score) {
            clearInterval(interval);
            scoreText.innerText = score;
        } else {
            current++;
            scoreText.innerText = current;
        }
    }, 15);
    
    // Colors based on score
    circle.classList.remove('text-slate-200', 'text-[#C8E664]', 'text-orange-500', 'text-red-500');
    if(score >= 80) {
        circle.classList.add('text-[#C8E664]');
        scoreText.classList.replace('text-slate-400', 'text-[#0B2E26]');
    }
    else if(score >= 50) {
        circle.classList.add('text-orange-500');
        scoreText.classList.replace('text-slate-400', 'text-orange-600');
    }
    else {
        circle.classList.add('text-red-500');
        scoreText.classList.replace('text-slate-400', 'text-red-600');
    }
}

// --- Fungsi Utama: Analisis AI ---
async function uploadAndAnalyze() {
    const location = document.getElementById('locationInput').value;
    const loading = document.getElementById('loading');
    const diagnosisLabel = document.getElementById('diagnosisLabel');
    const actionList = document.getElementById('actionPlan');

    // Pastikan ada file sebelum mengirim
    if (!imageInput.files[0]) {
        alert("Pilih atau ambil foto daun bawang terlebih dahulu!");
        return;
    }

    const formData = new FormData();
    formData.append('image', imageInput.files[0]);
    formData.append('location', location);

    // Tampilkan loading UI
    loading.classList.remove('hidden');
    diagnosisLabel.innerText = "Menganalisis dengan AI...";

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
            // Tidak perlu header 'Content-Type', browser akan mengaturnya otomatis untuk FormData
        });

        if (!response.ok) throw new Error('Gagal menghubungi server AI');

        const data = await response.json();

        // 1. Update Diagnosa Utama
        diagnosisLabel.innerText = data.primary_diagnosis;
        diagnosisLabel.className = 'font-bold text-xl text-[#0B2E26]'; 

        // 2. Update Skor Kesehatan (Animasi Lingkaran)
        setHealthScore(data.health_index);

        // 3. Update Daftar Tindakan (Action Plan)
        actionList.innerHTML = "";
        data.action_plan.forEach(item => {
            const li = document.createElement('li');
            li.className = "flex items-start gap-2 text-slate-700 font-semibold mb-2";
            li.innerHTML = `<span class="text-[#C8E664]">⚡</span> ${item}`;
            actionList.appendChild(li);
        });

        // 4. (Opsional) Tampilkan informasi cuaca yang didapat dari AI
        console.log("Konteks Cuaca:", data.weather_context);

    } catch (error) {
        console.error("Error:", error);
        diagnosisLabel.innerText = "Error: Gagal Analisis";
        alert("Terjadi masalah saat menghubungkan ke AgriMind Cloud. Pastikan koneksi internet stabil.");
    } finally {
        loading.classList.add('hidden');
    }
}
// --- Event Listeners ---
document.getElementById('analyzeBtn').addEventListener('click', uploadAndAnalyze);
document.getElementById('galleryBtn').addEventListener('click', () => imageInput.click());
document.getElementById('cameraBtn').addEventListener('click', startCamera);
document.getElementById('snapBtn').addEventListener('click', takeSnapshot);
document.getElementById('closeModalBtn').addEventListener('click', closeCaptureModal);

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeCaptureModal();
});

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        previewImage.src = URL.createObjectURL(file);
        closeCaptureModal();
    }
});
