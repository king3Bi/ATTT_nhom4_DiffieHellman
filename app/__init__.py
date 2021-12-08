from flask import Flask
from flask_socketio import SocketIO

app = Flask(__name__)
app.debug = True
app.config['SECRET_KEY'] = 'mysecret'
socketio = SocketIO(app)
