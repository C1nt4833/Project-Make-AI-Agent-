const sectionLinks = document.querySelectorAll('.sidebar-link');
const sections = document.querySelectorAll('[data-section]');
const dropZone = document.getElementById('dropZone');
const previewImage = document.getElementById('previewImage');
const analyzeBtn = document.getElementById('analyzeBtn');
const diagnosisLabel = document.getElementById('diagnosisLabel');
const confidenceLabel = document.getElementById('confidenceLabel');
const healthScoreLabel = document.getElementById('healthScoreLabel');
const riskAssessmentLabel = document.getElementById('riskAssessmentLabel');
const weatherContextLabel = document.getElementById('weatherContextLabel');
const soilMoistureLabel = document.getElementById('soilMoistureLabel');
const phLevelLabel = document.getElementById('phLevelLabel');
const actionPlanList = document.getElementById('actionPlan');
const healthCircle = document.getElementById('healthCircle');
const healthIndexValue = document.getElementById('healthIndexValue');
const loading = document.getElementById('loading');
const chartCanvas = document.getElementById('growthChart');

let selectedFile = null;
const fileInput = createHiddenFileInput();
let growthChart = null;

function createHiddenFileInput() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.className = 'hidden';
  input.addEventListener('change', handleFileSelection);
  document.body.appendChild(input);
  return input;
}

function handleFileSelection(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  selectedFile = file;
  const reader = new FileReader();

  reader.onload = () => {
    if (!previewImage) {
      return;
    }

    previewImage.src = reader.result;
  };

  reader.readAsDataURL(file);
}

function setLoading(isLoading) {
  if (loading) {
    loading.classList.toggle('hidden', !isLoading);
  }

  if (analyzeBtn) {
    analyzeBtn.disabled = isLoading;
    analyzeBtn.classList.toggle('opacity-50', isLoading);
    analyzeBtn.classList.toggle('cursor-not-allowed', isLoading);
  }
}

function updateHealthCircle(healthIndex) {
  if (!healthCircle || !healthIndexValue) {
    return;
  }

  const normalized = Math.min(Math.max(Number(healthIndex) || 0, 0), 100);
  const radius = healthCircle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - normalized / 100);

  healthCircle.style.strokeDasharray = `${circumference} ${circumference}`;
  healthCircle.style.strokeDashoffset = `${offset}`;
  healthIndexValue.textContent = `${normalized}%`;
}

function populateActionPlan(plans = []) {
  if (!actionPlanList) {
    return;
  }

  actionPlanList.innerHTML = '';

  if (!Array.isArray(plans) || plans.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Tidak ada rekomendasi tindakan.';
    li.className = 'text-sm text-slate-600';
    actionPlanList.appendChild(li);
    return;
  }

  plans.forEach((plan) => {
    const li = document.createElement('li');
    li.textContent = plan;
    li.className = 'rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm';
    actionPlanList.appendChild(li);
  });
}

function getHealthLabel(value) {
  const index = Number(value) || 0;
  if (index >= 80) return 'Sangat Sehat';
  if (index >= 60) return 'Sehat';
  if (index >= 40) return 'Perlu Perhatian';
  return 'Berisiko Tinggi';
}

function updateResultPanel(result) {
  if (!result) {
    return;
  }

  if (diagnosisLabel) {
    diagnosisLabel.textContent = result.primary_diagnosis || 'Hasil tidak tersedia';
  }

  if (confidenceLabel) {
    confidenceLabel.textContent = result.confidence !== undefined ? `${Math.round(Number(result.confidence) * 100)}%` : 'N/A';
  }

  if (healthScoreLabel) {
    healthScoreLabel.textContent = `${result.health_index ?? '-'}%`;
  }

  if (riskAssessmentLabel) {
    riskAssessmentLabel.textContent = result.risk_assessment || 'Tidak ada data risiko.';
  }

  if (weatherContextLabel) {
    weatherContextLabel.textContent = result.weather_context
      ? `${result.weather_context.location}, ${result.weather_context.temp}°C, ${result.weather_context.humidity}%` 
      : 'Tidak tersedia';
  }

  if (soilMoistureLabel) {
    soilMoistureLabel.textContent = result.environmental_inference?.soil_moisture || '-';
  }

  if (phLevelLabel) {
    phLevelLabel.textContent = result.environmental_inference?.ph_level || '-';
  }

  updateHealthCircle(result.health_index);

  const healthLabel = document.getElementById('healthIndexLabel');
  if (healthLabel) {
    healthLabel.textContent = getHealthLabel(result.health_index);
  }

  populateActionPlan(result.action_plan);
}

async function analyzeImage() {
  if (!selectedFile) {
    window.alert('Silakan pilih gambar terlebih dahulu sebelum menganalisis.');
    return;
  }

  setLoading(true);

  try {
    const formData = new FormData();
    formData.append('image', selectedFile);

    const response = await fetch('https://project-make-ai-agent.onrender.com/analyze', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let body = '';
      try {
        const json = await response.json();
        body = json.error || JSON.stringify(json);
      } catch {
        body = await response.text();
      }
      throw new Error(`Server returned ${response.status}${body ? `: ${body}` : ''}`);
    }

    const data = await response.json();
    updateResultPanel(data);
  } catch (error) {
    console.error('Error fetching analysis:', error);
    window.alert(`Terjadi kesalahan saat menghubungkan ke backend. ${error.message}`);
  } finally {
    setLoading(false);
  }
}

function toggleSection(sectionId) {
  sections.forEach((section) => {
    section.classList.toggle('hidden', section.id !== sectionId);
  });

  sectionLinks.forEach((link) => {
    if (link.dataset.section === sectionId) {
      link.classList.add('active', 'bg-white/10');
    } else {
      link.classList.remove('active', 'bg-white/10');
    }
  });
}

function initializeSidebarNavigation() {
  sectionLinks.forEach((link) => {
    link.addEventListener('click', () => {
      toggleSection(link.dataset.section);
    });
  });
}

function initializeDropZone() {
  if (!dropZone) {
    return;
  }

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = event.dataTransfer.files?.[0];
    if (file) {
      selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        if (previewImage) {
          previewImage.src = reader.result;
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

function initializeGrowthChart() {
  if (!chartCanvas) {
    return;
  }

  const labels = Array.from({ length: 30 }, (_, index) => `Day ${index + 1}`);
  const data = Array.from({ length: 30 }, (_, index) => Math.round(45 + index * 1.2 + Math.random() * 4));

  growthChart = new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Growth Score',
          data,
          borderColor: '#0B2E26',
          backgroundColor: 'rgba(200,230,100,0.24)',
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: '#C8E664',
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#475569' },
        },
        y: {
          grid: { color: 'rgba(148,163,184,0.24)' },
          ticks: { color: '#475569', beginAtZero: true },
        },
      },
      plugins: {
        legend: {
          labels: { color: '#334155' },
        },
      },
    },
  });
}

function initializeDashboard() {
  initializeSidebarNavigation();
  initializeDropZone();
  initializeGrowthChart();
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', analyzeImage);
  }
  toggleSection('dashboard');
  setLoading(false);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  initializeDashboard();
}
