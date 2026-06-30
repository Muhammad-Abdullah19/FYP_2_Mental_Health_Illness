import joblib

# Load the file
model1 = joblib.load('label_encoder.joblib')
# View the contents
print(type(model1))
print(model1)
model2 = joblib.load('random_forest.joblib')
# View the contents
print(type(model2))
print(model2)
model3 = joblib.load('tfidf_vectorizer.joblib')
# View the contents
print(type(model3))
print(model3)
model4 = joblib.load('xgboost_severity.joblib')
# View the contents
print(type(model4))
print(model4)
