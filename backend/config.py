from flask import Flask
from flask_pymongo import PyMongo

# 1. Initialize Flask App Instance
app = Flask(__name__)

# 2. Initialize PyMongo connection object (unconnected initially)
# This object will be used by db_utils.py
mongo = PyMongo()