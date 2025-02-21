from flask import Flask, request, jsonify, session
from models import db, User, Stream, Log, Assignment, ChatKeyword, FlaggedObject
from notifications import send_notification
from detection import visual, audio, chat
from functools import wraps
import threading, time
from datetime import timedelta

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///monitor.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'supersecretkey'
# Session retention for 7 days
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
db.init_app(app)

with app.app_context():
    db.create_all()
    # Create default admin and agent if they don't exist
    if not User.query.filter_by(username='admin').first():
        admin_user = User(username='admin', password='admin', role='admin')
        db.session.add(admin_user)
    if not User.query.filter_by(username='agent').first():
        agent_user = User(username='agent', password='agent', role='agent')
        db.session.add(agent_user)
    db.session.commit()

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

# --- Assignment endpoint (prevents duplicate assignments) ---
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
    # Prevent duplicate assignment:
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
    return jsonify([{'id': log.id, 'timestamp': log.timestamp, 'stream_url': log.stream_url, 'event_type': log.event_type} for log in logs])

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
    return jsonify({'message': 'Agent created successfully', 'agent': {'id': new_agent.id, 'username': new_agent.username}}), 201

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
    return jsonify([{'id': stream.id, 'url': stream.url} for stream in streams])

@app.route('/api/streams', methods=['POST'])
@login_required(role='admin')
def create_stream():
    data = request.get_json() or {}
    url = data.get('url', '').strip()
    if not url:
        return jsonify({'message': 'Stream URL required'}), 400
    if Stream.query.filter_by(url=url).first():
        return jsonify({'message': 'Stream already exists'}), 400
    new_stream = Stream(url=url)
    db.session.add(new_stream)
    db.session.commit()
    return jsonify({'message': 'Stream created successfully', 'stream': {'id': new_stream.id, 'url': new_stream.url}}), 201

@app.route('/api/streams/<int:stream_id>', methods=['PUT'])
@login_required(role='admin')
def update_stream(stream_id):
    data = request.get_json() or {}
    stream = Stream.query.get(stream_id)
    if not stream:
        return jsonify({'message': 'Stream not found'}), 404
    if 'url' in data and data['url'].strip():
        stream.url = data['url'].strip()
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
    return jsonify({'message': 'Keyword added successfully', 'keyword': {'id': new_keyword.id, 'keyword': new_keyword.keyword}}), 201

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
    return jsonify({'message': 'Flagged object added successfully', 'object': {'id': new_object.id, 'object_name': new_object.object_name}}), 201

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

# --- Dashboard endpoints ---
@app.route('/api/dashboard', methods=['GET'])
@login_required(role='admin')
def get_dashboard():
    assignments = Assignment.query.all()
    dashboard_data = []
    for assignment in assignments:
        stream = assignment.stream
        agent = assignment.user
        if stream and agent:
            preview_url = f"https://via.placeholder.com/150?text=Stream+{stream.id}"
            dashboard_data.append({
                "assignment_id": assignment.id,
                "stream_id": stream.id,
                "stream_url": stream.url,
                "preview_url": preview_url,
                "agent_id": agent.id,
                "agent_username": agent.username,
            })
    ongoing_streams = len(set([item["stream_id"] for item in dashboard_data]))
    return jsonify({"ongoing_streams": ongoing_streams, "assignments": dashboard_data})

@app.route('/api/agent/dashboard', methods=['GET'])
@login_required(role='agent')
def get_agent_dashboard():
    agent_id = session['user_id']
    assignments = Assignment.query.filter_by(agent_id=agent_id).all()
    dashboard_data = []
    for assignment in assignments:
        stream = assignment.stream
        if stream:
            preview_url = f"https://via.placeholder.com/150?text=Stream+{stream.id}"
            dashboard_data.append({
                "assignment_id": assignment.id,
                "stream_id": stream.id,
                "stream_url": stream.url,
                "preview_url": preview_url,
            })
    ongoing_streams = len(set([item["stream_id"] for item in dashboard_data]))
    return jsonify({"ongoing_streams": ongoing_streams, "assignments": dashboard_data})

# --- Monitor stream (simulate AI detection) ---
def monitor_stream(stream_url):
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
            log = Log(stream_url=stream_url, event_type=event_type)
            db.session.add(log)
            db.session.commit()
            send_notification(f"{event_type} alert on {stream_url}: {result}")
        time.sleep(10)

def start_monitoring():
    assignments = Assignment.query.all()
    stream_urls = list(set([a.stream.url for a in assignments if a.stream]))
    for url in stream_urls:
        t = threading.Thread(target=monitor_stream, args=(url,))
        t.daemon = True
        t.start()

if __name__ == '__main__':
    with app.app_context():
        start_monitoring()
    app.run(host='0.0.0.0', port=5000)

