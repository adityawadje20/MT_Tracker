from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import pymysql

app = Flask(__name__)
CORS(app)

coordinates = []
# Example data structure to store trip states
trips = {}

# Database connection details
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'db': 'mt_tracker',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

# URL of the PHP script
PHP_URL = "http://localhost/server/update_coords.php"


# Function to send data to the PHP script
def send_to_php(vehicle_id, request_id, lat, lng):
    data = {
        'coordinates': [{
            'request_id': request_id,
            'vehicle_id': vehicle_id,
            'lat': lat,
            'lng': lng
        }]
    }
    response = requests.post(PHP_URL, json=data)
    return response.json()

# Function to update trips dictionary based on the database
def update_trips():
    global trips
    try:
        connection = pymysql.connect(**db_config)
        with connection.cursor() as cursor:
            sql = "SELECT request_id, vehicle_id FROM pending_requests WHERE status = 9"
            cursor.execute(sql)
            result = cursor.fetchall()
            trips = {row['request_id']: row['vehicle_id'] for row in result}
    except Exception as e:
        print(f"Error updating trips: {e}")
    finally:
        connection.close()

@app.route('/update_coords', methods=['POST'])
def update_coords():
    update_trips()
    
    data = request.json
    lat = data.get('lat')
    lng = data.get('lng')
    vehicle_id = data.get('ID')
    
    if lat is not None and lng is not None and vehicle_id is not None:
        coordinates.append({'lat': lat, 'lng': lng, 'ID': vehicle_id})
        
        # Check if the vehicle ID is in trips and store coordinates if present
        for request_id, stored_vehicle_id in trips.items():
            if stored_vehicle_id == vehicle_id:
                send_to_php(vehicle_id, request_id, lat, lng)
                break
        return jsonify({"status": "success", "message": "Coordinates received"}), 200
    
    return jsonify({"status": "error", "message": "Invalid data"}), 400

@app.route('/get_coords', methods=['GET'])
def get_coords():
    return jsonify({"coordinates": coordinates})



@app.route('/update_trip_state', methods=['POST'])
def update_trip_state():
    data = request.json
    
    if 'vehicleId' not in data or 'requestId' not in data:
        return jsonify({'status': 'error', 'message': 'Both vehicleId and requestId are required in the request body'}), 400
    
    vehicle_id = data['vehicleId']
    request_id = data['requestId']
    trip_active = data.get('tripActive', False)
    
    if trip_active:
        # Add or update the trip entry with requestId as integer and vehicleId as integer
        trips[int(request_id)] = int(vehicle_id)
    else:
        # Remove the trip entry if tripActive is false
        if int(request_id) in trips:
            del trips[int(request_id)]
    
    # Log trips for debugging
    print('Updated trips:', trips)
    
    return jsonify({'status': 'success', 'message': 'Trip state updated'}), 200




@app.route('/check_trip_state', methods=['GET'])
def check_trip_state():
    vehicle_id_str = request.args.get('vehicleId')
    
    if not vehicle_id_str:
        return jsonify({'status': 'error', 'message': 'vehicleId parameter is required'}), 400
    
    try:
        vehicle_id = int(vehicle_id_str)
    except ValueError:
        return jsonify({'status': 'error', 'message': 'Invalid vehicleId provided. Must be an integer.'}), 400
    
    vehicle_found = False
    request_id = None
    
    for rid, stored_vehicle_id in trips.items():
        if stored_vehicle_id == vehicle_id:
            vehicle_found = True
            request_id = rid
            break

    if vehicle_found:
        return jsonify({'available': True, 'requestId': request_id}), 200
    else:
        return jsonify({'available': False}), 200
        
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
