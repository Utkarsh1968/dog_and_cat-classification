import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, RefreshCw, X } from 'lucide-react';
import axios from 'axios';

interface ImageResult {
  id: string;
  image: string;
  prediction: string | null;
  error: string | null;
  isLoading: boolean;
}

function App() {
  const [images, setImages] = useState<ImageResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File): Promise<ImageResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      const id = Math.random().toString(36).substring(7);
      
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        
        try {
          console.log('Sending request to server...');
          const response = await axios.post('http://localhost:5000/predict', {
            image: base64Image
          });
          console.log('Server response:', response.data);
          
          if (response.data.success) {
            console.log('Prediction successful:', response.data.prediction);
            resolve({
              id,
              image: base64Image,
              prediction: response.data.prediction,
              error: null,
              isLoading: false
            });
          } else {
            console.error('Server returned error:', response.data.error);
            resolve({
              id,
              image: base64Image,
              prediction: null,
              error: response.data.error || 'Failed to process image',
              isLoading: false
            });
          }
        } catch (err) {
          console.error('Error processing image:', err);
          resolve({
            id,
            image: base64Image,
            prediction: null,
            error: 'Error connecting to the model server',
            isLoading: false
          });
        }
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Add placeholder entries for loading state
    const newImages = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      image: URL.createObjectURL(file),
      prediction: null,
      error: null,
      isLoading: true
    }));

    setImages(prev => [...prev, ...newImages]);

    // Process all images in parallel
    const results = await Promise.all(files.map(processImage));
    console.log('All images processed:', results);
    
    setImages(prev => {
      const updatedImages = [...prev];
      results.forEach((result, index) => {
        const imageIndex = prev.findIndex(img => img.id === newImages[index].id);
        if (imageIndex !== -1) {
          updatedImages[imageIndex] = {
            ...updatedImages[imageIndex],
            prediction: result.prediction,
            error: result.error,
            isLoading: false
          };
        }
      });
      return updatedImages;
    });
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleReset = () => {
    setImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Pet Classifier
            </h1>
            <p className="text-gray-600">
              Upload multiple photos to identify if they're cats or dogs
            </p>
          </div>

          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              ref={fileInputRef}
              id="imageUpload"
              multiple
            />
            
            {images.length === 0 ? (
              <label
                htmlFor="imageUpload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-600">Click to upload images</p>
                <p className="text-sm text-gray-400 mt-2">Multiple images supported</p>
              </label>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {images.map((img) => (
                    <div key={img.id} className="relative bg-gray-50 p-4 rounded-lg">
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute top-2 right-2 p-1 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                      <div className="relative w-full h-48">
                        <img
                          src={img.image}
                          alt="Uploaded"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>
                      <div className="mt-4 text-center">
                        {img.isLoading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                            <span className="text-gray-600">Analyzing...</span>
                          </div>
                        ) : img.error ? (
                          <div className="text-red-500">{img.error}</div>
                        ) : (
                          <div>
                            <p className="text-lg font-semibold text-gray-800">
                              Result: <span className="text-blue-600">{img.prediction || 'No prediction'}</span>
                            </p>
                            {!img.prediction && (
                              <p className="text-sm text-red-500 mt-1">
                                No prediction received from server
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Clear All Images
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <ImageIcon className="w-8 h-8 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">How it Works</h3>
              <p className="text-gray-600">
                Our AI model analyzes the uploaded images and determines whether each shows
                a cat or a dog using advanced machine learning techniques.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <Upload className="w-8 h-8 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Supported Formats</h3>
              <p className="text-gray-600">
                Upload your images in common formats like JPG, PNG, or WEBP. 
                Make sure each image clearly shows the pet for best results.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;