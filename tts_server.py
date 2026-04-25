from flask import Flask, request, jsonify
from flask_cors import CORS
from gtts import gTTS
import os

app = Flask(__name__)
CORS(app)

@app.route('/speak', methods=['POST'])
def speak():
    data = request.get_json()
    text = data.get('text', '')
    if not text:
        return jsonify({'error': 'no text provided'}), 400
    tts = gTTS(text, lang='ne')
    tts.save('/tmp/response.mp3')
    os.system('mpg123 /tmp/response.mp3')
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(port=5050)
