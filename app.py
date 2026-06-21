import os
import tempfile
from flask import Flask, request, jsonify, send_from_directory
from markitdown import MarkItDown

app = Flask(__name__, static_folder='static')
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # 32MB Max Upload Limit

# Initialize MarkItDown converter
markitdown = MarkItDown()

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/convert', methods=['POST'])
def convert_file():
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file part in the request'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected for uploading'}), 400

    try:
        # Create a temporary file to save the upload
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_path = temp_file.name
            file.save(temp_path)

        # Convert the file using MarkItDown
        # Use convert_local to run local file extraction
        result = markitdown.convert_local(temp_path)
        markdown_content = result.text_content

        # Clean up the temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

        return jsonify({
            'success': True,
            'markdown': markdown_content,
            'filename': file.filename
        })

    except Exception as e:
        # Clean up temp file on error if it was created
        if 'temp_path' in locals() and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    # Bind to 127.0.0.1 and port 5000
    app.run(host='127.0.0.1', port=5000, debug=True)
