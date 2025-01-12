from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from PIL import Image
import io
import base64
import sys
import logging
import tensorflow as tf  # Assuming TensorFlow is used; replace with PyTorch if needed

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Print Python version at startup
logger.info(f"Python version: {sys.version}")

# Initialize Flask app and allow cross-origin requests
app = Flask(__name__)
CORS(app)

try:
    model = tf.keras.models.load_model("D:\ML\cat and dog classification\project-bolt-sb1-pd2bntw5\project\model2.keras")
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {str(e)}")
    raise

def process_image(image):
    """
    Preprocess the image and perform prediction.
    :param image: PIL Image
    :return: Predicted label
    """
    try:
        logger.info("Starting image processing")
        
        # Resize the image to the model's input size
        logger.info("Resizing image to 224x224")
        image = image.resize((256, 256))  # Adjust size as needed for your model
        
        # Convert to array and normalize
        logger.info("Converting image to array and normalizing")
        image_array = np.array(image)
        image_array = image_array / 255.0
        
        # Add batch dimension
        image_array = np.expand_dims(image_array, axis=0)
        
        # Make prediction
        logger.info("Making prediction")
        prediction = model.predict(image_array)[0]  # Model outputs probabilities
        
        # Convert prediction to label
        label = "Dog" if prediction[0] > 0.5 else "Cat"
        confidence = prediction[0] if label == "Dog" else 1 - prediction[0]
        logger.info(f"Prediction complete: {label} with confidence {confidence:.2f}")
        
        return label
    except Exception as e:
        logger.error(f"Error in process_image: {str(e)}")
        raise

@app.route('/predict', methods=['POST'])
def predict():
    try:
        logger.info("Received prediction request")
        
        # Get the base64 image from the request
        data = request.json
        if not data or 'image' not in data:
            logger.error("No image data received")
            return jsonify({
                'success': False,
                'error': 'No image data received'
            }), 400
            
        logger.info("Decoding base64 image")
        image_data = data['image'].split(',')[1]
        image_bytes = base64.b64decode(image_data)
        
        # Convert to PIL Image
        logger.info("Converting to PIL Image")
        image = Image.open(io.BytesIO(image_bytes))
        
        # Process the image and get prediction
        prediction = process_image(image)
        
        logger.info(f"Returning prediction: {prediction}")
        return jsonify({
            'success': True,
            'prediction': prediction
        })

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    logger.info("Starting Flask server on port 5000")
    app.run(port=5000)