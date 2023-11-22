from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import json

app = Flask(__name__, static_url_path='/frontend', static_folder='frontend')
# Initialize CORS with the app
CORS(app)

# Load the school data from the CSV file
data_dir = '../data/raw/'

school_data = pd.read_csv(data_dir +'school_info.csv')
selected_school_data = school_data[(school_data['SCHSTATUS'] == "Open") & 
                                   (school_data['lat'].notnull()) & 
                                   (school_data['lon'].notnull())]

selected_columns = ['lat', 'lon', "URN", 'name', 'primary', 'secondary','post16', 	'min_age', 	'max_age',	'gender',	'ofsted-score',	'school-type', 'grade' ]

selected_school_data = selected_school_data[selected_columns]


# Read the CSV file and organize the items by sections
school_card = pd.read_csv(data_dir +'school_card.csv')
school_card['num']=school_card.groupby('section').cumcount()
items_by_section = school_card.groupby('section')['name'].apply(list).to_dict()

def get_na(df_filtered, colname):
    return df_filtered[colname].values[0]+", " if not pd.isna(df_filtered[colname].values[0]) else ""

#Read in all csv source files into variables
for file in set(school_card['file']):
    vars()[file.replace(".csv","")]=pd.read_csv(data_dir+file)

def get_school_values(i, URN):

    try:
        df_file=eval(school_card.loc[i, 'file'].replace(".csv",""))
        df_filtered=df_file[(df_file['URN'] == int(URN)) | (df_file['URN'] == str(URN))]
        
        if school_card.loc[i, 'calculated']==0:           
            return str(df_filtered[school_card.loc[i, 'column']].values[0])
        else:             
            return eval(school_card.loc[i, 'column'])
    except:
        return ""


# Create an API endpoint to get the organized items
@app.route('/get-school-info-items')
def get_school_info_items():
    print("items_by_section", items_by_section)
    return jsonify(items_by_section)   
	

@app.route('/schools')
def get_schools():
    # Convert school data to JSON
    schools_json = selected_school_data.to_json(orient='records')
    return jsonify({'schools': schools_json})
	
@app.route('/get-school-info', methods=['POST'])
def get_school_info():
    data = request.get_json()
    URN = data.get('URN')
    response_data = dict(zip([(school_card.loc[i, 'section']+"_"+str(school_card.loc[i, 'num'])) for i in school_card.index],[get_school_values(i, URN) for i in school_card.index]))
    print("response_data", URN, response_data)
    return jsonify(response_data)

if __name__ == '__main__':
    app.run(debug=True)
	

	
