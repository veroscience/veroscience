from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)

# Initialize CORS with the app
CORS(app)

# Load the school data from the CSV file
school_data = pd.read_csv('../data/raw/school_info.csv')
filtered_school_data = school_data[(school_data['SCHSTATUS'] == "Open") & 
                                   (school_data['lat'].notnull()) & 
                                   (school_data['lon'].notnull())]

selected_columns = ['lat', 'lon', 'name', 'primary', 'secondary',	'post16', 	'min_age', 	'max_age',	'gender',	'ofsted-score',	'school-type' ]



filtered_school_data = filtered_school_data[selected_columns]

@app.route('/schools')
def get_schools():
    # Convert school data to JSON
    schools_json = school_data.to_json(orient='records')
    return jsonify({'schools': schools_json})

if __name__ == '__main__':
    app.run(debug=True)