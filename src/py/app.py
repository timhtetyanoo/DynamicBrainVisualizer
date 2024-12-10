from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import umap
from sklearn.preprocessing import StandardScaler, Binarizer, Normalizer
app = Flask(__name__)
CORS(app)

def preprocess(raw_data, binarize, binarize_threshold, scale, normalize):
  data = raw_data
  if (scale):
    scaler = StandardScaler()
    data = scaler.fit_transform(data)
  if (normalize):
    normalizer = Normalizer()
    data = normalizer.fit_transform(data)
  if (binarize):
    binarizer = Binarizer(threshold=binarize_threshold)
    data = binarizer.fit_transform(data)
    print(data)
  return data

@app.route('/dimensionality_reduction', methods=['POST'])
def dimensionality_reduction():
  data = request.json
  if 'data' not in data:
    return jsonify({'error': 'data not found'}), 400
  data_array = np.array(data['data'], dtype=object)  # Explicitly set dtype to object
  data_array = np.where(data_array == None, np.nan, data_array)
  data_array = data_array.astype(float)


  umap_params = data.get('umap_params', {})
  n_neighbors = int(umap_params.get('n_neighbors', 15))
  min_dist = float(umap_params.get('min_dist', 0.1))
  metric = umap_params.get('metric', 'cosine')

  preprocess_params = data.get('preprocess_params', {})
  print("Preprocess params:", preprocess_params)
  binarize = preprocess_params.get('binarize', False)
  normalize = preprocess_params.get('normalize', False)
  scale = preprocess_params.get('scale', False)
  binarize_threshold = preprocess_params.get('threshold',50)
  random_state = preprocess_params.get('seed', 0)
  if random_state == 0:
    random_state = None

  reducer = umap.UMAP(random_state=random_state, n_neighbors=n_neighbors, min_dist = min_dist, metric=metric)
  
  data_array = preprocess(data_array, binarize, binarize_threshold, scale, normalize)

  null_mask = np.isnan(data_array).all(axis=1)
  non_null_data = data_array[~null_mask] 
  null_indices = np.where(null_mask)[0]
  print("Indices where null_mask is true:", null_indices)
  embedding = reducer.fit_transform(non_null_data)
  output_array = np.full((data_array.shape[0], 2), None)  # Initialize with NaNs
  output_array[~null_mask] = embedding  # Fill in the reduced data
  
  output = jsonify(output_array.tolist())
  return output


if __name__ == '__main__':
  app.run(debug=True)


  #CHECK BINARIZE THRESHOLD
  #SET RANDOM SEED TO MAKE SURE IT IS DETERMINISITC