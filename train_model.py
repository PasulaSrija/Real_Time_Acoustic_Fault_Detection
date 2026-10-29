import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report


data = pd.read_csv(
    "../data/machine_data.csv"
)

X = data.drop(
    columns=["fault"]
)

y = data["fault"]


X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


model = RandomForestClassifier(
    n_estimators=200,
    random_state=42
)


model.fit(
    X_train,
    y_train
)


predictions = model.predict(
    X_test
)


accuracy = accuracy_score(
    y_test,
    predictions
)

print(
    f"Model Accuracy: {accuracy * 100:.2f}%"
)

print(
    classification_report(
        y_test,
        predictions
    )
)


joblib.dump(
    model,
    "model.pkl"
)

print("Model saved as model.pkl")