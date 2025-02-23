import os
import sys
import json
import threading
import time
from flask import Flask, request, jsonify, session
from urllib.parse import urlparse
from models import db, User, Stream, Log, Assignment, ChatKeyword, FlaggedObject
from notifications import send_notification
from detection import visual, audio, chat
from functools import wraps
from datetime import timedelta
import requests
from bs4 import BeautifulSoup
from werkzeug.utils import secure_filename
import cv2
import base64
import numpy as np
from io import BytesIO
from PIL import Image

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///monitor.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'supersecretkey'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
# For file uploads in visual test (if needed)
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

db.init_app(app)

with app.app_context():
    db.create_all()
    if not User.query.filter_by(username='admin').first():
        admin_user = User(username='admin', password='admin', role='admin')
        db.session.add(admin_user)
    if not User.query.filter_by(username='agent').first():
        agent_user = User(username='agent', password='agent', role='agent')
        db.session.add(agent_user)
    db.session.commit()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def login_required(role=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({'message': 'Authentication required'}), 401
            if role:
                user = User.query.get(session['user_id'])
                if user.role != role:
                    return jsonify({'message': 'Unauthorized'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    print(f"Login attempt: username='{username}', password='{password}'")
    user = User.query.filter_by(username=username, password=password).first()
    if user:
        session.permanent = True
        session['user_id'] = user.id
        return jsonify({'message': 'Login successful', 'role': user.role})
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out'})

@app.route('/api/session', methods=['GET'])
def check_session():
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        if user:
            return jsonify({'logged_in': True, 'user': {'id': user.id, 'username': user.username, 'role': user.role}})
    return jsonify({'logged_in': False}), 401

# --- Assignment endpoint ---
@app.route('/api/assign', methods=['POST'])
@login_required(role='admin')
def assign_stream():
    data = request.get_json()
    agent_id = data.get('agent_id')
    stream_id = data.get('stream_id')
    if not agent_id or not stream_id:
        return jsonify({'message': 'Agent and Stream are required'}), 400
    stream = Stream.query.get(stream_id)
    if not stream:
        return jsonify({'message': 'Stream not found'}), 404
    if Assignment.query.filter_by(agent_id=agent_id, stream_id=stream.id).first():
        return jsonify({'message': 'This stream is already assigned to this agent'}), 400
    assignment = Assignment(agent_id=agent_id, stream_id=stream.id)
    db.session.add(assignment)
    db.session.commit()
    return jsonify({'message': 'Stream assigned successfully'})

@app.route('/api/logs', methods=['GET'])
@login_required()
def get_logs():
    logs = Log.query.all()
    return jsonify([{'id': log.id,
                     'timestamp': log.timestamp,
                     'stream_url': log.room_url,
                     'event_type': log.event_type} for log in logs])

# --- CRUD for Agents ---
@app.route('/api/agents', methods=['GET'])
@login_required(role='admin')
def get_agents():
    agents = User.query.filter_by(role='agent').all()
    return jsonify([{'id': agent.id, 'username': agent.username} for agent in agents])

@app.route('/api/agents', methods=['POST'])
@login_required(role='admin')
def create_agent():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    if not username or not password:
        return jsonify({'message': 'Username and password required'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 400
    new_agent = User(username=username, password=password, role='agent')
    db.session.add(new_agent)
    db.session.commit()
    return jsonify({'message': 'Agent created successfully',
                    'agent': {'id': new_agent.id, 'username': new_agent.username}}), 201

@app.route('/api/agents/<int:agent_id>', methods=['PUT'])
@login_required(role='admin')
def update_agent(agent_id):
    data = request.get_json() or {}
    agent = User.query.filter_by(id=agent_id, role='agent').first()
    if not agent:
        return jsonify({'message': 'Agent not found'}), 404
    if 'username' in data and data['username'].strip():
        agent.username = data['username'].strip()
    if 'password' in data and data['password'].strip():
        agent.password = data['password'].strip()
    db.session.commit()
    return jsonify({'message': 'Agent updated successfully'})

@app.route('/api/agents/<int:agent_id>', methods=['DELETE'])
@login_required(role='admin')
def delete_agent(agent_id):
    agent = User.query.filter_by(id=agent_id, role='agent').first()
    if not agent:
        return jsonify({'message': 'Agent not found'}), 404
    db.session.delete(agent)
    db.session.commit()
    return jsonify({'message': 'Agent deleted successfully'})

# --- CRUD for Streams ---
@app.route('/api/streams', methods=['GET'])
@login_required(role='admin')
def get_streams():
    streams = Stream.query.all()
    return jsonify([{
        'id': stream.id,
        'room_url': stream.room_url,
        'platform': stream.platform,
        'streamer_username': stream.streamer_username
    } for stream in streams])

@app.route('/api/streams', methods=['POST'])
@login_required(role='admin')
def create_stream():
    data = request.get_json() or {}
    room_url = data.get('room_url', '').strip()
    platform = data.get('platform', 'Chaturbate').strip()
    if not room_url:
        return jsonify({'message': 'Room URL is required'}), 400
    if platform.lower() == "chaturbate":
        if "chaturbate.com" not in room_url:
            return jsonify({'message': 'Invalid Chaturbate room URL'}), 400
    elif platform.lower() == "stripchat":
        if "stripchat.com" not in room_url:
            return jsonify({'message': 'Invalid Stripchat room URL'}), 400
    parts = [p for p in room_url.rstrip('/').split('/') if p]
    streamer_username = parts[-1] if parts else ''
    if Stream.query.filter_by(room_url=room_url).first():
        return jsonify({'message': 'Stream already exists'}), 400
    new_stream = Stream(room_url=room_url, platform=platform, streamer_username=streamer_username)
    db.session.add(new_stream)
    db.session.commit()
    return jsonify({'message': 'Stream created successfully',
                    'stream': {
                        'id': new_stream.id,
                        'room_url': new_stream.room_url,
                        'platform': new_stream.platform,
                        'streamer_username': new_stream.streamer_username
                    }}), 201

@app.route('/api/streams/<int:stream_id>', methods=['PUT'])
@login_required(role='admin')
def update_stream(stream_id):
    data = request.get_json() or {}
    stream = Stream.query.get(stream_id)
    if not stream:
        return jsonify({'message': 'Stream not found'}), 404
    if 'room_url' in data and data['room_url'].strip():
        new_room_url = data['room_url'].strip()
        platform = data.get('platform', stream.platform).strip()
        if platform.lower() == "chaturbate":
            if "chaturbate.com" not in new_room_url:
                return jsonify({'message': 'Invalid Chaturbate room URL'}), 400
        elif platform.lower() == "stripchat":
            if "stripchat.com" not in new_room_url:
                return jsonify({'message': 'Invalid Stripchat room URL'}), 400
        stream.room_url = new_room_url
        parts = [p for p in new_room_url.rstrip('/').split('/') if p]
        stream.streamer_username = parts[-1] if parts else ''
    if 'platform' in data and data['platform'].strip():
        stream.platform = data['platform'].strip()
    db.session.commit()
    return jsonify({'message': 'Stream updated successfully'})

@app.route('/api/streams/<int:stream_id>', methods=['DELETE'])
@login_required(role='admin')
def delete_stream(stream_id):
    stream = Stream.query.get(stream_id)
    if not stream:
        return jsonify({'message': 'Stream not found'}), 404
    db.session.delete(stream)
    db.session.commit()
    return jsonify({'message': 'Stream deleted successfully'})

# --- CRUD for Chat Keywords ---
@app.route('/api/keywords', methods=['GET'])
@login_required(role='admin')
def get_keywords():
    keywords = ChatKeyword.query.all()
    return jsonify([{'id': kw.id, 'keyword': kw.keyword} for kw in keywords])

@app.route('/api/keywords', methods=['POST'])
@login_required(role='admin')
def create_keyword():
    data = request.get_json() or {}
    keyword = data.get('keyword', '').strip()
    if not keyword:
        return jsonify({'message': 'Keyword required'}), 400
    if ChatKeyword.query.filter_by(keyword=keyword).first():
        return jsonify({'message': 'Keyword already exists'}), 400
    new_keyword = ChatKeyword(keyword=keyword)
    db.session.add(new_keyword)
    db.session.commit()
    return jsonify({'message': 'Keyword added successfully',
                    'keyword': {'id': new_keyword.id, 'keyword': new_keyword.keyword}}), 201

@app.route('/api/keywords/<int:keyword_id>', methods=['PUT'])
@login_required(role='admin')
def update_keyword(keyword_id):
    data = request.get_json() or {}
    keyword_text = data.get('keyword', '').strip()
    keyword = ChatKeyword.query.get(keyword_id)
    if not keyword:
        return jsonify({'message': 'Keyword not found'}), 404
    if keyword_text:
        keyword.keyword = keyword_text
    db.session.commit()
    return jsonify({'message': 'Keyword updated successfully'})

@app.route('/api/keywords/<int:keyword_id>', methods=['DELETE'])
@login_required(role='admin')
def delete_keyword(keyword_id):
    keyword = ChatKeyword.query.get(keyword_id)
    if not keyword:
        return jsonify({'message': 'Keyword not found'}), 404
    db.session.delete(keyword)
    db.session.commit()
    return jsonify({'message': 'Keyword deleted successfully'})

# --- CRUD for Flagged Objects ---
@app.route('/api/objects', methods=['GET'])
@login_required(role='admin')
def get_objects():
    objects = FlaggedObject.query.all()
    return jsonify([{'id': obj.id, 'object_name': obj.object_name} for obj in objects])

@app.route('/api/objects', methods=['POST'])
@login_required(role='admin')
def create_object():
    data = request.get_json() or {}
    object_name = data.get('object_name', '').strip()
    if not object_name:
        return jsonify({'message': 'Object name required'}), 400
    if FlaggedObject.query.filter_by(object_name=object_name).first():
        return jsonify({'message': 'Object already exists'}), 400
    new_object = FlaggedObject(object_name=object_name)
    db.session.add(new_object)
    db.session.commit()
    return jsonify({'message': 'Flagged object added successfully',
                    'object': {'id': new_object.id, 'object_name': new_object.object_name}}), 201

@app.route('/api/objects/<int:object_id>', methods=['PUT'])
@login_required(role='admin')
def update_object(object_id):
    data = request.get_json() or {}
    object_name = data.get('object_name', '').strip()
    obj = FlaggedObject.query.get(object_id)
    if not obj:
        return jsonify({'message': 'Object not found'}), 404
    if object_name:
        obj.object_name = object_name
    db.session.commit()
    return jsonify({'message': 'Flagged object updated successfully'})

@app.route('/api/objects/<int:object_id>', methods=['DELETE'])
@login_required(role='admin')
def delete_object(object_id):
    obj = FlaggedObject.query.get(object_id)
    if not obj:
        return jsonify({'message': 'Object not found'}), 404
    db.session.delete(obj)
    db.session.commit()
    return jsonify({'message': 'Flagged object deleted successfully'})

# --- Dashboard endpoint for admin ---
@app.route('/api/dashboard', methods=['GET'])
@login_required(role='admin')
def get_dashboard():
    streams = Stream.query.all()
    dashboard_data = []
    for stream in streams:
        assignment = Assignment.query.filter_by(stream_id=stream.id).first()
        dashboard_data.append({
            "stream_id": stream.id,
            "room_url": stream.room_url,
            "platform": stream.platform,
            "streamer_username": stream.streamer_username,
            "agent_id": assignment.agent_id if assignment else None,
            "agent_username": assignment.user.username if assignment else "Unassigned"
        })
    ongoing_streams = len(dashboard_data)
    return jsonify({"ongoing_streams": ongoing_streams, "streams": dashboard_data})

# --- Dashboard endpoint for agent ---
@app.route('/api/agent/dashboard', methods=['GET'])
@login_required(role='agent')
def get_agent_dashboard():
    agent_id = session['user_id']
    assignments = Assignment.query.filter_by(agent_id=agent_id).all()
    dashboard_data = []
    for assignment in assignments:
        stream = assignment.stream
        if stream:
            dashboard_data.append({
                "stream_id": stream.id,
                "room_url": stream.room_url,
                "platform": stream.platform,
                "streamer_username": stream.streamer_username,
            })
    ongoing_streams = len(dashboard_data)
    return jsonify({"ongoing_streams": ongoing_streams, "assignments": dashboard_data})
    
# --- Testing endpoint for visual detection via file upload ---
@app.route('/api/test/visual', methods=['POST'])
@login_required(role='admin')
def test_visual():
    if 'video' not in request.files:
        return jsonify({'message': 'No video file provided'}), 400
    file = request.files['video']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        file.save(file_path)
        cap = cv2.VideoCapture(file_path)
        ret, frame = cap.read()
        cap.release()
        if not ret:
            return jsonify({'message': 'Could not read video file'}), 400
        threshold = float(request.args.get('threshold', 0.5))
        visual.CONF_THRESHOLD = threshold
        results = visual.detect_frame(frame)
        os.remove(file_path)
        return jsonify({'results': results})
    else:
        return jsonify({'message': 'Invalid file format'}), 400

# --- New endpoint for frame-based visual detection ---
@app.route('/api/test/visual/frame', methods=['POST'])
@login_required(role='admin')
def test_visual_frame():
    if 'frame' not in request.files:
        return jsonify({'message': 'No frame file provided'}), 400
    file = request.files['frame']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
    try:
        image = Image.open(file.stream).convert('RGB')
        frame = np.array(image)
        results = visual.detect_frame(frame)
        return jsonify({'results': results})
    except Exception as e:
        return jsonify({'message': f'Error processing frame: {str(e)}'}), 500

# --- New endpoint for real-time visual detection using a hardcoded video ---
@app.route('/api/test/visual/stream', methods=['GET'])
@login_required(role='admin')
def stream_visual():
    def generate():
        cap = cv2.VideoCapture("/home/pc/Downloads/2025-02-22_16-56-53.mp4")
        if not cap.isOpened():
            yield "data: " + json.dumps({"error": "Could not open video file"}) + "\n\n"
            return
        while True:
            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            results = visual.detect_frame(frame)
            yield "data: " + json.dumps(results) + "\n\n"
            time.sleep(0.5)
        cap.release()
    return app.response_class(generate(), mimetype='text/event-stream')

# --- Scraper Endpoint ---
@app.route('/api/scrape', methods=['POST'])
@login_required()
def scrape_chaturbate():
    data = request.get_json() or {}
    room_url = data.get('room_url', '').strip()
    if not room_url:
        return jsonify({'message': 'Room URL is required'}), 400
    if "chaturbate.com" not in room_url:
        return jsonify({'message': 'Invalid Chaturbate URL'}), 400
    try:
        response = requests.get(room_url)
        if response.status_code != 200:
            return jsonify({'message': 'Failed to retrieve the page'}), 400
        soup = BeautifulSoup(response.text, 'html.parser')
        parts = [p for p in room_url.rstrip('/').split('/') if p]
        streamer_username = parts[-1] if parts else ''
        page_title = soup.title.string if soup.title else ''
        return jsonify({
            'room_url': room_url,
            'streamer_username': streamer_username,
            'page_title': page_title
        })
    except Exception as e:
        return jsonify({'message': f'Error scraping URL: {str(e)}'}), 500

# --- Monitor stream (AI detection) ---
def monitor_stream(stream_url):
    with app.app_context():
        while True:
            visual_result = visual.detect(stream_url)
            audio_result = audio.detect(stream_url)
            chat_result = chat.detect(stream_url)
            events = []
            if visual_result:
                events.append(('visual', visual_result))
            if audio_result:
                events.append(('audio', audio_result))
            if chat_result:
                events.append(('chat', chat_result))
            for event_type, result in events:
                log = Log(room_url=stream_url, event_type=event_type)
                db.session.add(log)
                db.session.commit()
                send_notification(f"{event_type} alert on {stream_url}: {result}")
            time.sleep(10)

def start_monitoring():
    assignments = Assignment.query.all()
    stream_urls = list(set([a.stream.room_url for a in assignments if a.stream]))
    for url in stream_urls:
        t = threading.Thread(target=monitor_stream, args=(url,))
        t.daemon = True
        t.start()

if __name__ == '__main__':
    with app.app_context():
        start_monitoring()
    app.run(host='0.0.0.0', port=5000)

