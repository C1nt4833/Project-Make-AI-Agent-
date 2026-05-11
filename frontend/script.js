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

// --- Tab Navigation & Mobile Sidebar Logic ---
const navItems = document.querySelectorAll('.nav-item[data-target]');
const pageSections = document.querySelectorAll('.page-section');
let chartsInitialized = false;

// Sidebar toggle logic
const openSidebarBtn = document.getElementById('openSidebarBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function openSidebar() {
    sidebar.classList.remove('-translate-x-full');
    sidebarOverlay.classList.remove('hidden');
    setTimeout(() => sidebarOverlay.classList.remove('opacity-0'), 10);
}

function closeSidebar() {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('opacity-0');
    setTimeout(() => sidebarOverlay.classList.add('hidden'), 300);
}

if (openSidebarBtn) openSidebarBtn.addEventListener('click', openSidebar);
if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

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

        // Close sidebar on mobile
        if (window.innerWidth < 768) {
            closeSidebar();
        }

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

    if (!imageInput.files[0]) {
        // Dummy run if no file for demo purposes (to showcase UI)
        loading.classList.remove('hidden');
        diagnosisLabel.innerText = "Menganalisis...";
        diagnosisLabel.classList.add('text-orange-500');
        
        setTimeout(() => {
            diagnosisLabel.innerText = "Bercak Ungu (Alternaria)";
            diagnosisLabel.classList.remove('text-orange-500');
            diagnosisLabel.classList.add('text-red-600');
            
            setHealthScore(68);
            
            actionList.innerHTML = `
                <li class="flex items-start gap-2"><svg class="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> Terdeteksi spora pada daun</li>
                <li class="flex items-start gap-2"><svg class="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Semprot Difenokonazol sore ini</li>
                <li class="flex items-start gap-2"><svg class="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Kurangi volume penyiraman besok</li>
            `;
            loading.classList.add('hidden');
        }, 1500);
        return;
    }

    const formData = new FormData();
    formData.append('image', imageInput.files[0]);
    formData.append('location', location);

    loading.classList.remove('hidden');
    diagnosisLabel.innerText = "Mengirim ke Cloud...";

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();

        // Update UI
        diagnosisLabel.innerText = data.primary_diagnosis;
        diagnosisLabel.className = 'font-bold text-base md:text-lg text-[#0B2E26] truncate'; // reset class
        setHealthScore(data.health_index);

        // Update Action Plan
        actionList.innerHTML = "";
        data.action_plan.forEach(item => {
            const li = document.createElement('li');
            li.className = "flex items-start gap-2 text-slate-700 font-semibold";
            li.innerHTML = `<svg class="w-4 h-4 text-[#C8E664] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> <span>${item}</span>`;
            actionList.appendChild(li);
        });

    } catch (error) {
        console.error("Error:", error);
        alert("Gagal terhubung ke server API. Pastikan API berjalan di alamat: " + API_URL);
        // Fallback to dummy data
        loading.classList.add('hidden');
        // document.getElementById('analyzeBtn').click(); // uncomment to force dummy run on fail
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
