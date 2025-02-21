from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(10), nullable=False)  # 'admin' or 'agent'

class Stream(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(200), unique=True, nullable=False)
    # Accommodate Chaturbate or Stripchat
    platform = db.Column(db.String(50), default='Chaturbate')

class Assignment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    agent_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    stream_id = db.Column(db.Integer, db.ForeignKey('stream.id'), nullable=False)
    user = db.relationship('User', backref='assignments')
    stream = db.relationship('Stream', backref='assignments')

class Log(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    stream_url = db.Column(db.String(200))
    event_type = db.Column(db.String(50))

class ChatKeyword(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    keyword = db.Column(db.String(100), unique=True, nullable=False)

class FlaggedObject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    object_name = db.Column(db.String(100), unique=True, nullable=False)

