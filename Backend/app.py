import os
import requests
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Mengizinkan akses dari domain Vercel spesifik atau semua domain
CORS(app) 

# --- KONFIGURASI API KEY ----
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY")

# Inisialisasi Gemini
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

def get_weather_context(location):
    """Mengambil data cuaca real-time untuk memperkuat reasoning AI"""
    # Perbaikan: Menggunakan domain yang benar (weatherapi.com)
    base_url = "http://api.weatherapi.com/v1/current.json"
    params = {
        "key": WEATHER_API_KEY,
        "q": location,
        "aqi": "no"
    }
    try:
        response = requests.get(base_url, params=params, timeout=10) # Tambahkan timeout
        if response.status_code == 200:
            data = response.json()
            return {
                "temp": data['current']['temp_c'],
                "humidity": data['current']['humidity'],
                "condition": data['current']['condition']['text'],
                "city": data['location']['name']
            }
    except Exception as e:
        print(f"Weather API Error: {e}")
    return None

@app.route('/analyze', methods=['POST'])
def analyze_onion():
    try:
        # 1. Ambil Input
        if 'image' not in request.files:
            return jsonify({"error": "Silakan unggah foto daun bawang"}), 400
            
        img_file = request.files['image']
        user_location = request.form.get('location', 'Brebes, Central Java')

        # 2. Ambil Konteks Cuaca Lokal
        weather = get_weather_context(user_location)
        weather_str = "Data tidak tersedia"
        if weather:
            weather_str = f"Suhu: {weather['temp']}C, Kelembapan: {weather['humidity']}%, Kondisi: {weather['condition']}"

        # 3. Siapkan Prompt
        # Gunakan format yang lebih ketat agar Gemini tidak memberikan teks tambahan
        prompt = f"""
        Role: Anda adalah AgriMind AI Agent, pakar agronomi bawang merah di {user_location}.
        Konteks Lingkungan Saat Ini: {weather_str}.
        
        Tugas:
        1. Analisis foto daun bawang secara visual.
        2. Lakukan reasoning hubungan gejala visual dengan cuaca.
        3. Berikan diagnosa dan langkah konkret.

        Berikan respons HANYA dalam format JSON:
        {{
            "health_index": 0-100,
            "confidence": 0.0-1.0,
            "primary_diagnosis": "string",
            "risk_assessment": "string",
            "environmental_inference": {{
                "soil_moisture": "string",
                "ph_level": "string"
            }},
            "action_plan": ["string"],
            "weather_context": {{
                "location": "{user_location}",
                "temp": "{weather['temp'] if weather else 'N/A'}",
                "humidity": "{weather['humidity'] if weather else 'N/A'}"
            }}
        }}
        """

        # 4. Proses Gambar dan Kirim ke Gemini
        img_data = img_file.read()
        image_part = {
            "mime_type": img_file.content_type,
            "data": img_data
        }

        response = model.generate_content([prompt, image_part])
        
        # Bersihkan response teks dari markdown block
        clean_json = response.text.replace('```json', '').replace('```', '').strip()

        # Pastikan return dalam format JSON asli Flask agar header Content-Type benar
        import json
        response_data = json.loads(clean_json)

        # Tambahkan confidence jika tidak disediakan oleh model
        if 'confidence' not in response_data:
            response_data['confidence'] = 0.75

        # Pastikan confidence berbentuk angka float
        try:
            response_data['confidence'] = float(response_data['confidence'])
        except (ValueError, TypeError):
            response_data['confidence'] = 0.75

        return jsonify(response_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def home():
    return jsonify({"status": "AgriMind AI Backend is Running"}), 200

if __name__ == '__main__':
    # Render membutuhkan port dari environment variable
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
